import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

// Test configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'test-key';
const functionUrl = `${supabaseUrl}/functions/v1/import-template`;

type ImportedItem = {
  id?: string;
  [key: string]: unknown;
};

describe('import-template Edge Function Integration Tests', () => {
  let supabase: SupabaseClient;
  let authToken: string;
  let testCourseIds: string[] = [];
  let testEventIds: string[] = [];

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(supabaseUrl, supabaseKey);

    // Get auth token for testing
    const {
      data: { session },
    } = await supabase.auth.getSession();
    authToken = session?.access_token || '';
  });

  beforeEach(() => {
    // Reset test data arrays
    testCourseIds = [];
    testEventIds = [];
  });

  afterAll(async () => {
    // Clean up test data
    if (testCourseIds.length > 0) {
      await supabase.from('courses').delete().in('id', testCourseIds);
    }

    if (testEventIds.length > 0) {
      await supabase.from('events').delete().in('id', testEventIds);
    }
  });

  describe('Course Import', () => {
    it('should import a single valid course', async () => {
      const courseData = {
        type: 'course',
        data: [
          {
            title: 'Test Import Course',
            description: 'A course for testing import functionality',
            audiences: ['Student', 'Professional'],
            mode: 'Online',
            duration: '6 weeks',
            price: '₹7500',
            level: 'Intermediate',
            start_date: '2025-05-01',
            features: ['Videos', 'Assignments', 'Certificate'],
            keywords: ['test', 'import', 'integration'],
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
        body: JSON.stringify(courseData),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.summary.imported).toBe(1);
      expect(result.summary.failed).toBe(0);
      expect(result.imported).toHaveLength(1);

      // Store ID for cleanup
      if (result.imported[0]?.id) {
        testCourseIds.push(result.imported[0].id);
      }
    });

    it('should import multiple courses in batch', async () => {
      const batchData = {
        type: 'course',
        data: Array(5)
          .fill(null)
          .map((_, i) => ({
            title: `Batch Course ${i + 1}`,
            description: `Description for batch course ${i + 1}`,
            audiences: ['Student'],
            mode: 'Online',
            duration: `${i + 3} weeks`,
            price: `₹${(i + 1) * 2000}`,
            level: ['Beginner', 'Intermediate', 'Advanced'][i % 3],
            start_date: `2025-0${(i % 9) + 1}-15`,
            features: ['Videos', 'Quizzes'],
            keywords: ['batch', `course${i}`],
            category: 'Technology',
          })),
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(batchData),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.summary.imported).toBe(5);
      expect(result.summary.total).toBe(5);

      // Store IDs for cleanup
      result.imported.forEach((item: ImportedItem) => {
        if (item.id) testCourseIds.push(item.id);
      });
    });

    it('should skip duplicate courses when option is enabled', async () => {
      // First, import a course
      const firstImport = {
        type: 'course',
        data: [
          {
            title: 'Unique Course Title',
            description: 'Original course',
            audiences: ['Student'],
            mode: 'Online',
            duration: '4 weeks',
            price: '₹5000',
            level: 'Beginner',
            start_date: '2025-04-01',
            features: ['Videos'],
            keywords: ['unique'],
            category: 'Technology',
          },
        ],
      };

      const firstResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(firstImport),
      });

      const firstResult = await firstResponse.json();
      if (firstResult.imported[0]?.id) {
        testCourseIds.push(firstResult.imported[0].id);
      }

      // Try to import the same course again with skip_duplicates
      const duplicateImport = {
        type: 'course',
        data: [
          {
            title: 'Unique Course Title', // Same title
            description: 'Different description',
            audiences: ['Professional'],
            mode: 'Offline',
            duration: '8 weeks',
            price: '₹10000',
            level: 'Advanced',
            start_date: '2025-06-01',
            features: ['Projects'],
            keywords: ['duplicate'],
            category: 'Business',
          },
        ],
        options: {
          skip_duplicates: true,
        },
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(duplicateImport),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.summary.skipped).toBe(1);
      expect(result.summary.imported).toBe(0);
    });

    it('should update existing courses when option is enabled', async () => {
      // First, import a course
      const originalCourse = {
        type: 'course',
        data: [
          {
            title: 'Course to Update',
            description: 'Original description',
            audiences: ['Student'],
            mode: 'Online',
            duration: '4 weeks',
            price: '₹5000',
            level: 'Beginner',
            start_date: '2025-04-01',
            features: ['Videos'],
            keywords: ['original'],
            category: 'Technology',
          },
        ],
      };

      const firstResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(originalCourse),
      });

      const firstResult = await firstResponse.json();
      const courseId = firstResult.imported[0]?.id;
      if (courseId) testCourseIds.push(courseId);

      // Update the course
      const updatedCourse = {
        type: 'course',
        data: [
          {
            title: 'Course to Update', // Same title
            description: 'Updated description with new content',
            audiences: ['Student', 'Professional'],
            mode: 'Hybrid',
            duration: '6 weeks',
            price: '₹7500',
            level: 'Intermediate',
            start_date: '2025-05-01',
            features: ['Videos', 'Projects', 'Certificate'],
            keywords: ['updated', 'enhanced'],
            category: 'Technology',
          },
        ],
        options: {
          update_existing: true,
          skip_duplicates: false,
        },
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(updatedCourse),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.summary.updated).toBe(1);

      // Verify the update
      const { data: updatedData } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      expect(updatedData.description).toContain('Updated description');
      expect(updatedData.price).toBe(7500);
    });

    it('should handle validation failures gracefully', async () => {
      const invalidData = {
        type: 'course',
        data: [
          {
            title: 'Valid Course',
            description: 'This course is valid',
            audiences: ['Student'],
            mode: 'Online',
            duration: '4 weeks',
            price: '₹5000',
            level: 'Beginner',
            start_date: '2025-04-01',
            features: ['Videos'],
            keywords: ['valid'],
            category: 'Technology',
          },
          {
            title: '', // Invalid: empty title
            description: 'Invalid course',
            audiences: ['InvalidAudience'], // Invalid audience
            mode: 'InvalidMode', // Invalid mode
            duration: '4 weeks',
            price: 'invalid price', // Invalid price
            level: 'SuperAdvanced', // Invalid level
            start_date: 'not-a-date', // Invalid date
            features: [],
            keywords: [],
            category: 'InvalidCategory', // Invalid category
          },
        ],
        options: {
          validate_first: true,
        },
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(invalidData),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.summary.imported).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].errors).toBeDefined();

      // Store successful import for cleanup
      if (result.imported[0]?.id) {
        testCourseIds.push(result.imported[0].id);
      }
    });

    it('should perform dry run without importing', async () => {
      const dryRunData = {
        type: 'course',
        data: [
          {
            title: 'Dry Run Course',
            description: 'This should not be imported',
            audiences: ['Student'],
            mode: 'Online',
            duration: '4 weeks',
            price: '₹5000',
            level: 'Beginner',
            start_date: '2025-04-01',
            features: ['Videos'],
            keywords: ['dryrun'],
            category: 'Technology',
          },
        ],
        options: {
          dry_run: true,
        },
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(dryRunData),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.dry_run).toBe(true);
      expect(result.summary.would_import).toBe(1);
      expect(result.summary.imported).toBe(0);

      // Verify the course was not actually imported
      const { data } = await supabase.from('courses').select('id').eq('title', 'Dry Run Course');

      expect(data).toHaveLength(0);
    });
  });

  describe('Event Import', () => {
    it('should import a single valid event', async () => {
      const eventData = {
        type: 'event',
        data: [
          {
            name: 'Test Import Workshop',
            description: 'A workshop for testing import',
            event_type: 'workshop',
            date: '2025-04-15',
            time: '14:00',
            duration: '3 hours',
            location: 'Mumbai',
            venue: 'Tech Hub',
            max_attendees: 30,
            price: '₹3000',
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
        body: JSON.stringify(eventData),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.summary.imported).toBe(1);

      // Store ID for cleanup
      if (result.imported[0]?.id) {
        testEventIds.push(result.imported[0].id);
      }
    });

    it('should import multiple events in batch', async () => {
      const batchData = {
        type: 'event',
        data: Array(3)
          .fill(null)
          .map((_, i) => ({
            name: `Batch Event ${i + 1}`,
            description: `Event description ${i + 1}`,
            event_type: ['workshop', 'webinar', 'conference'][i],
            date: `2025-0${i + 3}-15`,
            time: `${10 + i}:00`,
            duration: `${i + 2} hours`,
            location: ['Mumbai', 'Delhi', 'Online'][i],
            max_attendees: (i + 1) * 25,
            price: `₹${(i + 1) * 1500}`,
            category: 'Technology',
          })),
      };

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(batchData),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.summary.imported).toBe(3);

      // Store IDs for cleanup
      result.imported.forEach((item: ImportedItem) => {
        if (item.id) testEventIds.push(item.id);
      });
    });

    it('should handle events with all optional fields', async () => {
      const fullEventData = {
        type: 'event',
        data: [
          {
            name: 'Complete Event',
            description: 'Event with all fields',
            event_type: 'conference',
            date: '2025-06-20',
            time: '09:00',
            duration: '2 days',
            location: 'Bangalore',
            venue: 'Convention Center',
            max_attendees: 500,
            registration_deadline: '2025-06-15',
            price: '₹25000',
            early_bird_price: '₹20000',
            early_bird_deadline: '2025-05-31',
            organizer: 'Tech Events Inc',
            agenda: ['Opening Keynote', 'Technical Sessions', 'Networking', 'Closing Ceremony'],
            speakers: ['Dr. Smith', 'Prof. Jones', 'Ms. Lee'],
            sponsors: ['TechCorp', 'DataCo', 'CloudInc'],
            tags: ['tech', 'conference', 'networking'],
            requirements: ['Laptop', 'Business cards'],
            contact_info: {
              email: 'info@event.com',
              phone: '+91-9876543210',
              website: 'https://event.com',
            },
            is_featured: true,
            is_active: true,
            display: true,
            certificate_provided: true,
            recording_available: true,
            materials_provided: true,
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
        body: JSON.stringify(fullEventData),
      });

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.summary.imported).toBe(1);

      const eventId = result.imported[0]?.id;
      if (eventId) testEventIds.push(eventId);

      // Verify all fields were imported
      const { data: importedEvent } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      expect(importedEvent.is_featured).toBe(true);
      expect(importedEvent.certificate_provided).toBe(true);
      expect(importedEvent.max_attendees).toBe(500);
    });
  });

  describe('Mixed Import', () => {
    it('should reject mixed type imports', async () => {
      const mixedData = {
        type: 'course',
        data: [
          {
            // Course data
            title: 'Course Item',
            description: 'A course',
            audiences: ['Student'],
            mode: 'Online',
            duration: '4 weeks',
            price: '₹5000',
            level: 'Beginner',
            start_date: '2025-04-01',
            features: ['Videos'],
            keywords: ['course'],
            category: 'Technology',
          },
          {
            // Event data (wrong type)
            name: 'Event Item',
            description: 'An event',
            event_type: 'workshop',
            date: '2025-04-15',
            price: '₹3000',
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
        body: JSON.stringify(mixedData),
      });

      const result = await response.json();

      // The second item should fail validation
      expect(result.summary.failed).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing authentication', async () => {
      const data = {
        type: 'course',
        data: [
          {
            title: 'Test',
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

    it('should handle malformed JSON', async () => {
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: '{ invalid json }',
      });

      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
    });

    it('should handle database errors gracefully', async () => {
      // Simulate a database error by trying to import with an invalid field
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
            invalid_field: 'This field does not exist in the database',
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

      const _result = await response.json();

      // Should handle gracefully, possibly filtering out invalid fields
      expect(response.ok).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle large batch imports efficiently', async () => {
      const largeBatch = {
        type: 'event',
        data: Array(50)
          .fill(null)
          .map((_, i) => ({
            name: `Performance Event ${i}`,
            description: `Event ${i} for performance testing`,
            event_type: 'workshop',
            date: '2025-07-01',
            price: `₹${1000 + i * 100}`,
            category: 'Technology',
          })),
      };

      const startTime = Date.now();

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(largeBatch),
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      const result = await response.json();

      expect(response.ok).toBe(true);
      expect(result.summary.total).toBe(50);
      expect(duration).toBeLessThan(10000); // Should complete in less than 10 seconds

      // Store IDs for cleanup
      result.imported.forEach((item: ImportedItem) => {
        if (item.id) testEventIds.push(item.id);
      });
    });
  });
});
