import { vi } from 'vitest';

/**
 * Create a mock Supabase query builder with chainable methods
 */
export const createMockQueryBuilder = (mockData?: unknown, mockError: unknown = null) => {
  const builder = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    upsert: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    like: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    containedBy: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    match: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    filter: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: mockData, error: mockError }),
    maybeSingle: vi.fn().mockResolvedValue({ data: mockData, error: mockError }),
    then: vi.fn(resolve => resolve({ data: mockData, error: mockError })),
  };

  return builder;
};

/**
 * Create a mock Supabase storage bucket
 */
export const createMockStorageBucket = () => ({
  upload: vi.fn().mockResolvedValue({ data: { path: 'mock-path' }, error: null }),
  download: vi.fn().mockResolvedValue({ data: new Blob(), error: null }),
  remove: vi.fn().mockResolvedValue({ data: null, error: null }),
  getPublicUrl: vi.fn().mockReturnValue({
    data: { publicUrl: 'https://example.com/file.jpg' },
  }),
  createSignedUrl: vi.fn().mockResolvedValue({
    data: { signedUrl: 'https://example.com/signed-url' },
    error: null,
  }),
  list: vi.fn().mockResolvedValue({ data: [], error: null }),
});

/**
 * Create a mock Supabase client
 */
export const createMockSupabaseClient = () => ({
  auth: {
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signInWithPassword: vi
      .fn()
      .mockResolvedValue({ data: { user: null, session: null }, error: null }),
    signInWithOAuth: vi
      .fn()
      .mockResolvedValue({ data: { url: null, provider: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: null, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    }),
  },
  from: vi.fn((_table: string) => createMockQueryBuilder()),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  storage: {
    from: vi.fn((_bucket: string) => createMockStorageBucket()),
  },
  channel: vi.fn().mockReturnValue({
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  }),
});

/**
 * Helper to setup Supabase mocks for a specific table with data
 */
export const setupTableMock = (
  supabaseMock: ReturnType<typeof createMockSupabaseClient>,
  tableName: string,
  data: unknown,
  error: unknown = null
) => {
  (supabaseMock.from as ReturnType<typeof vi.fn>).mockImplementation((table: string) => {
    if (table === tableName) {
      return createMockQueryBuilder(data, error);
    }
    return createMockQueryBuilder();
  });
};

/**
 * Helper to setup auth mocks with user session
 */
export const setupAuthMock = (
  supabaseMock: ReturnType<typeof createMockSupabaseClient>,
  user: unknown,
  session: unknown
) => {
  (supabaseMock.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: { session },
    error: null,
  });

  (supabaseMock.auth.getUser as ReturnType<typeof vi.fn>).mockResolvedValue({
    data: { user },
    error: null,
  });
};

/**
 * Helper to setup RPC mock
 */
export const setupRpcMock = (
  supabaseMock: ReturnType<typeof createMockSupabaseClient>,
  functionName: string,
  returnData: unknown,
  error: unknown = null
) => {
  (supabaseMock.rpc as ReturnType<typeof vi.fn>).mockImplementation(
    (name: string, _params?: unknown) => {
      if (name === functionName) {
        return Promise.resolve({ data: returnData, error });
      }
      return Promise.resolve({ data: null, error: null });
    }
  );
};
