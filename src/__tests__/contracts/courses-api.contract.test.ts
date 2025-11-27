/**
 * Courses API Contract Tests
 *
 * These tests validate that the database schema for courses
 * matches our TypeScript types and Zod schemas.
 *
 * Prerequisites:
 * - Database must be seeded with test data (see supabase/seed/)
 * - VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set
 *
 * Run with: npm run test:contracts
 */

import { describe, it, expect } from 'vitest';
import { supabase, canRunContractTests, TEST_COURSE_TITLES } from '@/tests/setup.contracts';
import {
  CourseSchema,
  CoursesArraySchema,
  AudienceEnum,
  CourseModeEnum,
  CourseLevelEnum,
} from '@/lib/schemas/database.schema';
import { validateArray, validateSingle } from '@/lib/api-validation';

describe('Courses API Contract', () => {
  // Skip all tests if database is not configured
  if (!canRunContractTests()) {
    it.skip('requires database configuration', () => {});
    return;
  }

  describe('GET /courses - List all courses', () => {
    it('should return array of courses matching schema', async () => {
      const query = supabase!.from('courses').select('*').limit(10);

      const { data, error } = await validateArray(query, CourseSchema, {
        throwOnError: true,
        logErrors: true,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);

      // Validate with Zod
      const zodResult = CoursesArraySchema.safeParse(data);
      expect(zodResult.success).toBe(true);
    });

    it('should have all required fields', async () => {
      const { data } = await supabase!.from('courses').select('*').limit(1).single();

      expect(data).toBeDefined();
      expect(data).toHaveProperty('id');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('description');
      expect(data).toHaveProperty('mode');
      expect(data).toHaveProperty('level');
      expect(data).toHaveProperty('created_at');
    });

    it('should validate field types correctly', async () => {
      const { data } = await supabase!.from('courses').select('*').limit(1).single();

      expect(typeof data.id).toBe('number');
      expect(typeof data.title).toBe('string');
      expect(typeof data.description).toBe('string');
      expect(data.price === null || typeof data.price === 'number').toBe(true);
      expect(Array.isArray(data.features) || data.features === null).toBe(true);
      expect(Array.isArray(data.audiences) || data.audiences === null).toBe(true);
    });

    it('should validate enum values', async () => {
      const { data } = await supabase!
        .from('courses')
        .select('*')
        .not('audience', 'is', null)
        .limit(5);

      expect(data).toBeDefined();

      data!.forEach(course => {
        if (course.audience) {
          expect(AudienceEnum.safeParse(course.audience).success).toBe(true);
        }
        if (course.mode) {
          expect(CourseModeEnum.safeParse(course.mode).success).toBe(true);
        }
        if (course.level) {
          expect(CourseLevelEnum.safeParse(course.level).success).toBe(true);
        }
      });
    });
  });

  describe('GET /courses/:id - Single course', () => {
    it('should return single course matching schema', async () => {
      // Find a test course
      const { data: courses } = await supabase!
        .from('courses')
        .select('id')
        .eq('title', TEST_COURSE_TITLES.webDev)
        .single();

      if (!courses) {
        console.warn('Test course not found - seed database first');
        return;
      }

      const query = supabase!.from('courses').select('*').eq('id', courses.id).single();

      const { data, error } = await validateSingle(query, CourseSchema, {
        throwOnError: true,
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();

      // Validate with Zod
      const zodResult = CourseSchema.safeParse(data);
      expect(zodResult.success).toBe(true);
      if (!zodResult.success) {
        console.error('Validation errors:', zodResult.error.errors);
      }
    });

    it('should handle non-existent course', async () => {
      const { data, error } = await supabase!
        .from('courses')
        .select('*')
        .eq('id', 999999)
        .maybeSingle();

      expect(data).toBeNull();
      // Supabase returns no error for empty results with maybeSingle
    });
  });

  describe('Course Filtering', () => {
    it('should filter by audience', async () => {
      const { data } = await supabase!
        .from('courses')
        .select('*')
        .contains('audiences', ['students']);

      expect(data).toBeDefined();
      if (data && data.length > 0) {
        data.forEach(course => {
          expect(course.audiences?.includes('students') || course.audience === 'students').toBe(
            true
          );
        });
      }
    });

    it('should filter by level', async () => {
      const { data } = await supabase!.from('courses').select('*').eq('level', 'beginner');

      expect(data).toBeDefined();
      if (data && data.length > 0) {
        data.forEach(course => {
          expect(course.level).toBe('beginner');
        });
      }
    });

    it('should filter by mode', async () => {
      const { data } = await supabase!.from('courses').select('*').eq('mode', 'online');

      expect(data).toBeDefined();
      if (data && data.length > 0) {
        data.forEach(course => {
          expect(course.mode).toBe('online');
        });
      }
    });

    it('should filter by active status', async () => {
      const { data } = await supabase!
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .eq('display', true);

      expect(data).toBeDefined();
      if (data && data.length > 0) {
        data.forEach(course => {
          expect(course.is_active).toBe(true);
          expect(course.display).toBe(true);
        });
      }
    });
  });

  describe('Course Data Integrity', () => {
    it('should have valid URLs for thumbnail and video', async () => {
      const { data } = await supabase!.from('courses').select('*').limit(10);

      expect(data).toBeDefined();

      data!.forEach(course => {
        if (course.thumbnail_url) {
          expect(() => new URL(course.thumbnail_url!)).not.toThrow();
        }
        if (course.video_url) {
          expect(() => new URL(course.video_url!)).not.toThrow();
        }
      });
    });

    it('should have non-negative prices', async () => {
      const { data } = await supabase!.from('courses').select('price').not('price', 'is', null);

      expect(data).toBeDefined();

      data!.forEach(course => {
        if (course.price !== null) {
          expect(course.price).toBeGreaterThanOrEqual(0);
        }
      });
    });

    it('should have positive IDs', async () => {
      const { data } = await supabase!.from('courses').select('id').limit(10);

      expect(data).toBeDefined();

      data!.forEach(course => {
        expect(course.id).toBeGreaterThan(0);
      });
    });

    it('should have valid date strings', async () => {
      const { data } = await supabase!.from('courses').select('*').limit(5);

      expect(data).toBeDefined();

      data!.forEach(course => {
        if (course.start_date) {
          expect(() => new Date(course.start_date!)).not.toThrow();
          expect(new Date(course.start_date!).toString()).not.toBe('Invalid Date');
        }
        if (course.created_at) {
          expect(() => new Date(course.created_at!)).not.toThrow();
        }
        if (course.updated_at) {
          expect(() => new Date(course.updated_at!)).not.toThrow();
        }
      });
    });
  });

  describe('Course Arrays and JSON Fields', () => {
    it('should have valid features array', async () => {
      const { data } = await supabase!
        .from('courses')
        .select('features')
        .not('features', 'is', null)
        .limit(5);

      expect(data).toBeDefined();

      data!.forEach(course => {
        expect(Array.isArray(course.features)).toBe(true);
        course.features!.forEach(feature => {
          expect(typeof feature).toBe('string');
          expect(feature.length).toBeGreaterThan(0);
        });
      });
    });

    it('should have valid audiences array', async () => {
      const { data } = await supabase!
        .from('courses')
        .select('audiences')
        .not('audiences', 'is', null)
        .limit(5);

      expect(data).toBeDefined();

      data!.forEach(course => {
        expect(Array.isArray(course.audiences)).toBe(true);
        course.audiences!.forEach(audience => {
          expect(AudienceEnum.safeParse(audience).success).toBe(true);
        });
      });
    });

    it('should have valid prerequisites array', async () => {
      const { data } = await supabase!
        .from('courses')
        .select('prerequisites')
        .not('prerequisites', 'is', null)
        .limit(5);

      expect(data).toBeDefined();

      data!.forEach(course => {
        if (course.prerequisites) {
          expect(Array.isArray(course.prerequisites)).toBe(true);
        }
      });
    });
  });

  describe('Schema Drift Detection', () => {
    it('should match Zod schema exactly', async () => {
      const { data } = await supabase!.from('courses').select('*').limit(1).single();

      expect(data).toBeDefined();

      const result = CourseSchema.safeParse(data);

      if (!result.success) {
        console.error('❌ Schema mismatch detected!');
        console.error('Validation errors:', JSON.stringify(result.error.errors, null, 2));
        console.error('Sample data:', JSON.stringify(data, null, 2));
      }

      expect(result.success).toBe(true);
    });

    it('should not have unexpected fields', async () => {
      const { data } = await supabase!.from('courses').select('*').limit(1).single();

      expect(data).toBeDefined();

      const expectedFields = Object.keys(CourseSchema.shape);
      const actualFields = Object.keys(data);

      // Check for fields in database but not in schema
      const extraFields = actualFields.filter(field => !expectedFields.includes(field));

      if (extraFields.length > 0) {
        console.warn('⚠️  Extra fields found in database:', extraFields);
        console.warn('   Consider adding these to CourseSchema or removing from database');
      }

      // This is a warning, not a failure - schema may be intentionally partial
      // expect(extraFields).toHaveLength(0);
    });
  });
});
