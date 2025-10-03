/**
 * Generic Hook Type Definitions
 *
 * Type-safe patterns for common React hooks and custom hooks
 */

import type { ApiResponse, ApiError } from './api';

// ============================================================================
// Generic Async State Types
// ============================================================================

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export interface AsyncStateWithMeta<T> extends AsyncState<T> {
  isIdle: boolean;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
}

// ============================================================================
// Query Hook Types
// ============================================================================

export interface UseQueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseQueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retry?: number | boolean;
}

// ============================================================================
// Mutation Hook Types
// ============================================================================

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  data: TData | undefined;
  error: Error | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  reset: () => void;
}

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (data: TData | undefined, error: Error | null, variables: TVariables) => void;
}

// ============================================================================
// Form Hook Types
// ============================================================================

export interface UseFormResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (field: keyof T, value: T[keyof T]) => void;
  handleBlur: (field: keyof T) => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;
  setFieldError: (field: keyof T, error: string) => void;
  resetForm: () => void;
}

export interface UseFormOptions<T> {
  initialValues: T;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

// ============================================================================
// Pagination Hook Types
// ============================================================================

export interface UsePaginationResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage: () => void;
  previousPage: () => void;
  goToPage: (page: number) => void;
  setPageSize: (size: number) => void;
  isLoading: boolean;
  error: Error | null;
}

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  enabled?: boolean;
}

// ============================================================================
// Infinite Query Hook Types
// ============================================================================

export interface UseInfiniteQueryResult<T> {
  data: T[];
  fetchNextPage: () => Promise<void>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UseInfiniteQueryOptions {
  pageSize?: number;
  enabled?: boolean;
  getNextPageParam?: (lastPage: unknown, allPages: unknown[]) => unknown;
}

// ============================================================================
// Local Storage Hook Types
// ============================================================================

export interface UseLocalStorageResult<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
}

// ============================================================================
// Debounce Hook Types
// ============================================================================

export interface UseDebounceOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
  maxWait?: number;
}

export type DebouncedFunction<T extends (...args: Parameters<T>) => ReturnType<T>> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
};

// ============================================================================
// Media Query Hook Types
// ============================================================================

export interface UseMediaQueryResult {
  matches: boolean;
  media: string;
}

// ============================================================================
// Intersection Observer Hook Types
// ============================================================================

export interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export interface UseIntersectionObserverResult {
  ref: React.RefObject<Element>;
  entry: IntersectionObserverEntry | undefined;
  isIntersecting: boolean;
}

// ============================================================================
// Async Hook Pattern
// ============================================================================

export interface UseAsyncOptions {
  immediate?: boolean;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

export interface UseAsyncResult<T, Args extends unknown[] = []> {
  execute: (...args: Args) => Promise<T>;
  data: T | null;
  loading: boolean;
  error: Error | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

// ============================================================================
// CRUD Hook Types
// ============================================================================

export interface UseCRUDResult<T, TCreate = Partial<T>, TUpdate = Partial<T>> {
  items: T[];
  loading: boolean;
  error: Error | null;
  create: (data: TCreate) => Promise<T>;
  read: (id: string) => Promise<T>;
  update: (id: string, data: TUpdate) => Promise<T>;
  delete: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

// ============================================================================
// Filter Hook Types
// ============================================================================

export interface UseFilterResult<T, F> {
  filteredData: T[];
  filters: F;
  setFilter: <K extends keyof F>(key: K, value: F[K]) => void;
  setFilters: (filters: Partial<F>) => void;
  clearFilters: () => void;
  activeFiltersCount: number;
}

// ============================================================================
// Sort Hook Types
// ============================================================================

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T> {
  field: keyof T;
  direction: SortDirection;
}

export interface UseSortResult<T> {
  sortedData: T[];
  sortConfig: SortConfig<T> | null;
  requestSort: (field: keyof T) => void;
  setSortConfig: (config: SortConfig<T> | null) => void;
}

// ============================================================================
// Selection Hook Types
// ============================================================================

export interface UseSelectionResult<T> {
  selected: Set<T>;
  isSelected: (item: T) => boolean;
  toggle: (item: T) => void;
  select: (item: T) => void;
  deselect: (item: T) => void;
  selectAll: (items: T[]) => void;
  deselectAll: () => void;
  selectedArray: T[];
  selectedCount: number;
}

// ============================================================================
// Upload Hook Types
// ============================================================================

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export interface UseFileUploadResult {
  upload: (files: File | File[]) => Promise<string[]>;
  uploads: FileUploadProgress[];
  isUploading: boolean;
  progress: number;
  cancel: (file: File) => void;
  cancelAll: () => void;
  clear: () => void;
}

export interface UseFileUploadOptions {
  maxSize?: number;
  allowedTypes?: string[];
  maxFiles?: number;
  onSuccess?: (urls: string[]) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

// ============================================================================
// WebSocket Hook Types
// ============================================================================

export interface UseWebSocketOptions {
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: (event: Event) => void;
  onClose?: (event: CloseEvent) => void;
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
}

export interface UseWebSocketResult {
  sendMessage: (data: string | ArrayBufferLike | Blob | ArrayBufferView) => void;
  lastMessage: MessageEvent | null;
  readyState: number;
  isConnected: boolean;
}

// ============================================================================
// Timer Hook Types
// ============================================================================

export interface UseTimerResult {
  time: number;
  isRunning: boolean;
  start: () => void;
  stop: () => void;
  reset: () => void;
  restart: () => void;
}

export interface UseTimerOptions {
  initialTime?: number;
  interval?: number;
  autoStart?: boolean;
  onTick?: (time: number) => void;
  onComplete?: () => void;
}

// ============================================================================
// Validation Hook Types
// ============================================================================

export type ValidationRule<T> = (value: T) => string | undefined;

export interface UseValidationResult<T> {
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  validate: (field: keyof T, value: T[keyof T]) => boolean;
  validateAll: (values: T) => boolean;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;
}

// ============================================================================
// Auth Hook Types
// ============================================================================

export interface UseAuthResult<TUser = unknown> {
  user: TUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: unknown) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: unknown) => Promise<void>;
  updateProfile: (data: Partial<TUser>) => Promise<void>;
  refreshSession: () => Promise<void>;
}

// ============================================================================
// Permission Hook Types
// ============================================================================

export type Permission = string;
export type Role = string;

export interface UsePermissionsResult {
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: Role) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  permissions: Permission[];
  roles: Role[];
}

// ============================================================================
// Feature Flag Hook Types
// ============================================================================

export interface UseFeatureFlagResult {
  isEnabled: (flag: string) => boolean;
  flags: Record<string, boolean>;
  loading: boolean;
}

// ============================================================================
// Theme Hook Types
// ============================================================================

export type Theme = 'light' | 'dark' | 'system';

export interface UseThemeResult {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
  systemTheme: 'light' | 'dark';
}
