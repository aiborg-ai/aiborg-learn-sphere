/**
 * Utility Type Definitions
 *
 * Common utility types and type helpers for the application
 */

// ============================================================================
// Basic Utility Types
// ============================================================================

/**
 * Makes all properties optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Makes all properties required recursively
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Makes all properties readonly recursively
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * Makes specific properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes specific properties required
 */
export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Excludes null and undefined from type
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Extract the type of an array element
 */
export type ArrayElement<T> = T extends ReadonlyArray<infer U> ? U : never;

/**
 * Extract the type of a Promise
 */
export type PromiseType<T> = T extends Promise<infer U> ? U : never;

/**
 * Extract function return type
 */
export type ReturnTypeOf<T> = T extends (...args: unknown[]) => infer R ? R : never;

// ============================================================================
// Object Manipulation Types
// ============================================================================

/**
 * Pick properties by type
 */
export type PickByType<T, V> = {
  [K in keyof T as T[K] extends V ? K : never]: T[K];
};

/**
 * Omit properties by type
 */
export type OmitByType<T, V> = {
  [K in keyof T as T[K] extends V ? never : K]: T[K];
};

/**
 * Make properties mutable
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Convert union to intersection
 */
export type UnionToIntersection<U> = (
  U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
  ? I
  : never;

/**
 * Ensure at least one property from a set is required
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * Ensure exactly one property from a set is provided
 */
export type RequireOnlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

// ============================================================================
// String Manipulation Types
// ============================================================================

/**
 * Convert string to uppercase
 */
export type Uppercase<T extends string> = T extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Uppercase<Rest>}`
  : T;

/**
 * Convert string to lowercase
 */
export type Lowercase<T extends string> = T extends `${infer First}${infer Rest}`
  ? `${Lowercase<First>}${Lowercase<Rest>}`
  : T;

/**
 * Capitalize first letter
 */
export type Capitalize<T extends string> = T extends `${infer First}${infer Rest}`
  ? `${Uppercase<First>}${Rest}`
  : T;

/**
 * Convert snake_case to camelCase
 */
export type SnakeToCamel<S extends string> = S extends `${infer T}_${infer U}`
  ? `${T}${Capitalize<SnakeToCamel<U>>}`
  : S;

// ============================================================================
// Validation Types
// ============================================================================

/**
 * Type guard function
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * Validator function that returns error message or undefined
 */
export type Validator<T> = (value: T) => string | undefined;

/**
 * Async validator function
 */
export type AsyncValidator<T> = (value: T) => Promise<string | undefined>;

/**
 * Validation schema for an object
 */
export type ValidationSchema<T> = {
  [K in keyof T]?: Validator<T[K]> | Validator<T[K]>[];
};

// ============================================================================
// Form Types
// ============================================================================

/**
 * Form field state
 */
export interface FieldState<T> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

/**
 * Form state for all fields
 */
export type FormState<T> = {
  [K in keyof T]: FieldState<T[K]>;
};

/**
 * Form field errors
 */
export type FieldErrors<T> = {
  [K in keyof T]?: string;
};

/**
 * Form touched fields
 */
export type TouchedFields<T> = {
  [K in keyof T]?: boolean;
};

// ============================================================================
// Event Types
// ============================================================================

/**
 * Event handler type
 */
export type EventHandler<E = Event> = (event: E) => void;

/**
 * Async event handler type
 */
export type AsyncEventHandler<E = Event> = (event: E) => Promise<void>;

/**
 * Change event for form inputs
 */
export type ChangeEvent<T = Element> = React.ChangeEvent<T>;

/**
 * Submit event for forms
 */
export type FormEvent<T = Element> = React.FormEvent<T>;

// ============================================================================
// Component Types
// ============================================================================

/**
 * Props with children
 */
export type PropsWithChildren<P = unknown> = P & {
  children?: React.ReactNode;
};

/**
 * Props with className
 */
export type PropsWithClassName<P = unknown> = P & {
  className?: string;
};

/**
 * Props with ref
 */
export type PropsWithRef<T, P = unknown> = P & {
  ref?: React.Ref<T>;
};

/**
 * Component with display name
 */
export type ComponentWithDisplayName<P = unknown> = React.FC<P> & {
  displayName?: string;
};

// ============================================================================
// API Types
// ============================================================================

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * HTTP status codes
 */
export type HttpStatus =
  | 200
  | 201
  | 204
  | 400
  | 401
  | 403
  | 404
  | 422
  | 500
  | 502
  | 503;

/**
 * Request configuration
 */
export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  timeout?: number;
  retries?: number;
}

/**
 * Response type
 */
export interface Response<T> {
  data: T;
  status: HttpStatus;
  headers: Record<string, string>;
  ok: boolean;
}

// ============================================================================
// Pagination Types
// ============================================================================

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
}

export interface CursorPaginatedData<T> {
  data: T[];
  nextCursor?: string;
  hasMore: boolean;
}

// ============================================================================
// Filter Types
// ============================================================================

export type FilterOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'like'
  | 'ilike'
  | 'between';

export interface FilterCondition<T = unknown> {
  field: string;
  operator: FilterOperator;
  value: T;
}

export type FilterGroup = {
  operator: 'and' | 'or';
  conditions: (FilterCondition | FilterGroup)[];
};

// ============================================================================
// Sort Types
// ============================================================================

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export type SortOptions = SortOption[];

// ============================================================================
// State Types
// ============================================================================

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncData<T, E = Error> {
  data: T | null;
  error: E | null;
  status: LoadingState;
}

export interface AsyncDataWithMeta<T, E = Error> extends AsyncData<T, E> {
  isIdle: boolean;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  lastFetched?: Date;
}

// ============================================================================
// Notification Types
// ============================================================================

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

export interface NotificationOptions {
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// Time Types
// ============================================================================

export type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

export interface Duration {
  value: number;
  unit: TimeUnit;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeRange {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

// ============================================================================
// File Types
// ============================================================================

export type FileType =
  | 'image'
  | 'video'
  | 'audio'
  | 'document'
  | 'pdf'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'code'
  | 'other';

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  extension: string;
  fileType: FileType;
}

export interface UploadedFile extends FileInfo {
  url: string;
  path: string;
  uploadedAt: Date;
}

// ============================================================================
// Permission Types
// ============================================================================

export type Action = 'create' | 'read' | 'update' | 'delete';

export interface Permission {
  resource: string;
  actions: Action[];
}

export type PermissionCheck = (permission: Permission) => boolean;

// ============================================================================
// Color Types
// ============================================================================

export type ColorScheme = 'light' | 'dark';

export type Color =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'default';

export interface ColorPalette {
  main: string;
  light: string;
  dark: string;
  contrastText: string;
}

// ============================================================================
// Route Types
// ============================================================================

export interface RouteParams {
  [key: string]: string | undefined;
}

export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  auth?: boolean;
  roles?: string[];
  permissions?: Permission[];
}

// ============================================================================
// Environment Types
// ============================================================================

export type Environment = 'development' | 'staging' | 'production' | 'test';

export interface EnvironmentConfig {
  apiUrl: string;
  wsUrl?: string;
  environment: Environment;
  version: string;
  features: Record<string, boolean>;
}
