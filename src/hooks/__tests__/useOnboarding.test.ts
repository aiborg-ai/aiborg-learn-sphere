import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useOnboarding } from '../useOnboarding';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../useAuth';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

// Mock useAuth
vi.mock('../useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('useOnboarding', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockProgress = {
    id: 'progress-1',
    user_id: 'user-123',
    completed_tips: ['tip-1', 'tip-2'],
    has_completed_profile: false,
    has_enrolled_in_course: false,
    has_attended_event: false,
    has_completed_assessment: false,
    has_explored_dashboard: true,
    has_used_ai_chat: false,
    has_created_content: false,
    onboarding_completed: false,
    onboarding_skipped: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    completed_at: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      profile: null,
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      signUp: vi.fn(),
    } as any);
  });

  it('fetches onboarding progress on mount', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: mockProgress, error: null });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    } as any);

    const { result } = renderHook(() => useOnboarding());

    // Initially loading
    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockSelect).toHaveBeenCalledWith('*');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123');
    expect(result.current.progress).toEqual(mockProgress);
  });

  it('returns null progress when user is not authenticated', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      profile: null,
      loading: false,
      isAdmin: false,
      signOut: vi.fn(),
      signIn: vi.fn(),
      signUp: vi.fn(),
    } as any);

    const { result } = renderHook(() => useOnboarding());

    expect(result.current.progress).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('isTipCompleted returns correct value', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: mockProgress, error: null });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    } as any);

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.isTipCompleted('tip-1')).toBe(true);
    expect(result.current.isTipCompleted('tip-2')).toBe(true);
    expect(result.current.isTipCompleted('tip-3')).toBe(false);
  });

  it('markTipCompleted adds tip to completed list', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: mockProgress, error: null });
    const mockUpdate = vi.fn().mockReturnThis();

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
      eq: mockEq,
      single: mockSingle,
    } as any);

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock the update response
    const updatedProgress = {
      ...mockProgress,
      completed_tips: ['tip-1', 'tip-2', 'tip-3'],
    };
    mockSingle.mockResolvedValueOnce({ data: updatedProgress, error: null });

    await result.current.markTipCompleted('tip-3');

    await waitFor(() => {
      expect(result.current.progress?.completed_tips).toContain('tip-3');
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      completed_tips: ['tip-1', 'tip-2', 'tip-3'],
    });
  });

  it('markMilestone updates milestone field', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: mockProgress, error: null });
    const mockUpdate = vi.fn().mockReturnThis();

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
      eq: mockEq,
      single: mockSingle,
    } as any);

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock the update response
    const updatedProgress = {
      ...mockProgress,
      has_enrolled_in_course: true,
    };
    mockSingle.mockResolvedValueOnce({ data: updatedProgress, error: null });

    await result.current.markMilestone('has_enrolled_in_course');

    await waitFor(() => {
      expect(result.current.progress?.has_enrolled_in_course).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      has_enrolled_in_course: true,
    });
  });

  it('does not mark milestone if already completed', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: mockProgress, error: null });
    const mockUpdate = vi.fn().mockReturnThis();

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
      eq: mockEq,
      single: mockSingle,
    } as any);

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Try to mark already completed milestone
    await result.current.markMilestone('has_explored_dashboard');

    // Update should not be called since milestone is already true
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('skipOnboarding marks onboarding as skipped', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: mockProgress, error: null });
    const mockUpdate = vi.fn().mockReturnThis();

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
      eq: mockEq,
      single: mockSingle,
    } as any);

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock the update response
    const updatedProgress = {
      ...mockProgress,
      onboarding_skipped: true,
    };
    mockSingle.mockResolvedValueOnce({ data: updatedProgress, error: null });

    await result.current.skipOnboarding();

    await waitFor(() => {
      expect(result.current.progress?.onboarding_skipped).toBe(true);
    });

    expect(mockUpdate).toHaveBeenCalledWith({
      onboarding_skipped: true,
    });
  });

  it('resetOnboarding clears all progress', async () => {
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({ data: mockProgress, error: null });
    const mockUpdate = vi.fn().mockReturnThis();

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      update: mockUpdate,
      eq: mockEq,
      single: mockSingle,
    } as any);

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Mock the update response
    const resetProgress = {
      ...mockProgress,
      completed_tips: [],
      has_completed_profile: false,
      has_enrolled_in_course: false,
      has_attended_event: false,
      has_completed_assessment: false,
      has_explored_dashboard: false,
      has_used_ai_chat: false,
      has_created_content: false,
      onboarding_completed: false,
      onboarding_skipped: false,
    };
    mockSingle.mockResolvedValueOnce({ data: resetProgress, error: null });

    await result.current.resetOnboarding();

    await waitFor(() => {
      expect(result.current.progress?.completed_tips).toEqual([]);
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        completed_tips: [],
        has_completed_profile: false,
        has_enrolled_in_course: false,
        onboarding_completed: false,
        onboarding_skipped: false,
      })
    );
  });

  it('handles errors gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockSelect = vi.fn().mockReturnThis();
    const mockEq = vi.fn().mockReturnThis();
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error' },
    });

    vi.mocked(supabase.from).mockReturnValue({
      select: mockSelect,
      eq: mockEq,
      single: mockSingle,
    } as any);

    const { result } = renderHook(() => useOnboarding());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual({ message: 'Database error' });
    expect(result.current.progress).toBeNull();

    consoleErrorSpy.mockRestore();
  });
});
