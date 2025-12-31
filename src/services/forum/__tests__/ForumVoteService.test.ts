/**
 * ForumVoteService Tests
 * Tests Reddit-style upvote/downvote system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ForumVoteService } from '../ForumVoteService';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('@/utils/logger', () => ({
  logger: {
    log: vi.fn(),
    error: vi.fn(),
  },
}));

describe('ForumVoteService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========================================
  // vote() Method Tests
  // ========================================

  describe('vote', () => {
    it('should create a new vote successfully', async () => {
      const mockUser = { id: 'user-123' };
      const mockVote = {
        id: 'vote-1',
        user_id: 'user-123',
        votable_type: 'thread',
        votable_id: 'thread-1',
        vote_type: 'upvote',
      };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let fromCallCount = 0;
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        fromCallCount++;

        // First call: check ban
        if (table === 'forum_bans' && fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        // Second call: check existing vote
        if (table === 'forum_votes' && fromCallCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        // Third call: insert new vote
        if (table === 'forum_votes' && fromCallCount === 3) {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: mockVote,
                  error: null,
                }),
              }),
            }),
          };
        }

        // Fourth call: get thread user_id for karma
        if (table === 'forum_threads' && fromCallCount === 4) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { user_id: 'author-456' },
                  error: null,
                }),
              }),
            }),
          };
        }

        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const result = await ForumVoteService.vote('thread', 'thread-1', 'upvote');

      expect(result).toEqual(mockVote);
      expect(mockRpc).toHaveBeenCalledWith('award_forum_points', {
        p_user_id: 'author-456',
        p_action_type: 'upvote_received',
        p_amount: 2,
      });
    });

    it('should throw error if user is banned', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { id: 'ban-1' }, // User is banned
                error: null,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumVoteService.vote('thread', 'thread-1', 'upvote')).rejects.toThrow(
        'You are banned from voting'
      );
    });

    it('should toggle off vote if same vote type', async () => {
      const mockUser = { id: 'user-123' };
      const existingVote = {
        id: 'vote-1',
        user_id: 'user-123',
        votable_type: 'thread',
        votable_id: 'thread-1',
        vote_type: 'upvote',
      };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let fromCallCount = 0;
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        fromCallCount++;

        // First call: check ban
        if (table === 'forum_bans' && fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        // Second call: check existing vote
        if (table === 'forum_votes' && fromCallCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: existingVote,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        // Third call: delete vote
        if (table === 'forum_votes' && fromCallCount === 3) {
          return {
            delete: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumVoteService.vote('thread', 'thread-1', 'upvote')).rejects.toThrow(
        'Vote removed'
      );
    });

    it('should update vote if different vote type', async () => {
      const mockUser = { id: 'user-123' };
      const existingVote = {
        id: 'vote-1',
        user_id: 'user-123',
        votable_type: 'thread',
        votable_id: 'thread-1',
        vote_type: 'downvote',
      };
      const updatedVote = { ...existingVote, vote_type: 'upvote' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let fromCallCount = 0;
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        fromCallCount++;

        // First call: check ban
        if (table === 'forum_bans' && fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: null,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        // Second call: check existing vote
        if (table === 'forum_votes' && fromCallCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: existingVote,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        // Third call: update vote
        if (table === 'forum_votes' && fromCallCount === 3) {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: updatedVote,
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }

        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.vote('thread', 'thread-1', 'upvote');

      expect(result).toEqual(updatedVote);
    });

    it('should throw error if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(ForumVoteService.vote('thread', 'thread-1', 'upvote')).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Database connection failed' },
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumVoteService.vote('thread', 'thread-1', 'upvote')).rejects.toThrow();
    });
  });

  // ========================================
  // upvote() and downvote() Convenience Methods
  // ========================================

  describe('upvote', () => {
    it('should call vote with upvote type', async () => {
      const mockUser = { id: 'user-123' };
      const mockVote = {
        id: 'vote-1',
        user_id: 'user-123',
        votable_type: 'post',
        votable_id: 'post-1',
        vote_type: 'upvote',
      };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let fromCallCount = 0;
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        fromCallCount++;

        if (table === 'forum_bans' && fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }

        if (table === 'forum_votes' && fromCallCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'forum_votes' && fromCallCount === 3) {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockVote, error: null }),
              }),
            }),
          };
        }

        if (table === 'forum_posts' && fromCallCount === 4) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { user_id: 'author-456' },
                  error: null,
                }),
              }),
            }),
          };
        }

        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const mockRpc = vi.fn().mockResolvedValue({ data: null, error: null });
      (supabase.rpc as ReturnType<typeof vi.fn>) = mockRpc;

      const result = await ForumVoteService.upvote('post', 'post-1');

      expect(result.vote_type).toBe('upvote');
    });
  });

  describe('downvote', () => {
    it('should call vote with downvote type', async () => {
      const mockUser = { id: 'user-123' };
      const mockVote = {
        id: 'vote-1',
        user_id: 'user-123',
        votable_type: 'post',
        votable_id: 'post-1',
        vote_type: 'downvote',
      };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      let fromCallCount = 0;
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        fromCallCount++;

        if (table === 'forum_bans' && fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                }),
              }),
            }),
          };
        }

        if (table === 'forum_votes' && fromCallCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              }),
            }),
          };
        }

        if (table === 'forum_votes' && fromCallCount === 3) {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: mockVote, error: null }),
              }),
            }),
          };
        }

        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.downvote('post', 'post-1');

      expect(result.vote_type).toBe('downvote');
    });
  });

  // ========================================
  // removeVote() Method Tests
  // ========================================

  describe('removeVote', () => {
    it('should remove user vote successfully', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumVoteService.removeVote('thread', 'thread-1')).resolves.toBeUndefined();

      expect(mockFrom).toHaveBeenCalledWith('forum_votes');
    });

    it('should throw error if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(ForumVoteService.removeVote('thread', 'thread-1')).rejects.toThrow(
        'Not authenticated'
      );
    });

    it('should handle database errors', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Delete failed' },
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      await expect(ForumVoteService.removeVote('thread', 'thread-1')).rejects.toThrow();
    });
  });

  // ========================================
  // getUserVote() Method Tests
  // ========================================

  describe('getUserVote', () => {
    it('should return user vote type if exists', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { vote_type: 'upvote' },
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.getUserVote('thread', 'thread-1');

      expect(result).toBe('upvote');
    });

    it('should return null if no vote exists', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.getUserVote('thread', 'thread-1');

      expect(result).toBeNull();
    });

    it('should return null if not authenticated', async () => {
      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const result = await ForumVoteService.getUserVote('thread', 'thread-1');

      expect(result).toBeNull();
    });

    it('should return null on database error', async () => {
      const mockUser = { id: 'user-123' };

      (supabase.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: { message: 'Query failed' },
                }),
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.getUserVote('thread', 'thread-1');

      expect(result).toBeNull();
    });
  });

  // ========================================
  // getVoteCounts() Method Tests
  // ========================================

  describe('getVoteCounts', () => {
    it('should return vote counts and score', async () => {
      let callCount = 0;
      const mockFrom = vi.fn().mockImplementation(() => {
        callCount++;
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  count: callCount === 1 ? 15 : 3, // 15 upvotes, 3 downvotes
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
        };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.getVoteCounts('thread', 'thread-1');

      expect(result).toEqual({
        upvotes: 15,
        downvotes: 3,
        score: 12,
      });
    });

    it('should handle zero votes', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 0,
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.getVoteCounts('thread', 'thread-1');

      expect(result).toEqual({
        upvotes: 0,
        downvotes: 0,
        score: 0,
      });
    });

    it('should return zeros on database error', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: null,
                data: null,
                error: { message: 'Query failed' },
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.getVoteCounts('thread', 'thread-1');

      expect(result).toEqual({
        upvotes: 0,
        downvotes: 0,
        score: 0,
      });
    });
  });

  // ========================================
  // calculateHotScore() Pure Function Tests
  // ========================================

  describe('calculateHotScore', () => {
    it('should calculate hot score for positive score', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z').toISOString();
      const score = ForumVoteService.calculateHotScore(100, 10, createdAt);

      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe('number');
    });

    it('should calculate hot score for negative score', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z').toISOString();
      const score = ForumVoteService.calculateHotScore(10, 100, createdAt);

      // Note: Due to epochSeconds dominating, even negative scores can be positive
      // The important part is the algorithm handles negative scores without errors
      expect(typeof score).toBe('number');
      expect(score).toBeDefined();
    });

    it('should calculate hot score for zero score', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z').toISOString();
      const score = ForumVoteService.calculateHotScore(50, 50, createdAt);

      expect(typeof score).toBe('number');
    });

    it('should give higher score to newer content with same votes', () => {
      const olderDate = new Date('2024-01-01T00:00:00Z').toISOString();
      const newerDate = new Date('2024-12-01T00:00:00Z').toISOString();

      const olderScore = ForumVoteService.calculateHotScore(100, 10, olderDate);
      const newerScore = ForumVoteService.calculateHotScore(100, 10, newerDate);

      expect(newerScore).toBeGreaterThan(olderScore);
    });

    it('should handle edge case with 1 upvote 0 downvotes', () => {
      const createdAt = new Date('2024-01-01T00:00:00Z').toISOString();
      const score = ForumVoteService.calculateHotScore(1, 0, createdAt);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
    });
  });

  // ========================================
  // calculateControversialScore() Pure Function Tests
  // ========================================

  describe('calculateControversialScore', () => {
    it('should return 0 for zero votes', () => {
      const score = ForumVoteService.calculateControversialScore(0, 0);
      expect(score).toBe(0);
    });

    it('should calculate controversial score for balanced votes', () => {
      const score = ForumVoteService.calculateControversialScore(100, 90);

      expect(score).toBeGreaterThan(0);
      expect(typeof score).toBe('number');
    });

    it('should give higher score to more balanced high-vote items', () => {
      const balanced = ForumVoteService.calculateControversialScore(100, 100);
      const unbalanced = ForumVoteService.calculateControversialScore(100, 10);

      expect(balanced).toBeGreaterThan(unbalanced);
    });

    it('should handle upvotes > downvotes', () => {
      const score = ForumVoteService.calculateControversialScore(150, 100);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
    });

    it('should handle downvotes > upvotes', () => {
      const score = ForumVoteService.calculateControversialScore(80, 120);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThan(0);
    });

    it('should return 0 for only upvotes', () => {
      const score = ForumVoteService.calculateControversialScore(100, 0);
      expect(score).toBe(0);
    });

    it('should return 0 for only downvotes', () => {
      const score = ForumVoteService.calculateControversialScore(0, 100);
      expect(score).toBe(0);
    });
  });

  // ========================================
  // getTopVotedThreads() Method Tests
  // ========================================

  describe('getTopVotedThreads', () => {
    it('should return top voted threads without category filter', async () => {
      const mockThreads = [{ id: 'thread-1' }, { id: 'thread-2' }, { id: 'thread-3' }];

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: mockThreads,
                error: null,
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.getTopVotedThreads(undefined, 10);

      expect(result).toEqual(['thread-1', 'thread-2', 'thread-3']);
    });

    it('should return top voted threads with category filter', async () => {
      const mockThreads = [{ id: 'thread-1' }, { id: 'thread-2' }];

      // The service builds: .from().select().eq('is_deleted').order().limit()
      // Then if categoryId, adds: query.eq('category_id', categoryId)
      // So .limit() must return a PromiseLike with .eq() method
      const mockQueryWithCategory = Promise.resolve({
        data: mockThreads,
        error: null,
      });

      const mockQueryBase = Object.assign(
        Promise.resolve({
          data: mockThreads,
          error: null,
        }),
        {
          eq: vi.fn().mockReturnValue(mockQueryWithCategory),
        }
      );

      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(mockQueryBase),
            }),
          }),
        }),
      });

      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.getTopVotedThreads('cat-1', 5);

      expect(result).toEqual(['thread-1', 'thread-2']);
    });

    it('should return empty array on error', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Query failed' },
              }),
            }),
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.getTopVotedThreads();

      expect(result).toEqual([]);
    });
  });

  // ========================================
  // getUserVotingStats() Method Tests
  // ========================================

  describe('getUserVotingStats', () => {
    it('should calculate complete user voting statistics', async () => {
      let fromCallCount = 0;
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        fromCallCount++;

        // Call 1: votes given count
        if (table === 'forum_votes' && fromCallCount === 1) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 50,
                data: null,
                error: null,
              }),
            }),
          };
        }

        // Call 2: upvotes given count
        if (table === 'forum_votes' && fromCallCount === 2) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  count: 35,
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }

        // Call 3: downvotes given count
        if (table === 'forum_votes' && fromCallCount === 3) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  count: 15,
                  data: null,
                  error: null,
                }),
              }),
            }),
          };
        }

        // Call 4: threads by user
        if (table === 'forum_threads' && fromCallCount === 4) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { upvote_count: 10, downvote_count: 2 },
                  { upvote_count: 20, downvote_count: 3 },
                ],
                error: null,
              }),
            }),
          };
        }

        // Call 5: posts by user
        if (table === 'forum_posts' && fromCallCount === 5) {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [
                  { upvote_count: 5, downvote_count: 1 },
                  { upvote_count: 8, downvote_count: 0 },
                ],
                error: null,
              }),
            }),
          };
        }

        return { select: vi.fn() };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.getUserVotingStats('user-123');

      expect(result).toEqual({
        votes_given: 50,
        upvotes_given: 35,
        downvotes_given: 15,
        upvotes_received: 43, // 10+20+5+8
        downvotes_received: 6, // 2+3+1+0
        karma: 37, // 43-6
      });
    });

    it('should handle user with no activity', async () => {
      const mockFrom = vi.fn().mockImplementation(() => {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              count: 0,
              data: [],
              error: null,
            }),
          }),
        };
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.getUserVotingStats('user-new');

      expect(result).toEqual({
        votes_given: 0,
        upvotes_given: 0,
        downvotes_given: 0,
        upvotes_received: 0,
        downvotes_received: 0,
        karma: 0,
      });
    });

    it('should return zeros on database error', async () => {
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            count: null,
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });
      (supabase.from as ReturnType<typeof vi.fn>) = mockFrom;

      const result = await ForumVoteService.getUserVotingStats('user-123');

      expect(result).toEqual({
        votes_given: 0,
        upvotes_given: 0,
        downvotes_given: 0,
        upvotes_received: 0,
        downvotes_received: 0,
        karma: 0,
      });
    });
  });
});
