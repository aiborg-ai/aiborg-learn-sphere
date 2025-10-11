import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompetencyMatrixService } from '../CompetencyMatrixService';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe('CompetencyMatrixService', () => {
  const mockMatrix = {
    id: 'matrix-123',
    name: 'Senior Software Engineer',
    description: 'Competencies for senior engineering role',
    industry: 'Technology',
    job_role: 'Software Engineer',
    experience_level: 'senior',
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  const mockSkills = [
    {
      id: 'skill-1',
      matrix_id: 'matrix-123',
      skill_name: 'JavaScript',
      skill_category: 'Programming',
      required_level: 4,
      importance: 'required',
      description: 'Advanced JavaScript knowledge',
      assessment_criteria: 'Can build complex applications',
    },
    {
      id: 'skill-2',
      matrix_id: 'matrix-123',
      skill_name: 'System Design',
      skill_category: 'Architecture',
      required_level: 3,
      importance: 'required',
      description: 'Can design scalable systems',
      assessment_criteria: 'Design patterns and best practices',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('create', () => {
    it('should create competency matrix with skills', async () => {
      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          // Insert matrix
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockMatrix,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          // Insert skills
          insert: vi.fn().mockResolvedValue({
            data: mockSkills,
            error: null,
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await CompetencyMatrixService.create(
        {
          name: 'Senior Software Engineer',
          description: 'Competencies for senior engineering role',
          industry: 'Technology',
          job_role: 'Software Engineer',
          experience_level: 'senior',
        },
        [
          {
            skill_name: 'JavaScript',
            skill_category: 'Programming',
            required_level: 4,
            importance: 'required',
          },
          {
            skill_name: 'System Design',
            skill_category: 'Architecture',
            required_level: 3,
            importance: 'required',
          },
        ]
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('matrix-123');
      expect(result.skills).toHaveLength(2);
    });

    it('should handle matrix creation error', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(
        CompetencyMatrixService.create(
          { name: 'Test Matrix' },
          []
        )
      ).rejects.toThrow();
    });

    it('should handle skills insertion error', async () => {
      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockMatrix,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Skills insertion failed' },
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(
        CompetencyMatrixService.create(
          { name: 'Test Matrix' },
          [{ skill_name: 'Test Skill', skill_category: 'Test', required_level: 3 }]
        )
      ).rejects.toThrow();
    });

    it('should set default importance if not provided', async () => {
      const insertMock = vi.fn().mockResolvedValue({
        data: mockSkills,
        error: null,
      });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockMatrix,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: insertMock,
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await CompetencyMatrixService.create(
        { name: 'Test Matrix' },
        [{ skill_name: 'Test', skill_category: 'Test', required_level: 3 }]
      );

      expect(insertMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ importance: 'required' })
        ])
      );
    });
  });

  describe('assessUser', () => {
    it('should create user competency assessment', async () => {
      const mockAssessment = {
        id: 'assessment-123',
        user_id: 'user-123',
        matrix_id: 'matrix-123',
        status: 'draft',
        overall_match_score: null,
      };

      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          // Insert assessment
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAssessment,
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          // Insert ratings
          insert: vi.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        })
        .mockReturnValueOnce({
          // Update with score
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: {},
              error: null,
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: 85,
        error: null,
      });

      const result = await CompetencyMatrixService.assessUser(
        'user-123',
        'matrix-123',
        [
          { skill_id: 'skill-1', current_level: 4, evidence: 'Portfolio projects' },
          { skill_id: 'skill-2', current_level: 3 },
        ]
      );

      expect(result).toBeDefined();
      expect(result.id).toBe('assessment-123');
      expect(result.overall_match_score).toBe(85);
      expect(result.skill_ratings).toHaveLength(2);
    });

    it('should handle assessment creation error', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Assessment creation failed' },
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(
        CompetencyMatrixService.assessUser('user-123', 'matrix-123', [])
      ).rejects.toThrow();
    });

    it('should calculate match score using RPC', async () => {
      const mockAssessment = {
        id: 'assessment-123',
        user_id: 'user-123',
        matrix_id: 'matrix-123',
        status: 'draft',
      };

      const mockFrom = vi.fn()
        .mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockAssessment,
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: {},
              error: null,
            }),
          }),
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: 92,
        error: null,
      });

      await CompetencyMatrixService.assessUser('user-123', 'matrix-123', [
        { skill_id: 'skill-1', current_level: 5 },
      ]);

      expect(supabase.rpc).toHaveBeenCalledWith('calculate_competency_match', {
        assessment_uuid: 'assessment-123',
      });
    });

    it('should update assessment status to completed', async () => {
      const updateMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      });

      const mockFrom = vi.fn()
        .mockReturnValueOnce({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: { id: 'assessment-123', status: 'draft' },
                error: null,
              }),
            }),
          }),
        })
        .mockReturnValueOnce({
          insert: vi.fn().mockResolvedValue({
            data: {},
            error: null,
          }),
        })
        .mockReturnValueOnce({
          update: updateMock,
        });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;
      (supabase.rpc as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: 75,
        error: null,
      });

      await CompetencyMatrixService.assessUser('user-123', 'matrix-123', [
        { skill_id: 'skill-1', current_level: 3 },
      ]);

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'completed' })
      );
    });
  });

  describe('getGapAnalysis', () => {
    it('should return skill gap analysis', async () => {
      const mockAssessmentData = {
        id: 'assessment-123',
        skill_ratings: [
          {
            skill_id: 'skill-1',
            current_level: 3,
            evidence: 'Some evidence',
            verified: true,
            skill: {
              skill_name: 'JavaScript',
              required_level: 4,
            },
          },
          {
            skill_id: 'skill-2',
            current_level: 5,
            evidence: null,
            verified: false,
            skill: {
              skill_name: 'System Design',
              required_level: 3,
            },
          },
        ],
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockAssessmentData,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await CompetencyMatrixService.getGapAnalysis(
        'user-123',
        'matrix-123'
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        skill_id: 'skill-1',
        skill_name: 'JavaScript',
        required_level: 4,
        current_level: 3,
        gap: 1, // 4 - 3 = 1
        evidence: 'Some evidence',
        verified: true,
      });
      expect(result[1]).toEqual({
        skill_id: 'skill-2',
        skill_name: 'System Design',
        required_level: 3,
        current_level: 5,
        gap: -2, // 3 - 5 = -2 (exceeded requirement)
        evidence: null,
        verified: false,
      });
    });

    it('should handle no assessment found', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { message: 'Assessment not found' },
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(
        CompetencyMatrixService.getGapAnalysis('user-123', 'matrix-123')
      ).rejects.toThrow();
    });

    it('should return empty array if no skill ratings', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: { skill_ratings: [] },
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await CompetencyMatrixService.getGapAnalysis(
        'user-123',
        'matrix-123'
      );

      expect(result).toEqual([]);
    });

    it('should order by latest assessment date', async () => {
      const orderMock = vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { skill_ratings: [] },
            error: null,
          }),
        }),
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: orderMock,
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await CompetencyMatrixService.getGapAnalysis('user-123', 'matrix-123');

      expect(orderMock).toHaveBeenCalledWith('assessment_date', { ascending: false });
    });

    it('should calculate positive gaps for skills below requirement', async () => {
      const mockData = {
        skill_ratings: [
          {
            skill_id: 'skill-1',
            current_level: 2,
            verified: true,
            skill: { skill_name: 'Test Skill', required_level: 5 },
          },
        ],
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockData,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await CompetencyMatrixService.getGapAnalysis(
        'user-123',
        'matrix-123'
      );

      expect(result[0]?.gap).toBe(3); // 5 - 2 = 3 (skill gap)
    });

    it('should calculate negative gaps for skills exceeding requirement', async () => {
      const mockData = {
        skill_ratings: [
          {
            skill_id: 'skill-1',
            current_level: 5,
            verified: true,
            skill: { skill_name: 'Test Skill', required_level: 3 },
          },
        ],
      };

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: mockData,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await CompetencyMatrixService.getGapAnalysis(
        'user-123',
        'matrix-123'
      );

      expect(result[0]?.gap).toBe(-2); // 3 - 5 = -2 (exceeds requirement)
    });
  });
});
