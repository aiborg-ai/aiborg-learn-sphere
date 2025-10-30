/**
 * Type Definitions - Barrel Export
 *
 * Central export point for all type definitions
 */

// API Types
export type {
  // Common
  ApiResponse,
  ApiError,
  PaginatedResponse,
  SupabaseResponse,

  // User & Auth
  User,
  Profile,
  UserPreferences,
  AuthResponse,

  // Course
  Course,
  CourseWithInstructor,
  CourseWithEnrollment,
  CourseMaterial,

  // Enrollment
  Enrollment,
  UserProgress,

  // Event
  Event,
  EventRegistration,

  // Assignment & Homework
  HomeworkAssignment,
  HomeworkSubmission,

  // Assessment
  AssessmentQuestion,
  AssessmentOption,
  AssessmentSession,
  AssessmentResponse,

  // Blog
  BlogPost,
  BlogPostWithAuthor,
  BlogCategory,
  BlogComment,
  BlogCommentWithUser,

  // Review
  Review,
  ReviewWithUser,

  // Achievement
  Achievement,
  AchievementCriteria,
  UserAchievement,
  UserAchievementWithDetails,

  // Learning Path
  LearningPath,
  LearningPathStep,
  LearningPathProgress,

  // Content Tracking
  ContentView,
  Bookmark,

  // Notification
  Notification,

  // Analytics
  UserAnalytics,
  CourseAnalytics,

  // File Upload
  FileUploadProgress,
  StorageFile,

  // Search & Filter
  SearchFilters,
  SearchResult,

  // Payment
  Payment,
  Invoice,
  InvoiceItem,
} from './api';

// Hook Types
export type {
  // Async State
  AsyncState,
  AsyncStateWithMeta,

  // Query
  UseQueryResult,
  UseQueryOptions,

  // Mutation
  UseMutationResult,
  UseMutationOptions,

  // Form
  UseFormResult,
  UseFormOptions,

  // Pagination
  UsePaginationResult,
  UsePaginationOptions,

  // Infinite Query
  UseInfiniteQueryResult,
  UseInfiniteQueryOptions,

  // Local Storage
  UseLocalStorageResult,

  // Debounce
  UseDebounceOptions,
  DebouncedFunction,

  // Media Query
  UseMediaQueryResult,

  // Intersection Observer
  UseIntersectionObserverOptions,
  UseIntersectionObserverResult,

  // Async
  UseAsyncOptions,
  UseAsyncResult,

  // CRUD
  UseCRUDResult,

  // Filter
  UseFilterResult,

  // Sort
  SortDirection,
  SortConfig,
  UseSortResult,

  // Selection
  UseSelectionResult,

  // Upload
  UseFileUploadResult,
  UseFileUploadOptions,

  // WebSocket
  UseWebSocketOptions,
  UseWebSocketResult,

  // Timer
  UseTimerResult,
  UseTimerOptions,

  // Validation
  ValidationRule,
  UseValidationResult,

  // Auth
  UseAuthResult,

  // Permissions
  Permission,
  Role,
  UsePermissionsResult,

  // Feature Flags
  UseFeatureFlagResult,

  // Theme
  Theme,
  UseThemeResult,
} from './hooks';

// Utility Types
export type {
  // Basic Utilities
  DeepPartial,
  DeepRequired,
  DeepReadonly,
  Optional,
  ArrayElement,
  PromiseType,
  ReturnTypeOf,

  // Object Manipulation
  PickByType,
  OmitByType,
  Mutable,
  UnionToIntersection,
  RequireAtLeastOne,
  RequireOnlyOne,

  // String Manipulation
  SnakeToCamel,

  // Validation
  TypeGuard,
  Validator,
  AsyncValidator,
  ValidationSchema,

  // Form
  FieldState,
  FormState,
  FieldErrors,
  TouchedFields,

  // Event
  EventHandler,
  AsyncEventHandler,
  ChangeEvent,
  FormEvent,

  // Component
  PropsWithChildren,
  PropsWithClassName,
  PropsWithRef,
  ComponentWithDisplayName,

  // API
  HttpMethod,
  HttpStatus,
  RequestConfig,
  Response,

  // Pagination
  PaginationParams,
  PaginatedData,
  CursorPaginationParams,
  CursorPaginatedData,

  // Filter
  FilterOperator,
  FilterCondition,
  FilterGroup,

  // Sort
  SortOption,
  SortOptions,

  // State
  LoadingState,
  AsyncData,
  AsyncDataWithMeta,

  // Notification
  NotificationType,
  NotificationOptions,

  // Time
  TimeUnit,
  Duration,
  DateRange,
  TimeRange,

  // File
  FileType,
  FileInfo,
  UploadedFile,

  // Permission
  Action,
  PermissionCheck,

  // Color
  ColorScheme,
  Color,
  ColorPalette,

  // Route
  RouteParams,
  RouteConfig,

  // Environment
  Environment,
  EnvironmentConfig,
} from './utils';

// Session Types
export type {
  // Session
  SessionStatus,
  RegistrationStatus,
  RegistrationSource,
  WaitlistStatus,
  MeetingProvider,
  Currency,
  DeviceType,
  FreeSession,
  SessionRegistration,
  SessionWaitlist,
  SessionAttendance,
  SessionWithCounts,
  SessionRegistrationWithSession,
  SessionRegistrationWithWaitlist,
  WaitlistWithRegistration,
  CreateSessionInput,
  UpdateSessionInput,
  CreateRegistrationInput,
  UpdateRegistrationInput,
  SessionListResponse,
  RegistrationResponse,
  WaitlistPromotionResponse,
} from './session';
