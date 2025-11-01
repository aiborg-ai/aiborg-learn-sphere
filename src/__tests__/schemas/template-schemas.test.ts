import { describe, it, expect } from 'vitest';
import type { CourseTemplate, EventTemplate } from '@/lib/schemas';
import {
  validateCourseTemplate,
  validateEventTemplate,
  validateCourseBatch,
  validateEventBatch,
  checkCourseDuplicates,
  checkEventDuplicates,
  checkEventConflicts,
  getTemplateExample,
} from '@/lib/schemas';

describe('Course Template Schema', () => {
  describe('Valid Templates', () => {
    it('should validate a complete course template', () => {
      const validCourse = getTemplateExample('course');
      const result = validateCourseTemplate(validCourse);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should validate a minimal course template', () => {
      const minimalCourse = {
        title: 'Test Course',
        description: 'This is a test course description',
        audiences: ['Professional'],
        mode: 'Online',
        duration: '4 weeks',
        price: 'Free',
        level: 'Beginner',
        start_date: '2025-03-01',
        features: ['Feature 1'],
        keywords: ['test'],
        category: 'Technology',
      };

      const result = validateCourseTemplate(minimalCourse);
      expect(result.success).toBe(true);
    });

    it('should accept flexible start dates', () => {
      const course = {
        ...getTemplateExample('course'),
        start_date: 'Flexible',
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(true);
    });

    it('should validate course with optional fields', () => {
      const course = {
        ...getTemplateExample('course'),
        course_materials: [
          {
            title: 'Introduction Video',
            type: 'video',
            url: 'https://example.com/video.mp4',
            description: 'Welcome to the course',
            duration: '10 minutes',
            order_index: 1,
            is_preview: true,
          },
        ],
        instructor_info: {
          name: 'John Doe',
          email: 'john@example.com',
          bio: 'Expert in AI',
        },
      };

      const result = validateCourseTemplate(course);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Templates', () => {
    it('should reject course with missing title', () => {
      const invalidCourse = {
        ...getTemplateExample('course'),
        title: '',
      };

      const result = validateCourseTemplate(invalidCourse);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors![0].field).toBe('title');
    });

    it('should reject course with invalid audience', () => {
      const invalidCourse = {
        ...getTemplateExample('course'),
        audiences: ['InvalidAudience'],
      };

      const result = validateCourseTemplate(invalidCourse);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should reject course with invalid date format', () => {
      const invalidCourse = {
        ...getTemplateExample('course'),
        start_date: '01/02/2025', // Wrong format
      };

      const result = validateCourseTemplate(invalidCourse);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toContain('start_date');
    });

    it('should reject course with too many features', () => {
      const invalidCourse = {
        ...getTemplateExample('course'),
        features: Array(21).fill('Feature'), // 21 features, max is 20
      };

      const result = validateCourseTemplate(invalidCourse);
      expect(result.success).toBe(false);
    });

    it('should reject course with invalid email in instructor info', () => {
      const invalidCourse = {
        ...getTemplateExample('course'),
        instructor_info: {
          name: 'John Doe',
          email: 'invalid-email',
          bio: 'Expert',
        },
      };

      const result = validateCourseTemplate(invalidCourse);
      expect(result.success).toBe(false);
    });

    it('should reject course with min_students > max_students', () => {
      const invalidCourse = {
        ...getTemplateExample('course'),
        min_students: 30,
        max_students: 20,
      };

      const result = validateCourseTemplate(invalidCourse);
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain(
        'Minimum students must be less than or equal to maximum'
      );
    });
  });

  describe('Batch Validation', () => {
    it('should validate batch of courses', () => {
      const batch = {
        courses: [
          getTemplateExample('course'),
          { ...getTemplateExample('course'), title: 'Another Course' },
        ],
      };

      const result = validateCourseBatch(batch);
      expect(result.success).toBe(true);
      expect(result.summary?.total).toBe(2);
      expect(result.summary?.valid).toBe(2);
      expect(result.summary?.invalid).toBe(0);
    });

    it('should report errors for invalid courses in batch', () => {
      const batch = {
        courses: [
          getTemplateExample('course'),
          { ...getTemplateExample('course'), title: '' }, // Invalid
        ],
      };

      const result = validateCourseBatch(batch);
      expect(result.success).toBe(false);
      expect(result.summary?.invalid).toBeGreaterThan(0);
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate course titles', () => {
      const courses: CourseTemplate[] = [
        getTemplateExample('course'),
        getTemplateExample('course'), // Same title
      ];

      const result = checkCourseDuplicates(courses);
      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates).toHaveLength(2); // title and title+start_date duplicates
    });

    it('should not flag courses with different titles as duplicates', () => {
      const courses: CourseTemplate[] = [
        getTemplateExample('course'),
        { ...getTemplateExample('course'), title: 'Different Course' },
      ];

      const result = checkCourseDuplicates(courses);
      expect(result.hasDuplicates).toBe(false);
    });
  });
});

describe('Event Template Schema', () => {
  describe('Valid Templates', () => {
    it('should validate a complete event template', () => {
      const validEvent = getTemplateExample('event');
      const result = validateEventTemplate(validEvent);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it('should validate event with optional fields', () => {
      const event = {
        ...getTemplateExample('event'),
        venue_details: {
          platform: 'Zoom',
          meeting_link: 'https://zoom.us/j/123456',
        },
        speaker_info: {
          name: 'Jane Doe',
          designation: 'AI Expert',
          company: 'Tech Corp',
        },
        agenda: [
          {
            time: '6:00 PM - 6:15 PM',
            topic: 'Introduction',
            description: 'Welcome and overview',
          },
        ],
      };

      const result = validateEventTemplate(event);
      expect(result.success).toBe(true);
    });
  });

  describe('Invalid Templates', () => {
    it('should reject event with invalid event type', () => {
      const invalidEvent = {
        ...getTemplateExample('event'),
        event_type: 'invalid-type',
      };

      const result = validateEventTemplate(invalidEvent);
      expect(result.success).toBe(false);
    });

    it('should reject event with registration deadline after event date', () => {
      const invalidEvent = {
        ...getTemplateExample('event'),
        date: '2025-02-15',
        registration_deadline: '2025-02-16', // After event
      };

      const result = validateEventTemplate(invalidEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].message).toContain('Registration deadline must be before');
    });

    it('should reject event with invalid time format', () => {
      const invalidEvent = {
        ...getTemplateExample('event'),
        time: '18:00', // Missing timezone
      };

      const result = validateEventTemplate(invalidEvent);
      expect(result.success).toBe(false);
    });
  });

  describe('Batch Validation', () => {
    it('should validate batch of events', () => {
      const batch = {
        events: [
          getTemplateExample('event'),
          { ...getTemplateExample('event'), title: 'Another Event' },
        ],
      };

      const result = validateEventBatch(batch);
      expect(result.success).toBe(true);
      expect(result.summary?.total).toBe(2);
      expect(result.summary?.valid).toBe(2);
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate events with same title, date, and time', () => {
      const events: EventTemplate[] = [
        getTemplateExample('event'),
        getTemplateExample('event'), // Same everything
      ];

      const result = checkEventDuplicates(events);
      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates).toHaveLength(1);
    });

    it('should detect venue conflicts', () => {
      const events: EventTemplate[] = [
        { ...getTemplateExample('event'), location: 'Conference Room A' },
        { ...getTemplateExample('event'), title: 'Different Event', location: 'Conference Room A' },
      ];

      const result = checkEventDuplicates(events);
      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicates.some(d => d.field.includes('location'))).toBe(true);
    });
  });

  describe('Conflict Detection', () => {
    it('should detect speaker conflicts', () => {
      const speaker = {
        name: 'John Speaker',
        designation: 'Expert',
      };

      const events: EventTemplate[] = [
        { ...getTemplateExample('event'), speaker_info: speaker },
        {
          ...getTemplateExample('event'),
          title: 'Another Event',
          speaker_info: speaker,
        },
      ];

      const result = checkEventConflicts(events);
      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts[0].type).toBe('speaker_conflict');
    });
  });
});

describe('Common Validators', () => {
  describe('Date Validation', () => {
    it('should accept valid date formats', () => {
      const validDates = ['2025-01-15', 'Flexible', 'Coming Soon', 'TBD'];
      const course = getTemplateExample('course');

      validDates.forEach(date => {
        const result = validateCourseTemplate({ ...course, start_date: date });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid date formats', () => {
      const invalidDates = ['01/15/2025', '2025/01/15', '15-01-2025', 'random'];
      const course = getTemplateExample('course');

      invalidDates.forEach(date => {
        const result = validateCourseTemplate({ ...course, start_date: date });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Price Validation', () => {
    it('should accept valid price formats', () => {
      const validPrices = ['Free', '₹5000', '$99', '€50', '₹1000 - ₹2000'];
      const course = getTemplateExample('course');

      validPrices.forEach(price => {
        const result = validateCourseTemplate({ ...course, price });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid price formats', () => {
      const invalidPrices = ['Random', 'ABC123', '$$$$'];
      const course = getTemplateExample('course');

      invalidPrices.forEach(price => {
        const result = validateCourseTemplate({ ...course, price });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Duration Validation', () => {
    it('should accept valid duration formats', () => {
      const validDurations = [
        '2 hours',
        '4 weeks',
        '3 months',
        'Half day',
        'Full day',
        '30 minutes',
      ];
      const course = getTemplateExample('course');

      validDurations.forEach(duration => {
        const result = validateCourseTemplate({ ...course, duration });
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid duration formats', () => {
      const invalidDurations = ['random', '123', 'abc hours'];
      const course = getTemplateExample('course');

      invalidDurations.forEach(duration => {
        const result = validateCourseTemplate({ ...course, duration });
        expect(result.success).toBe(false);
      });
    });
  });
});
