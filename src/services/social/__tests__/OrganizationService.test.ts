/**
 * Organization Service Unit Tests
 *
 * Tests for organization creation, member management, and team assessments
 * to ensure the organization feature continues working correctly.
 *
 * @group unit
 * @group organizations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrganizationService } from '../OrganizationService';
import { supabase } from '@/integrations/supabase/client';
import type { Organization, TeamAssessment } from '../types';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}));

// Test constants
const TEST_USER_ID = 'test-user-123';
const TEST_ORG_ID = 'test-org-456';
const TEST_ASSESSMENT_ID = 'test-assessment-789';

describe('OrganizationService - Create Organization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create an organization with required fields', async () => {
    const mockOrg: Organization = {
      id: TEST_ORG_ID,
      name: 'Test Organization',
      description: 'Test description',
      owner_id: TEST_USER_ID,
    };

    // Mock the from().insert().select().single() chain
    const mockQueryBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockOrg, error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

    const result = await OrganizationService.create({
      name: 'Test Organization',
      description: 'Test description',
    });

    expect(supabase.from).toHaveBeenCalledWith('organizations');
    expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
      name: 'Test Organization',
      description: 'Test description',
      industry: undefined,
      size_range: undefined,
    });
    expect(result).toEqual(mockOrg);
  });

  it('should create an organization with all fields', async () => {
    const mockOrg: Organization = {
      id: TEST_ORG_ID,
      name: 'Full Test Org',
      description: 'Full description',
      owner_id: TEST_USER_ID,
      industry: 'Technology',
      size_range: '11-50',
    };

    const mockQueryBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockOrg, error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

    const result = await OrganizationService.create({
      name: 'Full Test Org',
      description: 'Full description',
      industry: 'Technology',
      size_range: '11-50',
    });

    expect(result).toEqual(mockOrg);
    expect(result.industry).toBe('Technology');
    expect(result.size_range).toBe('11-50');
  });

  it('should throw error when creation fails', async () => {
    const mockError = new Error('Database error');

    const mockQueryBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

    await expect(
      OrganizationService.create({
        name: 'Test Org',
      })
    ).rejects.toThrow('Database error');
  });
});

describe('OrganizationService - Member Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should add a member to organization with default role', async () => {
    const mockQueryBuilder = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

    await OrganizationService.addMember(TEST_ORG_ID, TEST_USER_ID);

    expect(supabase.from).toHaveBeenCalledWith('organization_members');
    expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
      organization_id: TEST_ORG_ID,
      user_id: TEST_USER_ID,
      role: 'member',
      department: undefined,
    });
  });

  it('should add a member with a specific role', async () => {
    const mockQueryBuilder = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

    await OrganizationService.addMember(TEST_ORG_ID, TEST_USER_ID, 'manager');

    expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
      organization_id: TEST_ORG_ID,
      user_id: TEST_USER_ID,
      role: 'manager',
      department: undefined,
    });
  });

  it('should add a member with department', async () => {
    const mockQueryBuilder = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

    await OrganizationService.addMember(TEST_ORG_ID, TEST_USER_ID, 'member', 'Engineering');

    expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
      organization_id: TEST_ORG_ID,
      user_id: TEST_USER_ID,
      role: 'member',
      department: 'Engineering',
    });
  });

  it('should throw error when adding member fails', async () => {
    const mockError = new Error('Foreign key constraint failed');

    const mockQueryBuilder = {
      insert: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

    await expect(OrganizationService.addMember(TEST_ORG_ID, 'invalid-user-id')).rejects.toThrow(
      'Foreign key constraint failed'
    );
  });
});

describe('OrganizationService - Team Assessments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a team assessment with required fields', async () => {
    const mockAssessment: TeamAssessment = {
      id: TEST_ASSESSMENT_ID,
      organization_id: TEST_ORG_ID,
      title: 'AI Readiness Assessment',
      description: 'Assess team AI readiness',
      is_mandatory: false,
    };

    const mockQueryBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAssessment, error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

    const result = await OrganizationService.createTeamAssessment({
      organization_id: TEST_ORG_ID,
      title: 'AI Readiness Assessment',
      description: 'Assess team AI readiness',
    });

    expect(supabase.from).toHaveBeenCalledWith('team_assessments');
    expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
      organization_id: TEST_ORG_ID,
      assessment_type: 'ai_opportunity',
      title: 'AI Readiness Assessment',
      description: 'Assess team AI readiness',
      is_mandatory: false,
      due_date: undefined,
    });
    expect(result).toEqual(mockAssessment);
  });

  it('should create a mandatory team assessment', async () => {
    const mockAssessment: TeamAssessment = {
      id: TEST_ASSESSMENT_ID,
      organization_id: TEST_ORG_ID,
      title: 'Mandatory Assessment',
      is_mandatory: true,
    };

    const mockQueryBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: mockAssessment, error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

    const result = await OrganizationService.createTeamAssessment({
      organization_id: TEST_ORG_ID,
      title: 'Mandatory Assessment',
      is_mandatory: true,
    });

    expect(result.is_mandatory).toBe(true);
  });

  it('should submit assessment result', async () => {
    const score = 85;
    const resultsData = {
      correct_answers: 17,
      total_questions: 20,
      time_taken: 1200,
    };

    // Mock insert for team_assessment_results
    const mockInsertBuilder = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    // Mock select for team_assessment_results (getting results for stats)
    const mockResultsBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({
        data: [{ individual_score: score }],
        error: null,
      }),
    };

    // Mock select for team_assessments (getting organization_id)
    const mockAssessmentBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: { organization_id: TEST_ORG_ID },
        error: null,
      }),
    };

    // Mock select for organization_members (getting member count)
    const mockMembersBuilder = {
      select: vi.fn().mockResolvedValue({ count: 5, error: null }),
    };

    // Mock update for team_assessments (updating stats)
    const mockUpdateBuilder = {
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: null, error: null }),
    };

    // Track call count to return different mocks
    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      callCount++;
      if (callCount === 1) return mockInsertBuilder as any; // First call: insert result
      if (callCount === 2) return mockResultsBuilder as any; // Second call: get results
      if (callCount === 3) return mockAssessmentBuilder as any; // Third call: get assessment
      if (callCount === 4) return mockMembersBuilder as any; // Fourth call: get member count
      return mockUpdateBuilder as any; // Fifth call: update stats
    });

    await OrganizationService.submitAssessmentResult(
      TEST_ASSESSMENT_ID,
      TEST_USER_ID,
      score,
      resultsData
    );

    expect(mockInsertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        team_assessment_id: TEST_ASSESSMENT_ID,
        user_id: TEST_USER_ID,
        individual_score: score,
        results_data: resultsData,
      })
    );
  });

  it('should get assessment overview for organization', async () => {
    const mockAssessments = [
      {
        id: TEST_ASSESSMENT_ID,
        organization_id: TEST_ORG_ID,
        title: 'Assessment 1',
        results: [{ count: 5 }],
      },
      {
        id: 'test-assessment-2',
        organization_id: TEST_ORG_ID,
        title: 'Assessment 2',
        results: [{ count: 3 }],
      },
    ];

    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: mockAssessments, error: null }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

    const result = await OrganizationService.getAssessmentOverview(TEST_ORG_ID);

    expect(supabase.from).toHaveBeenCalledWith('team_assessments');
    expect(mockQueryBuilder.eq).toHaveBeenCalledWith('organization_id', TEST_ORG_ID);
    expect(result).toEqual(mockAssessments);
  });
});

describe('OrganizationService - Edge Cases and Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle database errors gracefully', async () => {
    const mockError = new Error('Connection timeout');

    const mockQueryBuilder = {
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

    await expect(
      OrganizationService.create({
        name: 'Test Org',
      })
    ).rejects.toThrow('Connection timeout');
  });

  it('should handle foreign key constraint errors', async () => {
    const mockError = new Error('violates foreign key constraint');

    const mockQueryBuilder = {
      insert: vi.fn().mockResolvedValue({ data: null, error: mockError }),
    };

    vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

    await expect(OrganizationService.addMember('invalid-org-id', TEST_USER_ID)).rejects.toThrow(
      'violates foreign key constraint'
    );
  });
});

describe('OrganizationService - Data Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should accept valid size ranges', async () => {
    const validSizes = ['1-10', '11-50', '51-200', '201-500', '500+'];

    for (const size of validSizes) {
      const mockOrg: Organization = {
        id: TEST_ORG_ID,
        name: `Size Test ${size}`,
        size_range: size,
        owner_id: TEST_USER_ID,
      };

      const mockQueryBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOrg, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

      const result = await OrganizationService.create({
        name: `Size Test ${size}`,
        size_range: size,
      });

      expect(result.size_range).toBe(size);
    }
  });

  it('should accept valid industry values', async () => {
    const industries = ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail'];

    for (const industry of industries) {
      const mockOrg: Organization = {
        id: TEST_ORG_ID,
        name: `Industry Test ${industry}`,
        industry,
        owner_id: TEST_USER_ID,
      };

      const mockQueryBuilder = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockOrg, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

      const result = await OrganizationService.create({
        name: `Industry Test ${industry}`,
        industry,
      });

      expect(result.industry).toBe(industry);
    }
  });

  it('should support all member roles', async () => {
    const roles = ['member', 'manager', 'admin', 'owner'];

    for (const role of roles) {
      const mockQueryBuilder = {
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockQueryBuilder as any);

      await OrganizationService.addMember(TEST_ORG_ID, TEST_USER_ID, role);

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          role,
        })
      );
    }
  });
});
