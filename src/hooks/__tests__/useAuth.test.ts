import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { supabase } from '@/integrations/supabase/client';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      getSession: vi.fn(),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}));

describe('useAuth', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    created_at: '2024-01-01',
  };

  const mockSession = {
    user: mockUser,
    access_token: 'mock-token',
    refresh_token: 'mock-refresh',
    expires_in: 3600,
    expires_at: Date.now() + 3600000,
    token_type: 'bearer',
  };

  const mockProfile = {
    id: 'profile-123',
    user_id: 'user-123',
    display_name: 'Test User',
    email: 'test@example.com',
    avatar_url: null,
    role: 'user',
    preferences: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mock behavior
    const mockSubscription = { unsubscribe: vi.fn() };
    (supabase.auth.onAuthStateChange as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { subscription: mockSubscription },
    });

    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initialization', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.session).toBeNull();
      expect(result.current.profile).toBeNull();
    });

    it('should fetch session on mount', async () => {
      (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      renderHook(() => useAuth());

      await waitFor(() => {
        expect(supabase.auth.getSession).toHaveBeenCalled();
      });
    });

    it('should set up auth state listener', () => {
      renderHook(() => useAuth());

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  describe('signUp', () => {
    it('should call supabase signUp with correct parameters', async () => {
      (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(async () => {
        const { error } = await result.current.signUp(
          'test@example.com',
          'password123',
          'Test User'
        );
        expect(error).toBeNull();
      });

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: expect.any(String),
          data: {
            display_name: 'Test User',
          },
        },
      });
    });

    it('should return error on signUp failure', async () => {
      const mockError = new Error('Sign up failed');
      (supabase.auth.signUp as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(async () => {
        const { error } = await result.current.signUp('test@example.com', 'password123');
        expect(error).toBe(mockError);
      });
    });
  });

  describe('signIn', () => {
    it('should call supabase signInWithPassword with correct parameters', async () => {
      (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(async () => {
        const { error } = await result.current.signIn('test@example.com', 'password123');
        expect(error).toBeNull();
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should return error on signIn failure', async () => {
      const mockError = new Error('Invalid credentials');
      (supabase.auth.signInWithPassword as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(async () => {
        const { error } = await result.current.signIn('test@example.com', 'wrongpassword');
        expect(error).toBe(mockError);
      });
    });
  });

  describe('signOut', () => {
    it('should call supabase signOut', async () => {
      (supabase.auth.signOut as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(async () => {
        const { error } = await result.current.signOut();
        expect(error).toBeNull();
      });

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('OAuth sign-in', () => {
    it('should call signInWithGoogle correctly', async () => {
      (supabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { url: 'https://google.com/auth', provider: 'google' },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(async () => {
        const { error } = await result.current.signInWithGoogle();
        expect(error).toBeNull();
      });

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
    });

    it('should call signInWithGitHub correctly', async () => {
      (supabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { url: 'https://github.com/login/oauth', provider: 'github' },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await waitFor(async () => {
        const { error } = await result.current.signInWithGitHub();
        expect(error).toBeNull();
      });

      expect(supabase.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'github',
        options: {
          redirectTo: expect.stringContaining('/auth/callback'),
        },
      });
    });

    it('should store auth redirect in sessionStorage', async () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      (supabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { url: 'https://google.com/auth', provider: 'google' },
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await result.current.signInWithGoogle();

      expect(setItemSpy).toHaveBeenCalledWith('authRedirect', expect.any(String));

      setItemSpy.mockRestore();
    });
  });

  describe('updateProfile', () => {
    it('should update profile when user is logged in', async () => {
      // Setup authenticated state
      (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(mockFrom);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.user).not.toBeNull();
      });

      const updates = { display_name: 'Updated Name' };

      await waitFor(async () => {
        const { error } = await result.current.updateProfile(updates);
        expect(error).toBeNull();
      });
    });

    it('should return error when no user is logged in', async () => {
      const { result } = renderHook(() => useAuth());

      await waitFor(async () => {
        const { error } = await result.current.updateProfile({ display_name: 'Test' });
        expect(error).toBeDefined();
        expect(error?.message).toContain('No user logged in');
      });
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin users', async () => {
      const adminProfile = { ...mockProfile, role: 'admin' };

      (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: adminProfile, error: null }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(mockFrom);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
      });
    });

    it('should return false for non-admin users', async () => {
      (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
      });

      (supabase.from as ReturnType<typeof vi.fn>).mockImplementation(mockFrom);

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(false);
      });
    });
  });
});
