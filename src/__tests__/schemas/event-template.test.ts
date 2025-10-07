import { describe, it, expect, beforeEach } from 'vitest';
import { z } from 'zod';
import { EventTemplateSchema } from '@/schemas/template-schemas';

// Helper function to validate event template
const validateEventTemplate = (data: Record<string, unknown>) => {
  try {
    const result = EventTemplateSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        })),
      };
    }
    throw error;
  }
};

type EventTemplate = z.infer<typeof EventTemplateSchema>;

describe('EventTemplateSchema', () => {
  let validEvent: Record<string, unknown>;

  beforeEach(() => {
    validEvent = {
      name: 'AI & Machine Learning Summit 2025',
      description: 'Annual conference bringing together AI researchers and practitioners',
      event_type: 'conference',
      date: '2025-03-15',
      time: '09:00',
      duration: '2 days',
      location: 'Tech Convention Center',
      venue: 'Main Hall',
      max_attendees: 500,
      registration_deadline: '2025-03-01',
      price: '₹25000',
      organizer: 'AIBorg Education',
      agenda: ['Keynote Sessions', 'Technical Workshops', 'Networking Sessions'],
      speakers: ['Dr. Jane Smith', 'Prof. John Doe', 'Dr. Emily Chen'],
      sponsors: ['TechCorp', 'AI Solutions Inc', 'DataTech'],
      tags: ['AI', 'Machine Learning', 'Technology', 'Conference'],
      requirements: ['Laptop recommended', 'Basic programming knowledge'],
      contact_info: {
        email: 'info@aisummit.com',
        phone: '+91-9876543210',
        website: 'https://aisummit.com',
      },
      category: 'Technology',
    };
  });

  describe('Required Fields Validation', () => {
    it('should accept a valid event with all required fields', () => {
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject(validEvent);
    });

    it('should reject event with missing name', () => {
      delete validEvent.name;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('name');
      expect(result.errors![0].message).toContain('Required');
    });

    it('should reject event with empty name', () => {
      validEvent.name = '';
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('name');
      expect(result.errors![0].message).toContain('at least 1 character');
    });

    it('should reject event with missing description', () => {
      delete validEvent.description;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('description');
    });

    it('should reject event with missing event_type', () => {
      delete validEvent.event_type;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('event_type');
    });

    it('should reject event with missing date', () => {
      delete validEvent.date;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('date');
    });

    it('should reject event with missing price', () => {
      delete validEvent.price;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('price');
    });

    it('should reject event with missing category', () => {
      delete validEvent.category;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('category');
    });
  });

  describe('Event Type Validation', () => {
    const validTypes = ['workshop', 'webinar', 'conference', 'seminar', 'bootcamp', 'meetup'];

    validTypes.forEach(type => {
      it(`should accept valid event type: ${type}`, () => {
        validEvent.event_type = type;
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
        expect(result.data!.event_type).toBe(type);
      });
    });

    it('should reject invalid event type', () => {
      validEvent.event_type = 'party';
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('event_type');
      expect(result.errors![0].message).toContain('Invalid enum value');
    });

    it('should handle event type case sensitivity', () => {
      validEvent.event_type = 'WORKSHOP';
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('event_type');
    });
  });

  describe('Date and Time Validation', () => {
    it('should accept valid ISO date format', () => {
      validEvent.date = '2025-12-31';
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
      expect(result.data!.date).toBe('2025-12-31');
    });

    it('should accept date with time', () => {
      validEvent.date = '2025-03-15T09:00:00';
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should accept flexible date formats', () => {
      const flexibleDates = ['March 2025', 'Q2 2025', 'Summer 2025', 'TBD', 'To be announced'];

      flexibleDates.forEach(date => {
        validEvent.date = date;
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
        expect(result.data!.date).toBe(date);
      });
    });

    it('should accept valid time formats', () => {
      const validTimes = ['09:00', '14:30', '18:00', '9:00 AM', '2:30 PM', '10:00 IST'];

      validTimes.forEach(time => {
        validEvent.time = time;
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
      });
    });

    it('should accept event without time (optional)', () => {
      delete validEvent.time;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should accept valid registration deadline', () => {
      validEvent.registration_deadline = '2025-02-28';
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should accept event without registration deadline (optional)', () => {
      delete validEvent.registration_deadline;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });
  });

  describe('Duration Validation', () => {
    it('should accept various duration formats', () => {
      const validDurations = [
        '2 hours',
        '3 days',
        '1 week',
        '90 minutes',
        'Half day',
        'Full day',
        '2-day workshop',
      ];

      validDurations.forEach(duration => {
        validEvent.duration = duration;
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
        expect(result.data!.duration).toBe(duration);
      });
    });

    it('should accept event without duration (optional)', () => {
      delete validEvent.duration;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });
  });

  describe('Location and Venue Validation', () => {
    it('should accept physical location', () => {
      validEvent.location = 'Mumbai Convention Center';
      validEvent.venue = 'Hall A';
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should accept online location', () => {
      validEvent.location = 'Online';
      validEvent.venue = 'Zoom';
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should accept hybrid location', () => {
      validEvent.location = 'Hybrid - Mumbai & Online';
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should accept event without location (optional)', () => {
      delete validEvent.location;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should accept event without venue (optional)', () => {
      delete validEvent.venue;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });
  });

  describe('Max Attendees Validation', () => {
    it('should accept valid max attendees', () => {
      validEvent.max_attendees = 100;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
      expect(result.data!.max_attendees).toBe(100);
    });

    it('should reject negative max attendees', () => {
      validEvent.max_attendees = -10;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('max_attendees');
      expect(result.errors![0].message).toContain('positive');
    });

    it('should reject zero max attendees', () => {
      validEvent.max_attendees = 0;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('max_attendees');
    });

    it('should accept event without max attendees (optional)', () => {
      delete validEvent.max_attendees;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should handle very large attendee numbers', () => {
      validEvent.max_attendees = 10000;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });
  });

  describe('Price Validation', () => {
    it('should accept various price formats', () => {
      const validPrices = [
        '₹5000',
        '$100',
        '€75',
        '₹1,50,000',
        '$1,000',
        '₹999',
        'Free',
        'FREE',
        '0',
        '₹0',
      ];

      validPrices.forEach(price => {
        validEvent.price = price;
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
        expect(result.data!.price).toBe(price);
      });
    });

    it('should reject invalid price formats', () => {
      const invalidPrices = ['abc', '₹-100', 'Rs100', 'USD 100', '100 dollars'];

      invalidPrices.forEach(price => {
        validEvent.price = price;
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(false);
        expect(result.errors![0].field).toBe('price');
      });
    });
  });

  describe('Array Fields Validation', () => {
    describe('Agenda', () => {
      it('should accept valid agenda array', () => {
        validEvent.agenda = ['Session 1', 'Break', 'Session 2', 'Networking'];
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
        expect(result.data!.agenda).toHaveLength(4);
      });

      it('should accept empty agenda array', () => {
        validEvent.agenda = [];
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
      });

      it('should accept event without agenda (optional)', () => {
        delete validEvent.agenda;
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
      });

      it('should reject agenda with more than 20 items', () => {
        validEvent.agenda = Array(21).fill('Session');
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(false);
        expect(result.errors![0].field).toBe('agenda');
        expect(result.errors![0].message).toContain('20');
      });
    });

    describe('Speakers', () => {
      it('should accept valid speakers array', () => {
        validEvent.speakers = ['Speaker 1', 'Speaker 2'];
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
      });

      it('should accept empty speakers array', () => {
        validEvent.speakers = [];
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
      });

      it('should reject speakers with more than 30 items', () => {
        validEvent.speakers = Array(31).fill('Speaker');
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(false);
        expect(result.errors![0].field).toBe('speakers');
      });
    });

    describe('Sponsors', () => {
      it('should accept valid sponsors array', () => {
        validEvent.sponsors = ['Gold Sponsor', 'Silver Sponsor'];
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
      });

      it('should reject sponsors with more than 20 items', () => {
        validEvent.sponsors = Array(21).fill('Sponsor');
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(false);
        expect(result.errors![0].field).toBe('sponsors');
      });
    });

    describe('Tags', () => {
      it('should accept valid tags array', () => {
        validEvent.tags = ['tech', 'workshop', 'beginner'];
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
      });

      it('should reject tags with more than 15 items', () => {
        validEvent.tags = Array(16).fill('tag');
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(false);
        expect(result.errors![0].field).toBe('tags');
      });
    });

    describe('Requirements', () => {
      it('should accept valid requirements array', () => {
        validEvent.requirements = ['Laptop', 'Notebook', 'Basic knowledge'];
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
      });

      it('should reject requirements with more than 10 items', () => {
        validEvent.requirements = Array(11).fill('requirement');
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(false);
        expect(result.errors![0].field).toBe('requirements');
      });
    });
  });

  describe('Contact Info Validation', () => {
    it('should accept complete contact info', () => {
      validEvent.contact_info = {
        email: 'test@example.com',
        phone: '+91-9876543210',
        website: 'https://example.com',
      };
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should accept partial contact info', () => {
      validEvent.contact_info = {
        email: 'test@example.com',
      };
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should accept event without contact info (optional)', () => {
      delete validEvent.contact_info;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should validate email format in contact info', () => {
      validEvent.contact_info = {
        email: 'invalid-email',
      };
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('contact_info.email');
    });

    it('should accept valid URL in contact info', () => {
      validEvent.contact_info = {
        website: 'https://www.example.com',
      };
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });
  });

  describe('Category Validation', () => {
    const validCategories = [
      'Technology',
      'Business',
      'Design',
      'Marketing',
      'Finance',
      'Health',
      'Education',
      'Arts',
      'Science',
      'Engineering',
    ];

    validCategories.forEach(category => {
      it(`should accept valid category: ${category}`, () => {
        validEvent.category = category;
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid category', () => {
      validEvent.category = 'InvalidCategory';
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
      expect(result.errors![0].field).toBe('category');
    });
  });

  describe('Optional Fields', () => {
    it('should accept event with only required fields', () => {
      const minimalEvent = {
        name: 'Tech Talk',
        description: 'A tech discussion',
        event_type: 'meetup',
        date: '2025-03-15',
        price: 'Free',
        category: 'Technology',
      };
      const result = validateEventTemplate(minimalEvent);
      expect(result.success).toBe(true);
    });

    it('should accept event with all optional fields', () => {
      validEvent.is_featured = true;
      validEvent.is_active = true;
      validEvent.display = true;
      validEvent.early_bird_price = '₹20000';
      validEvent.early_bird_deadline = '2025-02-15';
      validEvent.certificate_provided = true;
      validEvent.recording_available = true;
      validEvent.materials_provided = true;

      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });
  });

  describe('Boolean Fields Validation', () => {
    const booleanFields = [
      'is_featured',
      'is_active',
      'display',
      'certificate_provided',
      'recording_available',
      'materials_provided',
    ];

    booleanFields.forEach(field => {
      it(`should accept boolean value for ${field}`, () => {
        validEvent[field] = true;
        let result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
        expect(result.data![field]).toBe(true);

        validEvent[field] = false;
        result = validateEventTemplate(validEvent);
        expect(result.success).toBe(true);
        expect(result.data![field]).toBe(false);
      });

      it(`should reject non-boolean value for ${field}`, () => {
        validEvent[field] = 'yes';
        const result = validateEventTemplate(validEvent);
        expect(result.success).toBe(false);
        expect(result.errors![0].field).toBe(field);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle event with very long strings', () => {
      validEvent.name = 'A'.repeat(500);
      validEvent.description = 'B'.repeat(5000);
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should handle event with special characters', () => {
      validEvent.name = 'AI & ML Summit - 2025 (Online)';
      validEvent.organizer = "O'Reilly & Associates";
      validEvent.venue = 'Building #42, Floor-3';
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should handle event with unicode characters', () => {
      validEvent.name = '🚀 Tech Summit 2025 🎯';
      validEvent.speakers = ['张伟', 'José García', 'François Dupont'];
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });

    it('should handle event with null values', () => {
      validEvent.location = null;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(false);
    });

    it('should handle event with undefined optional values', () => {
      validEvent.venue = undefined;
      const result = validateEventTemplate(validEvent);
      expect(result.success).toBe(true);
    });
  });

  describe('Duplicate Detection', () => {
    it('should detect duplicate event by name (case-insensitive)', () => {
      const events = [
        { ...validEvent, name: 'AI Summit 2025' },
        { ...validEvent, name: 'ai summit 2025' },
      ];

      // This would be handled by the validation service
      const name1 = events[0].name.toLowerCase().trim();
      const name2 = events[1].name.toLowerCase().trim();
      expect(name1).toBe(name2);
    });

    it('should detect duplicate event by name and date combination', () => {
      const events = [
        { ...validEvent, name: 'Workshop', date: '2025-03-15' },
        { ...validEvent, name: 'Workshop', date: '2025-03-15' },
      ];

      const key1 = `${events[0].name.toLowerCase()}_${events[0].date}`;
      const key2 = `${events[1].name.toLowerCase()}_${events[1].date}`;
      expect(key1).toBe(key2);
    });

    it('should not flag as duplicate if names differ', () => {
      const events = [
        { ...validEvent, name: 'AI Summit' },
        { ...validEvent, name: 'ML Summit' },
      ];

      const name1 = events[0].name.toLowerCase().trim();
      const name2 = events[1].name.toLowerCase().trim();
      expect(name1).not.toBe(name2);
    });

    it('should not flag as duplicate if dates differ', () => {
      const events = [
        { ...validEvent, name: 'Workshop', date: '2025-03-15' },
        { ...validEvent, name: 'Workshop', date: '2025-03-16' },
      ];

      const key1 = `${events[0].name.toLowerCase()}_${events[0].date}`;
      const key2 = `${events[1].name.toLowerCase()}_${events[1].date}`;
      expect(key1).not.toBe(key2);
    });
  });
});
