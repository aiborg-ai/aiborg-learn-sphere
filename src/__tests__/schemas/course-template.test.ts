import { describe, it, expect } from 'vitest';
import {
  CourseTemplateSchema,
  validateCourseTemplate,
  checkCourseDuplicates
} from '@/lib/schemas/course-template.schema';

describe('CourseTemplateSchema', () => {
  describe('Required Fields Validation', () => {
    it('should reject course with missing title', () => {
      const course = {
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].field).toBe('title');
    });

    it('should reject course with empty title', () => {
      const course = {
        title: '',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('title');
    });

    it('should reject course with short description', () => {
      const course = {
        title: 'Test Course',
        description: 'Too short',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('description');
      expect(result.errors![0].message).toContain('at least 10 characters');
    });

    it('should reject course without audiences', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: [],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toContain('audiences');
    });

    it('should reject course without features', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: [],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toContain('features');
    });

    it('should reject course without keywords', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: [],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toContain('keywords');
    });
  });

  describe('Enum Validation', () => {
    it('should reject invalid audience type', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['InvalidAudience'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].code).toBe('invalid_enum_value');
    });

    it('should reject invalid mode', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'InvalidMode',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toContain('mode');
    });

    it('should reject invalid level', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Expert',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toContain('level');
    });

    it('should accept all valid audience types', () => {
      const validAudiences = ['Primary', 'Secondary', 'Professional', 'Business'];

      validAudiences.forEach(audience => {
        const course = {
          title: 'Test Course',
          description: 'Test description that is long enough',
          audiences: [audience],
          mode: 'Online',
          duration: '4 weeks',
          price: 'Free',
          level: 'Beginner',
          start_date: '2025-03-01',
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        };

        const result = validateCourseTemplate(course);
        expect(result.success).toBe(true);
      });
    });

    it('should accept all valid modes', () => {
      const validModes = ['Online', 'Offline', 'Hybrid'];

      validModes.forEach(mode => {
        const course = {
          title: 'Test Course',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode,
          duration: '4 weeks',
          price: 'Free',
          level: 'Beginner',
          start_date: '2025-03-01',
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        };

        const result = validateCourseTemplate(course);
        expect(result.success).toBe(true);
      });
    });

    it('should accept all valid levels', () => {
      const validLevels = ['Beginner', 'Intermediate', 'Advanced'];

      validLevels.forEach(level => {
        const course = {
          title: 'Test Course',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode: 'Online',
          duration: '4 weeks',
          price: 'Free',
          level,
          start_date: '2025-03-01',
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        };

        const result = validateCourseTemplate(course);
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Date Validation', () => {
    it('should accept valid date format YYYY-MM-DD', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-12-31',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(true);
    });

    it('should accept flexible dates', () => {
      const flexibleDates = ['Flexible', 'Coming Soon', 'TBD'];

      flexibleDates.forEach(date => {
        const course = {
          title: 'Test Course',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode: 'Online',
          duration: '4 weeks',
          price: 'Free',
          level: 'Beginner',
          start_date: date,
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        };

        const result = validateCourseTemplate(course);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid date format', () => {
      const invalidDates = [
        '01/02/2025',
        '2025/02/01',
        '01-02-2025',
        '2025.02.01',
        'January 1, 2025',
        '2025-13-01', // Invalid month
        '2025-02-30', // Invalid day
        'Random Text'
      ];

      invalidDates.forEach(date => {
        const course = {
          title: 'Test Course',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode: 'Online',
          duration: '4 weeks',
          price: 'Free',
          level: 'Beginner',
          start_date: date,
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        };

        const result = validateCourseTemplate(course);
        expect(result.success).toBe(false);
        expect(result.errors![0].message).toContain('date');
      });
    });

    it('should validate end_date is after start_date', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-15',
        end_date: '2025-03-01', // Before start_date
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('End date must be after');
    });

    it('should accept end_date equal to start_date', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: 'Full day',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-15',
        end_date: '2025-03-15',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(true);
    });
  });

  describe('Price Validation', () => {
    it('should accept "Free"', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(true);
    });

    it('should accept various currency formats', () => {
      const validPrices = [
        '₹5000',
        '₹15,000',
        '$99',
        '$1,299',
        '€50',
        '£75',
        '¥1000',
        '₹1000 - ₹2000',
        '$99 - $199'
      ];

      validPrices.forEach(price => {
        const course = {
          title: 'Test Course',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode: 'Online',
          duration: '4 weeks',
          price,
          level: 'Beginner',
          start_date: '2025-03-01',
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        };

        const result = validateCourseTemplate(course);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid price formats', () => {
      const invalidPrices = [
        'Random',
        'ABC123',
        '$$$$',
        '5000', // Missing currency symbol
        'Rs.5000', // Invalid currency format
        'USD 100'
      ];

      invalidPrices.forEach(price => {
        const course = {
          title: 'Test Course',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode: 'Online',
          duration: '4 weeks',
          price,
          level: 'Beginner',
          start_date: '2025-03-01',
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        };

        const result = validateCourseTemplate(course);
        expect(result.success).toBe(false);
        expect(result.errors![0].message).toContain('price');
      });
    });
  });

  describe('Duration Validation', () => {
    it('should accept valid duration formats', () => {
      const validDurations = [
        '2 hours',
        '4 weeks',
        '3 months',
        '1 day',
        '10 days',
        'Half day',
        'Full day',
        '30 minutes',
        '1 hour',
        '6 weeks',
        '2 months'
      ];

      validDurations.forEach(duration => {
        const course = {
          title: 'Test Course',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode: 'Online',
          duration,
          price: 'Free',
          level: 'Beginner',
          start_date: '2025-03-01',
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        };

        const result = validateCourseTemplate(course);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid duration formats', () => {
      const invalidDurations = [
        'random',
        '123',
        'abc hours',
        'two weeks',
        '3.5 months',
        ''
      ];

      invalidDurations.forEach(duration => {
        const course = {
          title: 'Test Course',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode: 'Online',
          duration,
          price: 'Free',
          level: 'Beginner',
          start_date: '2025-03-01',
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        };

        const result = validateCourseTemplate(course);
        expect(result.success).toBe(false);
        expect(result.errors![0].message).toContain('duration');
      });
    });
  });

  describe('Array Field Validation', () => {
    it('should accept multiple audiences', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student', 'Professional', 'Business'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(true);
    });

    it('should reject more than 4 audiences', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Primary', 'Secondary', 'Professional', 'Business', 'Extra'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Maximum 4 audiences');
    });

    it('should reject more than 20 features', () => {
      const features = Array(21).fill('Feature');
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features,
        keywords: ['test'],
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Maximum 20 features');
    });

    it('should reject more than 30 keywords', () => {
      const keywords = Array(31).fill('keyword');
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords,
        category: 'Technology'
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Maximum 30 keywords');
    });
  });

  describe('Optional Fields Validation', () => {
    it('should accept valid instructor_info', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology',
        instructor_info: {
          name: 'John Doe',
          email: 'john@example.com',
          bio: 'Experienced instructor',
          expertise: ['JavaScript', 'React'],
          linkedin: 'https://linkedin.com/in/johndoe',
          photo_url: 'https://example.com/photo.jpg'
        }
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email in instructor_info', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology',
        instructor_info: {
          name: 'John Doe',
          email: 'invalid-email',
          bio: 'Experienced instructor'
        }
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('email');
    });

    it('should accept valid course_materials', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology',
        course_materials: [
          {
            title: 'Introduction Video',
            type: 'video',
            url: 'https://example.com/video.mp4',
            description: 'Welcome video',
            duration: '10 minutes',
            order_index: 1,
            is_preview: true,
            is_mandatory: true
          },
          {
            title: 'Course Handbook',
            type: 'document',
            url: 'https://example.com/handbook.pdf',
            order_index: 2,
            is_mandatory: true
          }
        ]
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(true);
    });

    it('should reject invalid URL in course_materials', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology',
        course_materials: [
          {
            title: 'Introduction Video',
            type: 'video',
            url: 'not-a-url',
            order_index: 1
          }
        ]
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('URL');
    });
  });

  describe('Number Field Validation', () => {
    it('should accept valid min and max students', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology',
        min_students: 10,
        max_students: 50
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(true);
    });

    it('should reject min_students greater than max_students', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology',
        min_students: 50,
        max_students: 10
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Minimum students must be less than or equal');
    });

    it('should accept sort_order', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology',
        sort_order: 5
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(true);
    });

    it('should reject negative sort_order', () => {
      const course = {
        title: 'Test Course',
        description: 'Test description that is long enough',
        audiences: ['Student'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology',
        sort_order: -1
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('non-negative');
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate course titles', () => {
      const courses = [
        {
          title: 'Same Course',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode: 'Online',
          duration: '4 weeks',
          price: 'Free',
          level: 'Beginner',
          start_date: '2025-03-01',
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        },
        {
          title: 'Same Course',
          description: 'Different description that is long enough',
          audiences: ['Professional'],
          mode: 'Offline',
          duration: '8 weeks',
          price: '₹5000',
          level: 'Advanced',
          start_date: '2025-04-01',
          features: ['Feature 2'],
          keywords: ['different'],
          category: 'Business'
        }
      ];

      const result = checkCourseDuplicates(courses);
      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0].field).toBe('title');
      expect(result.duplicates[0].indices).toEqual([0, 1]);
    });

    it('should detect duplicate course title and start_date combination', () => {
      const courses = [
        {
          title: 'Test Course',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode: 'Online',
          duration: '4 weeks',
          price: 'Free',
          level: 'Beginner',
          start_date: '2025-03-01',
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        },
        {
          title: 'Test Course',
          description: 'Different description that is long enough',
          audiences: ['Professional'],
          mode: 'Offline',
          duration: '8 weeks',
          price: '₹5000',
          level: 'Advanced',
          start_date: '2025-03-01',
          features: ['Feature 2'],
          keywords: ['different'],
          category: 'Business'
        }
      ];

      const result = checkCourseDuplicates(courses);
      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates.some(d => d.field === 'title + start_date')).toBe(true);
    });

    it('should not flag courses with different titles as duplicates', () => {
      const courses = [
        {
          title: 'Course One',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode: 'Online',
          duration: '4 weeks',
          price: 'Free',
          level: 'Beginner',
          start_date: '2025-03-01',
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        },
        {
          title: 'Course Two',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode: 'Online',
          duration: '4 weeks',
          price: 'Free',
          level: 'Beginner',
          start_date: '2025-03-01',
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        }
      ];

      const result = checkCourseDuplicates(courses);
      expect(result.hasDuplicates).toBe(false);
      expect(result.duplicates).toHaveLength(0);
    });

    it('should handle case-insensitive duplicate detection', () => {
      const courses = [
        {
          title: 'Test Course',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode: 'Online',
          duration: '4 weeks',
          price: 'Free',
          level: 'Beginner',
          start_date: '2025-03-01',
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        },
        {
          title: 'TEST COURSE',
          description: 'Test description that is long enough',
          audiences: ['Student'],
          mode: 'Online',
          duration: '4 weeks',
          price: 'Free',
          level: 'Beginner',
          start_date: '2025-03-01',
          features: ['Feature 1'],
          keywords: ['test'],
          category: 'Technology'
        }
      ];

      const result = checkCourseDuplicates(courses);
      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates[0].indices).toEqual([0, 1]);
    });
  });
});