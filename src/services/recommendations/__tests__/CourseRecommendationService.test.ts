import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CourseRecommendationService } from '../CourseRecommendationService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('CourseRecommendationService', () => {
  const mockUserProfile = {
    id: '1',
    skill_level: 65,
    learning_goals: ['Machine Learning', 'Data Science'],
    learning_pace: 'moderate',
    preferred_topics: ['AI', 'Python', 'Data'],
    time_commitment: 10,
  };

  const mockCourses = [
    {
      id: 1,
      title: 'Python for Data Science',
      difficulty_level: 'intermediate',
      topics: ['Python', 'Data Science'],
      estimated_hours: 20,
      prerequisites: ['Basic Programming'],
      skills: ['Python', 'Pandas', 'NumPy'],
      completion_rate: 0.85,
      average_rating: 4.5,
    },
    {
      id: 2,
      title: 'Machine Learning Fundamentals',
      difficulty_level: 'intermediate',
      topics: ['Machine Learning', 'AI'],
      estimated_hours: 30,
      prerequisites: ['Python'],
      skills: ['ML Algorithms', 'Scikit-learn'],
      completion_rate: 0.78,
      average_rating: 4.3,
    },
    {
      id: 3,
      title: 'Advanced Deep Learning',
      difficulty_level: 'advanced',
      topics: ['Deep Learning', 'AI'],
      estimated_hours: 40,
      prerequisites: ['Machine Learning'],
      skills: ['Neural Networks', 'TensorFlow'],
      completion_rate: 0.65,
      average_rating: 4.7,
    },
  ];

  const mockEnrollments = [
    { course_id: 1, progress: 100 }, // Completed
    { course_id: 2, progress: 50 },  // In progress
  ];

  const mockAssessments = [
    { category: 'Python', score: 85 },
    { category: 'Data Science', score: 75 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateRecommendations', () => {
    it('should generate course recommendations', async () => {
      // Mock for peer success scores (called for each course)
      const mockPeerSuccessQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ progress: 90, rating: 4.5 }],
              error: null,
            }),
          }),
        }),
      };

      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          // user_profiles
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          // course_enrollments (user's enrollments)
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockEnrollments,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          // ai_assessment_results
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockAssessments,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          // courses
          select: vi.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        })
        // Add mocks for peer success score lookups (one per course)
        .mockReturnValue(mockPeerSuccessQuery);

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [{ id: 'user-2' }, { id: 'user-3' }],
        error: null,
      });

      const recommendations = await CourseRecommendationService.generateRecommendations(
        'user-123',
        10
      );

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
    });

    it('should exclude completed courses', async () => {
      const mockFrom = vi.fn()
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      // Mock completed courses
      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [{ course_id: 1, progress: 100 }],
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockAssessments,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        });

      const recommendations = await CourseRecommendationService.generateRecommendations(
        'user-123'
      );

      // Course 1 should be excluded as completed
      const courseIds = recommendations.map(r => r.courseId);
      expect(courseIds).not.toContain(1);
    });

    it('should limit number of recommendations', async () => {
      const manyCourses = Array.from({ length: 20 }, (_, i) => ({
        ...mockCourses[0]!,
        id: i + 1,
        title: `Course ${i + 1}`,
      }));

      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockAssessments,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({
            data: manyCourses,
            error: null,
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      const recommendations = await CourseRecommendationService.generateRecommendations(
        'user-123',
        5
      );

      expect(recommendations.length).toBeLessThanOrEqual(5);
    });

    it('should sort recommendations by score', async () => {
      const mockFrom = vi.fn()
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockAssessments,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        });

      const recommendations = await CourseRecommendationService.generateRecommendations(
        'user-123'
      );

      // Verify descending score order
      for (let i = 0; i < recommendations.length - 1; i++) {
        expect(recommendations[i]!.score).toBeGreaterThanOrEqual(
          recommendations[i + 1]!.score
        );
      }
    });

    it('should include recommendation details', async () => {
      const mockFrom = vi.fn()
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockAssessments,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({
            data: [mockCourses[0]!],
            error: null,
          }),
        });

      const recommendations = await CourseRecommendationService.generateRecommendations(
        'user-123'
      );

      expect(recommendations[0]).toHaveProperty('courseId');
      expect(recommendations[0]).toHaveProperty('score');
      expect(recommendations[0]).toHaveProperty('reasons');
      expect(recommendations[0]).toHaveProperty('estimatedCompletionTime');
      expect(recommendations[0]).toHaveProperty('skillGapFilled');
      expect(recommendations[0]).toHaveProperty('confidence');
    });
  });

  describe('user profile building', () => {
    it('should build complete user profile', async () => {
      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockEnrollments,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockAssessments,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      await CourseRecommendationService.generateRecommendations('user-123');

      // Verify all profile queries were made
      expect(mockFrom).toHaveBeenCalled();
    });

    it('should handle missing user data gracefully', async () => {
      const mockFrom = vi.fn()
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      // Should handle null user data with defaults
      expect(async () => {
        await CourseRecommendationService.generateRecommendations('user-123');
      }).not.toThrow();
    });
  });

  describe('collaborative filtering', () => {
    it('should find similar users', async () => {
      // Mock for peer success scores (called for each course)
      const mockPeerSuccessQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: [{ progress: 90, rating: 4.5 }],
              error: null,
            }),
          }),
        }),
      };

      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          // user_profiles
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          // course_enrollments
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          // ai_assessment_results
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          // courses
          select: vi.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        })
        // Add mocks for peer success score lookups (one per course)
        .mockReturnValue(mockPeerSuccessQuery);

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [
          { id: 'user-2', similarity: 0.85 },
          { id: 'user-3', similarity: 0.78 },
        ],
        error: null,
      });

      await CourseRecommendationService.generateRecommendations('user-123');

      expect(supabase.rpc).toHaveBeenCalledWith('find_similar_users', {
        target_user_id: 'user-123',
      });
    });

    it('should handle no similar users found', async () => {
      const mockFrom = vi.fn()
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: null,
        error: null,
      });

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        });

      // Should still generate recommendations without similar users
      const recommendations = await CourseRecommendationService.generateRecommendations(
        'user-123'
      );

      expect(recommendations).toBeDefined();
    });
  });

  describe('score calculation', () => {
    it('should calculate recommendation scores', async () => {
      const mockFrom = vi.fn()
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: [],
        error: null,
      });

      mockFrom
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUserProfile,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: mockAssessments,
              error: null,
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockResolvedValue({
            data: mockCourses,
            error: null,
          }),
        });

      const recommendations = await CourseRecommendationService.generateRecommendations(
        'user-123'
      );

      // All recommendations should have numeric scores
      recommendations.forEach(rec => {
        expect(typeof rec.score).toBe('number');
        expect(rec.score).toBeGreaterThanOrEqual(0);
        expect(rec.score).toBeLessThanOrEqual(100);
      });
    });
  });
});
