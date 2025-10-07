import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';
const functionUrl = `${supabaseUrl}/functions/v1/validate-template`;

describe('validate-template Edge Function Integration Tests', () => {
  let supabase: SupabaseClient;
  let authToken: string;

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token for testing
    const {
      data: { session },
    } = await supabase.auth.getSession();
    authToken = session?.access_token || '';
  });

  describe('Course Template Validation', () => {
    it('should validate a valid course template', async () => {
      const validCourse = {
        type: 'course',
        data: [
          {
            title: 'Test Course',
            description: 'A test course for validation',
            audiences: ['Student'],
            mode: 'Online',
            duration: '4 weeks',
            price: '₹5000',
            level: 'Beginner',
            start_date: '2025-04-01',
            features: ['Videos', 'Assignments'],
            keywords: ['test', 'validation'],
            category: 'Technology',
          },
        ],
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(validCourse),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.valid).toBe(1);
      expect(result.invalid).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid course fields', async () => {
      const invalidCourse = {
        type: 'course',
        data: [
          {
            title: '', // Empty title
            description: 'A test course',
            audiences: ['Invalid'], // Invalid audience
            mode: 'InvalidMode', // Invalid mode
            duration: '4 weeks',
            price: 'abc123', // Invalid price format
            level: 'Expert', // Invalid level
            start_date: 'invalid-date', // Invalid date
            features: [],
            keywords: [],
            category: 'InvalidCategory', // Invalid category
          },
        ],
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(invalidCourse),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.valid).toBe(0);
      expect(result.invalid).toBe(1);
      expect(result.errors).not.toHaveLength(0);
      expect(result.errors[0].errors).toContain('title');
    });

    it('should detect duplicate courses', async () => {
      const duplicateCourses = {
        type: 'course',
        data: [
          {
            title: 'Duplicate Course',
            description: 'First instance',
            audiences: ['Student'],
            mode: 'Online',
            duration: '4 weeks',
            price: '₹5000',
            level: 'Beginner',
            start_date: '2025-04-01',
            features: ['Videos'],
            keywords: ['test'],
            category: 'Technology',
          },
          {
            title: 'duplicate course', // Case-insensitive duplicate
            description: 'Second instance',
            audiences: ['Professional'],
            mode: 'Offline',
            duration: '6 weeks',
            price: '₹8000',
            level: 'Intermediate',
            start_date: '2025-05-01',
            features: ['Projects'],
            keywords: ['duplicate'],
            category: 'Business',
          },
        ],
        options: {
          checkDuplicates: true,
        },
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(duplicateCourses),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.duplicates).toHaveLength(1);
      expect(result.duplicates[0].title).toBe('duplicate course');
    });

    it('should validate batch of courses', async () => {
      const batchCourses = {
        type: 'course',
        data: Array(10)
          .fill(null)
          .map((_, i) => ({
            title: `Course ${i + 1}`,
            description: `Description for course ${i + 1}`,
            audiences: ['Student', 'Professional'],
            mode: i % 2 === 0 ? 'Online' : 'Hybrid',
            duration: `${(i + 1) * 2} weeks`,
            price: `₹${(i + 1) * 1000}`,
            level: ['Beginner', 'Intermediate', 'Advanced'][i % 3],
            start_date: `2025-0${(i % 9) + 1}-01`,
            features: ['Videos', 'Quizzes', 'Certificate'],
            keywords: ['batch', 'test', `course${i}`],
            category: ['Technology', 'Business', 'Design'][i % 3],
          })),
        options: {
          batchMode: true,
        },
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(batchCourses),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.valid).toBe(10);
      expect(result.invalid).toBe(0);
      expect(result.total).toBe(10);
    });
  });

  describe('Event Template Validation', () => {
    it('should validate a valid event template', async () => {
      const validEvent = {
        type: 'event',
        data: [
          {
            name: 'Test Workshop',
            description: 'A test workshop event',
            event_type: 'workshop',
            date: '2025-03-15',
            time: '10:00',
            duration: '3 hours',
            location: 'Online',
            max_attendees: 50,
            price: '₹2000',
            category: 'Technology',
          },
        ],
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(validEvent),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.valid).toBe(1);
      expect(result.invalid).toBe(0);
    });

    it('should detect invalid event fields', async () => {
      const invalidEvent = {
        type: 'event',
        data: [
          {
            name: '', // Empty name
            description: 'Test event',
            event_type: 'party', // Invalid type
            date: 'not-a-date', // Invalid date
            price: 'invalid', // Invalid price
            category: 'Unknown', // Invalid category
          },
        ],
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(invalidEvent),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.valid).toBe(0);
      expect(result.invalid).toBe(1);
      expect(result.errors[0].errors).toContain('name');
    });

    it('should detect duplicate events', async () => {
      const duplicateEvents = {
        type: 'event',
        data: [
          {
            name: 'AI Workshop',
            description: 'First workshop',
            event_type: 'workshop',
            date: '2025-03-15',
            price: '₹2000',
            category: 'Technology',
          },
          {
            name: 'ai workshop', // Case-insensitive duplicate
            description: 'Second workshop',
            event_type: 'workshop',
            date: '2025-03-15', // Same date
            price: '₹3000',
            category: 'Business',
          },
        ],
        options: {
          checkDuplicates: true,
        },
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(duplicateEvents),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.duplicates).toHaveLength(1);
    });
  });

  describe('Validation Options', () => {
    it('should skip duplicate checking when disabled', async () => {
      const data = {
        type: 'course',
        data: [
          {
            title: 'Same Course',
            description: 'First',
            audiences: ['Student'],
            mode: 'Online',
            duration: '4 weeks',
            price: '₹5000',
            level: 'Beginner',
            start_date: '2025-04-01',
            features: ['Videos'],
            keywords: ['test'],
            category: 'Technology',
          },
          {
            title: 'Same Course',
            description: 'Second',
            audiences: ['Student'],
            mode: 'Online',
            duration: '4 weeks',
            price: '₹5000',
            level: 'Beginner',
            start_date: '2025-04-01',
            features: ['Videos'],
            keywords: ['test'],
            category: 'Technology',
          },
        ],
        options: {
          checkDuplicates: false,
        },
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.duplicates).toBeUndefined();
      expect(result.valid).toBe(2);
    });

    it('should validate dependencies when enabled', async () => {
      const data = {
        type: 'course',
        data: [
          {
            title: 'Advanced Course',
            description: 'Requires prerequisites',
            audiences: ['Professional'],
            mode: 'Online',
            duration: '8 weeks',
            price: '₹15000',
            level: 'Advanced',
            start_date: '2025-06-01',
            features: ['Videos', 'Projects'],
            keywords: ['advanced'],
            category: 'Technology',
            prerequisites: ['Basic Programming', 'Data Structures'], // These would be validated
          },
        ],
        options: {
          validateDependencies: true,
        },
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });

      const _result = await response.json();

      expect(response.ok).toBe(true);
      // Dependencies validation would check if prerequisites exist
    });
  });

  describe('Error Handling', () => {
    it('should handle missing authentication', async () => {
      const data = {
        type: 'course',
        data: [
          {
            title: 'Test Course',
            description: 'Test',
            audiences: ['Student'],
            mode: 'Online',
            duration: '4 weeks',
            price: '₹5000',
            level: 'Beginner',
            start_date: '2025-04-01',
            features: ['Videos'],
            keywords: ['test'],
            category: 'Technology',
          },
        ],
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // No Authorization header
        },
        body: JSON.stringify(data),
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(401);
    });

    it('should handle invalid JSON', async () => {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: 'invalid json {',
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should handle missing type parameter', async () => {
      const data = {
        // Missing 'type' field
        data: [
          {
            title: 'Test Course',
            description: 'Test',
            audiences: ['Student'],
            mode: 'Online',
            duration: '4 weeks',
            price: '₹5000',
            level: 'Beginner',
            start_date: '2025-04-01',
            features: ['Videos'],
            keywords: ['test'],
            category: 'Technology',
          },
        ],
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      expect(response.ok).toBe(false);
      expect(result.error).toContain('type');
    });

    it('should handle empty data array', async () => {
      const data = {
        type: 'course',
        data: [],
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.total).toBe(0);
      expect(result.valid).toBe(0);
      expect(result.invalid).toBe(0);
    });

    it('should handle very large batch', async () => {
      const largeBatch = {
        type: 'course',
        data: Array(100)
          .fill(null)
          .map((_, i) => ({
            title: `Course ${i}`,
            description: `Description ${i}`,
            audiences: ['Student'],
            mode: 'Online',
            duration: '4 weeks',
            price: '₹5000',
            level: 'Beginner',
            start_date: '2025-04-01',
            features: ['Videos'],
            keywords: ['test'],
            category: 'Technology',
          })),
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(largeBatch),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.total).toBe(100);
    });
  });

  describe('Performance Tests', () => {
    it('should validate single item quickly', async () => {
      const data = {
        type: 'course',
        data: [
          {
            title: 'Performance Test',
            description: 'Testing speed',
            audiences: ['Student'],
            mode: 'Online',
            duration: '4 weeks',
            price: '₹5000',
            level: 'Beginner',
            start_date: '2025-04-01',
            features: ['Videos'],
            keywords: ['test'],
            category: 'Technology',
          },
        ],
      };

      const startTime = Date.now();

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete in less than 1 second
    });

    it('should handle batch validation efficiently', async () => {
      const batchData = {
        type: 'event',
        data: Array(50)
          .fill(null)
          .map((_, i) => ({
            name: `Event ${i}`,
            description: `Description ${i}`,
            event_type: 'workshop',
            date: '2025-03-15',
            price: `₹${1000 * (i + 1)}`,
            category: 'Technology',
          })),
        options: {
          batchMode: true,
          checkDuplicates: true,
        },
      };

      const startTime = Date.now();

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(batchData),
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(3000); // Should complete in less than 3 seconds
    });
  });

  afterAll(async () => {
    // Clean up any test data if needed
  });
});
