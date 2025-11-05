# AiBorg Learn Sphere - Comprehensive Codebase Overview

## Executive Summary

**AiBorg Learn Sphere** is a comprehensive, enterprise-grade Learning Management System (LMS) and
AI-powered educational platform built with modern web technologies. It features adaptive
assessments, AI chatbots, gamification, social learning, family memberships, and extensive analytics
capabilities.

**Statistics:**

- **863 TypeScript/TSX files** comprising ~19,425 lines of frontend code
- **137 database migrations** managing complex PostgreSQL schema
- **40+ Supabase Edge Functions** providing serverless backend functionality
- **Multiple deployment environments** (Development, Staging, Production)
- **Full type safety** with TypeScript and Zod validation

---

## 1. Project Type & Tech Stack

### Frontend Framework & Build Tools

- **React 18.3.1** - Modern UI library with hooks and functional components
- **Vite 5.4.1** - Fast ES module build tool with hot module replacement
- **TypeScript 5.9.3** - Full type safety throughout codebase
- **SWC** - Ultra-fast JavaScript compiler (via @vitejs/plugin-react-swc)

### UI & Component Library

- **shadcn/ui** - Headless, accessible component library built on Radix UI
- **Tailwind CSS 3.4.11** - Utility-first CSS framework for styling
- **Radix UI** - Unstyled, accessible component primitives (20+ packages)
  - Includes: Dialog, Dropdown, Select, Tooltip, Popover, Accordion, Tabs, etc.
- **Lucide React 0.462.0** - Modern icon library (1000+ icons)

### State Management & Data Fetching

- **React Router v6.26.2** - Client-side routing with nested routes
- **TanStack React Query 5.90.5** - Server state management and caching
- **React Context API** - Local state management (PersonalizationContext)
- **React Hook Form 7.65.0** - Performant form handling
- **Zod 3.23.8** - TypeScript-first schema validation

### Backend & Database

- **Supabase** - Open-source Firebase alternative
  - PostgreSQL database with Row-Level Security (RLS)
  - Real-time subscriptions via WebSocket
  - Authentication (email, OAuth, Social login)
  - File storage (Supabase Storage/S3)
  - Vector database support (pgvector)
  - Edge Functions (serverless Deno functions)

### AI & Advanced Features

- **Jitsi Video Integration** (@jitsi/react-sdk) - Video conferencing
- **TipTap** - Headless rich text editor for content creation
- **Recharts 2.12.7** - Data visualization library
- **html2canvas & jsPDF** - PDF export functionality
- **Marked 16.4.1** - Markdown parsing and rendering
- **DOMPurify** - XSS protection for HTML content
- **React PDF** - PDF viewing component
- **QR Code** - QR code generation
- **Day Picker** - Date selection component
- **React Syntax Highlighter** - Code syntax highlighting

### i18n & Internationalization

- **i18next 25.6.0** - Multi-language support framework
- **react-i18next 16.2.3** - React integration
- **i18next-browser-languagedetector** - Automatic language detection
- **Supported Languages:** English (en), Spanish (es), French (fr), German (de)

### Additional Libraries

- **Embla Carousel** - Touch-friendly carousel component
- **React Dropzone** - File upload handling
- **React Resizable Panels** - Splitter/resizable layout panels
- **Sonner & react-toaster** - Toast notifications
- **next-themes** - Theme provider for dark/light mode
- **web-vitals** - Web performance metrics
- **Input OTP** - One-time password input component

### Development & Testing

- **Vitest 3.2.4** - Unit testing framework (Vite-native)
- **Playwright 1.56.1** - E2E testing
- **Testing Library** - React component testing utilities
- **ESLint 9.38.0** - Code linting with type support
- **Prettier 3.6.2** - Code formatting
- **Husky 9.1.7** - Git hooks
- **lint-staged** - Run linters on staged files
- **TypeScript ESLint** - Type-aware linting

### Deployment & DevOps

- **Vercel** - Frontend hosting and deployment
- **GitHub** - Source control (SSH-based authentication)
- **GitHub Actions** - CI/CD pipeline (bundle-size.yml)

### Performance & Monitoring

- **Vite Bundle Visualizer** - Bundle analysis tool
- **Performance Monitoring Service** - Custom metrics tracking
- **RUM (Real User Monitoring)** - Web analytics
- **Web Vitals** - Core Web Vitals tracking

---

## 2. Main Directory Structure & Key Folders

```
aiborg-learn-sphere/
├── src/                                    # Source code
│   ├── components/                         # React components (54 subdirectories)
│   │   ├── admin/                         # Admin panel components
│   │   ├── ai-assessment/                 # AI assessment components
│   │   ├── analytics/                     # Analytics & dashboard charts
│   │   ├── assessment-tools/              # Assessment tool UI
│   │   ├── blog/                          # Blog components
│   │   ├── course-page/                   # Course page tabs & sections
│   │   ├── dashboard/                     # Student dashboard
│   │   ├── learning-path/                 # Learning path wizard
│   │   ├── membership/                    # Family membership UI
│   │   ├── quiz/                          # Quiz components
│   │   ├── ui/                            # shadcn/ui base components
│   │   └── [40+ more feature-specific dirs]
│   │
│   ├── pages/                              # Route/page components
│   │   ├── Index.tsx                      # Homepage
│   │   ├── Auth.tsx                       # Authentication
│   │   ├── AdminRefactored.tsx            # Admin panel
│   │   ├── AIAssessment.tsx               # AI assessment pages
│   │   ├── CoursePage.tsx                 # Course detail page
│   │   ├── DashboardRefactored.tsx        # Student dashboard
│   │   ├── AnalyticsPage.tsx              # Analytics dashboard
│   │   ├── Blog/                          # Blog pages
│   │   ├── CMS/                           # Content management system
│   │   ├── FamilyMembership*.tsx          # Family membership pages
│   │   └── [30+ more pages]
│   │
│   ├── services/                           # Business logic & API calls (22 subdirectories)
│   │   ├── AdaptiveAssessmentEngine.ts    # CAT algorithm
│   │   ├── analytics/                     # Analytics services
│   │   ├── assessment-tools/              # Assessment tool logic
│   │   ├── blog/                          # Blog CRUD operations
│   │   ├── calendar/                      # Event scheduling
│   │   ├── curriculum/                    # Curriculum generation
│   │   ├── exercise/                      # Exercise submission logic
│   │   ├── forum/                         # Discussion forum services
│   │   ├── gamification/                  # Points, badges, leaderboards
│   │   ├── learning-path/                 # Learning path generation
│   │   ├── membership/                    # Membership & vault content
│   │   ├── recommendations/               # ML-based recommendations
│   │   ├── reporting/                     # Certificate, competency matrix
│   │   ├── review/                        # Review request system
│   │   ├── social/                        # Study groups, challenges
│   │   ├── team/                          # Team management
│   │   ├── workshop/                      # Workshop management
│   │   └── [more services]
│   │
│   ├── hooks/                              # Custom React hooks (50+ files)
│   │   ├── useAuth.ts                     # Authentication
│   │   ├── useCourses.ts                  # Course data
│   │   ├── useEvents.ts                   # Event management
│   │   ├── useEnrollments.ts              # Course enrollment
│   │   ├── useAnalytics.ts                # Analytics data
│   │   ├── useAssessmentAttempts.ts       # Assessment attempts
│   │   └── [45+ more custom hooks]
│   │
│   ├── contexts/                           # React Context providers
│   │   ├── PersonalizationContext.tsx     # User preferences & profile
│   │   └── DateRangeContext.tsx           # Date range for analytics
│   │
│   ├── types/                              # TypeScript type definitions
│   │   ├── assessment.ts                  # Assessment types
│   │   ├── aiAssessment.ts                # AI assessment types
│   │   ├── blog.ts                        # Blog types
│   │   ├── api.ts                         # API response types
│   │   ├── gamification.ts                # Gamification types
│   │   └── [more type files]
│   │
│   ├── utils/                              # Utility functions
│   │   ├── export/                        # PDF/CSV export utilities
│   │   ├── error-handling/                # Error handling utilities
│   │   ├── forecasting/                   # ML forecasting algorithms
│   │   ├── iconLoader.ts                  # Icon loader utility
│   │   └── [more utilities]
│   │
│   ├── integrations/                       # Third-party integrations
│   │   └── supabase/                      # Supabase client & types
│   │       ├── client.ts                  # Supabase client instance
│   │       └── types.ts                   # Auto-generated DB types
│   │
│   ├── templates/                          # Component templates & patterns
│   │   └── accessibility/                 # Accessibility templates
│   │       ├── components/                # Accessible component examples
│   │       ├── patterns/                  # Accessibility patterns
│   │       └── docs/                      # WCAG documentation
│   │
│   ├── locales/                            # Translation files (i18n)
│   │   ├── en/                            # English translations
│   │   ├── es/                            # Spanish translations
│   │   ├── fr/                            # French translations
│   │   └── de/                            # German translations
│   │
│   ├── styles/                             # Global styles
│   │   └── index.css                      # Tailwind + custom CSS
│   │
│   ├── lib/                                # Shared library code
│   ├── __tests__/                          # Unit tests
│   ├── App.tsx                             # Main app component
│   └── main.tsx                            # Entry point
│
├── supabase/                                # Backend configuration
│   ├── functions/                          # Edge functions (40+ functions)
│   │   ├── ai-chat/                       # AI chatbot function
│   │   ├── ai-study-assistant/            # AI study assistant
│   │   ├── stripe-webhook/                # Payment processing
│   │   ├── send-email-notification/       # Email notifications
│   │   ├── send-review-notification/      # Review system emails
│   │   ├── transcribe-audio/              # Audio transcription
│   │   ├── process-vault-claim/           # Family membership vault
│   │   └── [30+ more functions]
│   │
│   ├── migrations/                         # Database migrations (137 files)
│   │   ├── 20240101_create_ai_assessment_tables.sql
│   │   ├── 20250118_create_lms_system.sql
│   │   └── [135 more migrations]
│   │
│   └── seed/                               # Database seeding scripts
│
├── tests/                                   # E2E test suite
│   └── e2e/                                # Playwright tests
│       ├── app-smoke.spec.ts
│       ├── chatbot-comprehensive.spec.ts
│       ├── sme-assessment.spec.ts
│       └── [7 more E2E tests]
│
├── public/                                  # Static assets
│   └── [logos, icons, fonts]
│
├── docs/                                    # Documentation
│   └── ACCESSIBILITY_LINTING.md            # Accessibility standards
│
├── .github/                                 # GitHub configuration
│   └── workflows/                          # CI/CD workflows
│       └── bundle-size.yml                 # Bundle size monitoring
│
├── .specify/                                # Spec Kit configuration
│   ├── memory/                             # Project constitution
│   ├── specs/                              # Feature specifications
│   ├── plans/                              # Implementation plans
│   └── templates/                          # Spec templates
│
├── vite.config.ts                          # Vite configuration
├── tsconfig.json                           # TypeScript configuration
├── tailwind.config.ts                      # Tailwind CSS configuration
├── playwright.config.ts                    # E2E test configuration
├── eslint.config.js                        # ESLint rules
├── postcss.config.js                       # PostCSS configuration
├── package.json                            # Dependencies & scripts
├── vercel.json                             # Vercel deployment config
└── README_aiborg                           # Project documentation

```

---

## 3. Core Features & Functionality

### A. Learning & Content Management

- **Courses** - Create, manage, enroll in courses with material organization
- **Course Pages** - Tabs for overview, materials, assignments, quizzes, exercises, workshops
- **Blog System** - Full blog with CMS, categories, tags, comments, interactions
- **Learning Paths** - AI-generated personalized learning paths with milestones
- **Video Content** - Enhanced video player with chapters, quizzes, notes, transcriptions
- **Materials** - Support for PDFs, documents, media files with viewer components
- **Assignments & Exercises** - Homework submission, grading, result tracking

### B. AI & Adaptive Assessment

- **AI Assessment System** - Computerized Adaptive Testing (CAT) algorithm
  - Dynamic difficulty adjustment based on performance
  - Binary search-like question selection
  - Optimal stopping criteria
  - Intelligent algorithm in `AdaptiveAssessmentEngine.ts`
- **Assessment Types:**
  - AIReadinessAssessment - AI preparedness evaluation
  - AIAwarenessAssessment - AI knowledge assessment
  - AIFluencyAssessment - Advanced AI skills evaluation
- **SME Assessment** - Subject Matter Expert evaluation reports
- **Adaptive Monitoring** - Real-time performance analytics

### C. AI Chatbot & Study Assistant

- **AI Chat** - Conversational AI powered by OpenAI/Ollama
- **Study Assistant** - AI-powered learning support
- **Analytics Caching** - Performance optimization for chat responses
- **Context Awareness** - References course content and user progress

### D. Gamification & Engagement

- **Points System** - Award points for activities
- **Badges & Achievements** - Unlock achievements with milestones
- **Leaderboards** - Global and team leaderboards
- **Streaks** - Track consecutive learning sessions
- **Rewards** - Virtual rewards for engagement

### E. Social Learning

- **Discussion Forums** - Categories, threads, posts, moderation
- **Study Groups** - Peer study groups with collaboration
- **Peer Connection** - Find study partners
- **Challenges** - Social learning challenges
- **Trust Levels** - User reputation system
- **Organization Support** - Multi-organization learning

### F. Assessment & Reporting

- **Assessment Tools** - Comprehensive assessment question bank
- **Assessment History** - Track all assessment attempts
- **Results Dashboard** - Performance visualization
- **Skill Gap Analysis** - Identify learning needs
- **Competency Matrix** - Track skill development
- **Certificates** - Generate completion certificates
- **Diagnostic Reports** - Personalized learning insights

### G. Analytics & Performance Monitoring

- **Student Analytics** - Individual progress tracking
- **Admin Analytics** - Organizational insights
- **Custom Views** - Saved dashboard configurations
- **Export Functionality** - PDF/CSV report generation
- **Forecasting** - ML-based progress prediction
- **Learning Velocity** - Track learning speed
- **Benchmark Comparisons** - Compare against cohorts
- **Adaptive Assessment Analytics** - CAT performance metrics
- **RUM (Real User Monitoring)** - Web performance tracking
- **Web Vitals** - Core Web Vitals (LCP, FID, CLS)

### H. Membership & Monetization

- **Family Membership** - Multi-person family accounts
- **Vault Content** - Premium exclusive content
- **Free Pass Claims** - Trial access system
- **Subscription Management** - Recurring billing via Stripe
- **Enrollment Tracking** - Track paid/free courses
- **Invoice Generation** - Automated invoice creation

### I. Instructor Features

- **Instructor Dashboard** - Course management portal
- **Classroom Management** - Live classroom tools
- **Student Progress Tracking** - Monitor cohort progress
- **Attendance Management** - Session attendance tracking
- **Question Queue** - Live Q&A management
- **Real-time Classroom** - WebSocket-based live updates
- **Email Notifications** - Automated instructor alerts

### J. Personalization

- **User Profiles** - Detailed user information and preferences
- **Learning Preferences** - Track learning style and pace
- **Bookmarks & Favorites** - Save important content
- **Watch Later** - Queue content for later viewing
- **Playlists** - Organize content into playlists
- **Recommendations** - ML-based content suggestions
- **Downloads** - Offline access to materials

### K. Events & Workshops

- **Event Management** - Create and manage learning events
- **Workshop Sessions** - Structured workshop content
- **Session Registration** - Track attendance
- **Session Reminders** - Automated reminder emails
- **Calendar Integration** - Schedule events
- **Jitsi Integration** - Video conferencing for sessions

### L. File Management & Content

- **File Upload** - Support for various file types
- **File Storage** - Supabase Storage integration
- **PDF Viewer** - Advanced PDF viewing with annotations
- **Document Processing** - Handle multiple content types
- **Media Transcription** - Audio/video to text conversion

### M. Admin & CMS

- **Admin Dashboard** - Comprehensive admin panel
- **Question Management** - Assessment question CRUD
- **Template Import** - Bulk content import
- **Course Creation Wizard** - Guided course setup
- **User Management** - Admin user controls
- **Audit Logs** - Track system changes
- **Approval Workflows** - Review and approve content

---

## 4. Configuration Files & Their Purposes

### Build & Development Configuration

- **`vite.config.ts`** - Vite build configuration with optimizations
  - Chunk splitting strategy for performance
  - Lazy loading for large libraries (PDF, Charts)
  - Tree-shaking configuration
  - Module pre-loading optimization
  - Development server settings (port 8080, IPv6 support)

- **`tsconfig.json`** - TypeScript compiler configuration
  - Path aliases: @/components, @/services, @/hooks, @/types, @/utils
  - ES module resolution
  - JSX runtime configuration

- **`tailwind.config.ts`** - Tailwind CSS configuration
  - Custom color scheme (gold, dark theme)
  - Component customizations
  - Plugin integrations (typography)

- **`postcss.config.js`** - PostCSS configuration
  - Autoprefixer for browser compatibility
  - Tailwind CSS processing

### Code Quality & Formatting

- **`eslint.config.js`** - ESLint rules
  - JSX/React-specific rules
  - Accessibility linting (jsx-a11y)
  - React hooks rules
  - TypeScript type checking

- **`.prettierrc`** - Code formatting preferences
  - Consistent code style across team

- **`commitlint.config.cjs`** - Conventional commit validation
  - Enforces consistent commit message format

- **`.lintstagedrc.json`** - Git hooks pre-commit linting

### Testing Configuration

- **`playwright.config.ts`** - E2E testing framework
  - Browser types: Chromium, Firefox, WebKit
  - Test timeout and retry settings
  - Artifact storage for failed tests

- **`vitest.config.ts`** - Unit testing configuration
  - Vitest framework setup
  - Coverage reporting

### Deployment Configuration

- **`vercel.json`** - Vercel deployment settings
  - URL rewrites for SPA routing
  - Security headers (CSP, HSTS, X-Frame-Options)
  - Cache control policies
  - Content-Security-Policy configuration

- **`package.json`** - Project metadata and dependencies
  - npm scripts for dev, build, lint, test
  - 116 production dependencies
  - 41 dev dependencies
  - Bundle analysis and monitoring scripts

### Environment Configuration

- **`.env.example`** - Environment variable template
  - VITE_APP_URL - Application URL
  - VITE_SUPABASE_URL - Supabase project URL
  - VITE_SUPABASE_ANON_KEY - Supabase public key
  - VITE_USE_ADAPTIVE_ASSESSMENT - Feature flag for CAT
  - VITE_OLLAMA_HOST - Local LLM configuration
  - VITE_LOG_LEVEL - Logging verbosity
  - VITE_ENABLE_LOGS - Logging enable/disable

- **`.env.local`** - Local development environment variables
- **`.env.production`** - Production environment variables
- **`.env.vercel`** - Vercel-specific environment variables

### GitHub & CI/CD

- **`.github/workflows/bundle-size.yml`** - Automated bundle size monitoring
  - Tracks build size over time
  - Alerts on size increases
  - Reports to GitHub Actions

### Type Definitions

- **`tsconfig.app.json`** - App-specific TypeScript settings
- **`tsconfig.node.json`** - Node/build tool TypeScript settings

### Spec-Driven Development

- **`.specify/memory/constitution.md`** - Project governance principles
- **`.claude/CLAUDE.md`** - Claude Code integration guide

---

## 5. Key Components & Modules

### Component Categories

#### Admin Components (src/components/admin/)

- **AdminDashboard** - Main admin interface
- **AdminCourseManager** - Course CRUD operations
- **AdminUserManager** - User management
- **AdminAnalyticsPanel** - Admin-specific analytics
- **QuestionBankManager** - Assessment question management
- **BulkEnrollmentManager** - Batch user enrollment
- **TemplateImporter** - Content import functionality
- **AuditLogViewer** - System audit trails

#### AI Assessment Components (src/components/ai-assessment/)

- **AIAssessmentWizard** - Standard assessment flow
- **AIAssessmentWizardAdaptive** - CAT-based assessment flow
- **AssessmentProgressIndicator** - Real-time progress display
- **LiveStatsPanel** - Live assessment statistics
- **EarlyCompletionIncentive** - Bonus for early completion
- **ProfilingQuestionnaire** - User profiling questions
- **CaseStudy** - Scenario-based assessment

#### Analytics Components (src/components/analytics/)

- **SkillGapAnalysis** - Identify skill deficiencies
- **PerformanceChart** - Performance visualization
- **EngagementMetrics** - User engagement analytics
- **LearningVelocityChart** - Learning speed visualization
- **CompetencyMatrix** - Skill mastery matrix

#### Blog Components (src/components/blog/)

- **BlogPostCard** - Blog post preview card
- **BlogListView** - Blog post listing
- **CommentSection** - Blog comments
- **RelatedPosts** - Related content suggestions
- **BlogSearchBar** - Blog post search

#### Assessment Components (src/components/assessment-tools/)

- **QuestionBank** - Question management interface
- **AssessmentResultsViewer** - View assessment outcomes
- **AssessmentHistoryPanel** - Historical attempts
- **DetailedReportViewer** - Comprehensive result analysis

#### Course Page Components (src/components/course-page/)

- **CourseHeader** - Course title and metadata
- **CourseOverviewTab** - Course description and details
- **CourseMaterialsTab** - Learning materials section
- **CourseAssignmentsTab** - Assignments list
- **CourseQuizzesTab** - Quiz list
- **CourseExercisesTab** - Exercises list
- **CourseWorkshopsTab** - Workshops section
- **MaterialViewerDialog** - Material preview modal

#### Dashboard Components (src/components/dashboard/)

- **CourseProgress** - Progress visualization
- **AssignmentsSection** - Pending assignments widget
- **AIInsightsWidget** - AI-generated insights
- **StudyRecommendations** - Content recommendations
- **RecentActivity** - Activity feed

#### Learning Path Components (src/components/learning-path/)

- **LearningPathWizard** - Path generation wizard
- **GoalSettingStep** - Goal definition step
- **FocusAreasStep** - Area selection step
- **ReviewGenerateStep** - Path review and generation

#### Membership Components (src/components/membership/)

- **MembershipCard** - Membership display
- **FamilyMembersList** - Family member management
- **VaultContentViewer** - Premium content access
- **SubscriptionManager** - Subscription UI

#### UI Components (src/components/ui/)

- **Button** - Base button component
- **Card** - Content card container
- **Dialog** - Modal dialog
- **Select** - Dropdown selection
- **Tabs** - Tabbed interface
- **Tooltip** - Hover tooltips
- **Form** - Form wrapper
- **Input** - Input field
- **Badge** - Status badges
- **[20+ more shadcn/ui components]**

#### Video Components (src/components/video/)

- **EnhancedVideoPlayer** - Custom video player
- **VideoChapters** - Video chapter navigation
- **VideoNotes** - Note-taking during video
- **VideoQuiz** - Quiz integrated with video
- **VideoSidebar** - Video controls and metadata

### Key Services (Business Logic)

#### Adaptive Assessment Engine (src/services/AdaptiveAssessmentEngine.ts)

- **Implements Computerized Adaptive Testing (CAT)**
- Binary search algorithm for optimal question selection
- Dynamic difficulty adjustment
- Performance-based path generation
- Optimal stopping criteria

#### Blog Services (src/services/blog/)

- **BlogPostService** - CRUD operations for blog posts
- **BlogCategoryService** - Category management
- **BlogTagService** - Tag management
- **BlogCommentService** - Comment handling
- **BlogInteractionService** - Likes, shares, views
- **BlogStatsService** - Analytics for blog content

#### Learning Path Services (src/services/learning-path/)

- **LearningPathGenerator** - AI path generation algorithm
- **ContentSelectionService** - Intelligent content selection
- **ContentSequencingService** - Optimal content ordering
- **GapAnalysisService** - Identify knowledge gaps
- **ResourceFetchService** - Fetch course/content resources
- **MilestoneService** - Track learning milestones

#### Analytics Services (src/services/analytics/)

- **AdminAnalyticsService** - Organization-level analytics
- **BenchmarkService** - Comparative analytics
- **CompetencyService** - Skill tracking
- **ExportService** - PDF/CSV export
- **ForecastingService** - ML-based predictions
- **SkillGapService** - Gap analysis

#### Recommendation Services (src/services/recommendations/)

- **LearningPathRecommendationEngine** - Path recommendations
- **CourseRecommendationService** - Course suggestions
- **JobMatchingService** - Job-relevant recommendations
- **ProgressForecastService** - Predict time to completion

#### Assessment Services (src/services/assessment-tools/)

- **AssessmentToolService** - Tool management
- **Question management and retrieval**
- **Result tracking and analysis**

#### Forum Services (src/services/forum/)

- **ForumThreadService** - Thread management
- **ForumPostService** - Post CRUD
- **ForumCategoryService** - Category management
- **ForumModerationService** - Content moderation
- **ForumTrustLevelService** - User reputation
- **ForumVoteService** - Voting/ranking

#### Gamification Services (src/services/gamification/)

- **PointsService** - Point allocation and tracking
- **AchievementService** - Badge unlocking
- **LeaderboardService** - Ranking system

#### Social Services (src/services/social/)

- **StudyGroupService** - Group management
- **ChallengeService** - Learning challenges
- **PeerConnectionService** - Find study partners
- **LeaderboardService** - Social leaderboards
- **PrivacyService** - Privacy controls

#### Reporting Services (src/services/reporting/)

- **CertificateService** - Generate certificates
- **CompetencyMatrixService** - Skill matrix reporting
- **DiagnosticReportService** - Assessment insights
- **APIKeyService** - API access management

#### Team Services (src/services/team/)

- **TeamManagementService** - Team CRUD
- **TeamAnalyticsService** - Team performance metrics
- **CourseAssignmentService** - Bulk course assignment

#### Membership Services (src/services/membership/)

- **MembershipService** - Subscription management
- **FamilyMembersService** - Family account management
- **VaultContentService** - Premium content access

---

## 6. Notable Patterns & Architectural Decisions

### A. Component Architecture

1. **Atomic Design Pattern**
   - Base UI components in `src/components/ui/`
   - Feature-specific components in named directories
   - Page components in `src/pages/`
   - Clear separation of concerns

2. **Lazy Loading for Code Splitting**
   - Heavy libraries (PDF, Charts) loaded on demand
   - Reduces initial bundle size
   - Improves page load performance

3. **Custom Hooks Pattern**
   - 50+ custom hooks for business logic
   - Reusable across components
   - Clear data fetching abstractions

### B. State Management Strategy

1. **Hybrid Approach:**
   - React Context for UI-level state (PersonalizationContext)
   - TanStack Query for server state
   - React Hook Form for form state
   - Local component state for UI toggles

2. **Real-time Subscriptions**
   - Supabase PostgreSQL real-time capabilities
   - WebSocket-based updates for collaborative features
   - Instructor dashboards with live class updates

### C. Type Safety

- **Full TypeScript Coverage** (863 files, ~19,425 LOC)
- **Zod Validation** for runtime type checking
- **Auto-generated Database Types** from Supabase schema
- **Type Aliases** for complex types in `src/types/`

### D. Error Handling

- **Error Boundary Component** for React errors
- **Try-catch wrapping** in async operations
- **User-friendly error messages** via toast notifications
- **Error logging** for debugging
- **Graceful degradation** for API failures

### E. Performance Optimizations

1. **Build Optimization:**
   - Vite for fast builds and HMR
   - Tree-shaking to remove unused code
   - Minification with Terser
   - Asset optimization (images, fonts)

2. **Runtime Optimization:**
   - Lazy component loading with React.lazy()
   - Code splitting by route
   - TanStack Query caching
   - Memoization with React.memo()

3. **Bundle Analysis:**
   - Bundle size tracking script
   - Chunk size warnings
   - Visual bundle analyzer

### F. Security Measures

1. **Row-Level Security (RLS)**
   - PostgreSQL RLS policies on all tables
   - User data isolation
   - Role-based access control

2. **Content Security:**
   - XSS protection via DOMPurify
   - CORS configuration
   - Secure headers (CSP, HSTS, etc.)

3. **Authentication:**
   - Supabase Auth integration
   - JWT tokens
   - Session management
   - Password hashing

### G. Accessibility (WCAG 2.1)

- **Semantic HTML** usage
- **ARIA attributes** for screen readers
- **Keyboard navigation** support
- **Color contrast** compliance
- **Alt text** for images
- **Form labels** properly associated
- **ESLint accessibility plugin** (jsx-a11y)
- **Accessibility templates** in `src/templates/accessibility/`

### H. Database Architecture

1. **Normalized Schema**
   - Separate tables for each entity
   - Foreign key relationships
   - Proper indexing

2. **Row-Level Security (RLS)**
   - User-based access control
   - Organization-based segregation
   - Team-based permissions

3. **Vector Support**
   - pgvector extension for embeddings
   - Semantic search capabilities
   - RAG (Retrieval-Augmented Generation) support

### I. Testing Strategy

1. **Unit Testing** - Vitest for component and function testing
2. **E2E Testing** - Playwright for user workflows
3. **Test Utilities** - React Testing Library for component testing
4. **Coverage Tracking** - Vitest coverage reports

### J. Deployment Strategy

1. **Staging Environment** - Test before production
2. **Vercel Deployment** - Automatic deployments from Git
3. **Edge Functions** - Supabase serverless backend
4. **Database Migrations** - Version-controlled schema changes
5. **Environment Variables** - Secure configuration management

---

## 7. Database & API Structure

### Database (PostgreSQL with Supabase)

#### Core Tables

- **auth.users** - User authentication (Supabase managed)
- **public.profiles** - Extended user information
- **public.courses** - Course definitions
- **public.course_enrollments** - User enrollment records
- **public.course_materials** - Learning materials
- **public.assessments** - Assessment definitions
- **public.assessment_questions** - Question bank
- **public.assessment_attempts** - Student assessment records
- **public.assessment_results** - Performance results
- **public.blog_posts** - Blog articles
- **public.blog_comments** - Blog comments
- **public.learning_paths** - Generated learning paths
- **public.events** - Learning events/sessions
- **public.forums** - Discussion forums
- **public.forum_threads** - Forum discussion threads
- **public.forum_posts** - Individual forum posts
- **public.achievements** - Gamification badges
- **public.leaderboards** - Ranking data
- **public.certifications** - User certificates
- **public.subscriptions** - Stripe subscriptions
- **[100+ more tables from 137 migrations]**

#### Database Features

- **Row-Level Security (RLS)** - Fine-grained access control
- **Full-Text Search** - Built-in text search
- **Vector Support** - pgvector for embeddings
- **Real-Time Subscriptions** - PostgreSQL triggers
- **Auditing** - Change tracking for compliance
- **Soft Deletes** - Archive data without deletion

### Edge Functions API

**AI & Content Generation:**

- `POST /ai-chat` - AI chatbot responses
- `POST /ai-study-assistant` - Study guidance
- `POST /ai-chat-with-analytics` - Analytics-enhanced chat
- `POST /ai-chat-with-analytics-cached` - Cached responses

**Payment Processing:**

- `POST /stripe-webhook` - Payment events
- `POST /stripe-webhook-subscription` - Subscription webhooks
- `POST /create-subscription` - Create subscription

**Content Management:**

- `POST /validate-template` - Template validation
- `POST /import-history` - Bulk data import

**Notifications:**

- `POST /send-email-notification` - Email delivery
- `POST /send-confirmation-email` - Confirmation emails
- `POST /send-review-notification` - Review alerts
- `POST /send-review-request` - Review requests
- `POST /send-batch-email` - Bulk email
- `POST /send-contact-notification` - Contact form emails
- `POST /send-team-invitation` - Team invites
- `POST /send-session-reminder` - Event reminders
- `POST /send-post-session-email` - Post-event follow-up

**Media Processing:**

- `POST /transcribe-audio` - Audio-to-text
- `POST /transcribe-video` - Video-to-text

**Event Management:**

- `POST /register-for-session` - Session registration
- `POST /create-session-meeting` - Jitsi integration
- `POST /track-attendance` - Attendance tracking
- `POST /send-assignment-reminder` - Assignment reminders

**Membership & Claims:**

- `POST /submit-vault-claim` - Claim premium content
- `POST /process-vault-claim` - Process claims

**Reporting:**

- `POST /approve-review` - Approve user submissions

---

## 8. Testing Setup

### Unit Testing

- **Framework:** Vitest 3.2.4
- **Location:** `src/**/__tests__/` and `src/tests/`
- **Test Utilities:** React Testing Library, Happy DOM/jsdom
- **Coverage:** Via `@vitest/coverage-v8`
- **Command:** `npm run test`

### E2E Testing

- **Framework:** Playwright 1.56.1
- **Location:** `tests/e2e/`
- **Test Files:**
  - `app-smoke.spec.ts` - Basic app functionality
  - `chatbot-comprehensive.spec.ts` - AI chatbot testing
  - `sme-assessment.spec.ts` - Assessment workflow
  - `events.spec.ts` - Event management
  - `downloads.spec.ts` - File download functionality
  - `bookmarks.spec.ts` - Bookmark system
  - `pdf-viewer.spec.ts` - PDF viewing
- **Browsers:** Chromium, Firefox, WebKit
- **Commands:**
  - `npm run test:e2e` - Run all tests
  - `npm run test:e2e:headed` - Watch mode
  - `npm run test:e2e:debug` - Debug mode
  - `npm run test:e2e:ui` - Interactive UI

### Test Coverage

- **Current Level:** ~20% (baseline)
- **Target:** ~60% for critical paths
- **Coverage Report:** `npm run test:coverage`

---

## 9. Deployment Configuration

### Hosting

- **Frontend:** Vercel
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Storage:** Supabase Storage (S3-compatible)
- **DNS/CDN:** Vercel global edge network

### Deployment Pipeline

```
Local Dev → Git Push → GitHub → Vercel Auto-Deploy → Production
```

### Vercel Configuration (vercel.json)

- **URL Rewrites:** SPA routing to index.html
- **Security Headers:**
  - X-Frame-Options: DENY (clickjacking prevention)
  - X-Content-Type-Options: nosniff
  - X-XSS-Protection: 1; mode=block
  - Strict-Transport-Security: HSTS enabled
  - Content-Security-Policy: Restricted inline scripts
- **Cache Control:**
  - Assets (immutable): 1 year
  - Dynamic content: No cache
- **CORS Configuration:** Configured for Supabase and Google OAuth

### Environment Variables (Production)

```
VITE_APP_URL=https://[app-name].vercel.app
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[public-key]
```

### Database Migrations

- **Total Migrations:** 137 SQL files
- **Version Control:** Git-tracked in `supabase/migrations/`
- **Auto-Sync:** Vercel deployments auto-run migrations
- **Rollback Support:** Manual migration if needed

### Monitoring & Analytics

- **Bundle Size Tracking:** GitHub Actions workflow
- **Performance Monitoring:**
  - Web Vitals (Core Web Vitals tracking)
  - RUM (Real User Monitoring)
  - Custom metrics via `PerformanceMonitoringService`
- **Error Tracking:** Console error logging
- **Analytics:** Custom analytics service

### Backup & Recovery

- **Database Backups:** Supabase automated daily backups
- **Point-in-Time Recovery:** Up to 7 days
- **Storage Backups:** S3-backed Supabase Storage

---

## 10. Key Metrics & Statistics

### Codebase Size

- **Total TypeScript/TSX Files:** 863
- **Total Lines of Code:** ~19,425 (frontend only)
- **Total Components:** 54+ component directories
- **Total Services:** 22 service modules
- **Total Custom Hooks:** 50+
- **Total Pages:** 30+ page components

### Database

- **Total Migrations:** 137
- **Tables:** 100+ (estimated)
- **Stored Procedures:** Multiple for complex operations
- **RLS Policies:** Comprehensive security rules
- **Indexes:** Optimized for common queries

### API

- **Edge Functions:** 40+
- **Serverless:** Deno-based execution
- **Auto-scaling:** Built-in with Supabase
- **Type Safety:** Auto-generated TypeScript types

### Dependencies

- **Production Dependencies:** 116
- **Dev Dependencies:** 41
- **Total:** 157 npm packages

### Performance

- **Bundle Size:** Monitored and tracked
- **Chunk Strategy:** 10+ optimized chunks
- **Lazy Loading:** 8+ lazy-loaded features
- **Cache Control:** Multi-level caching strategy

### Testing

- **Unit Tests:** Vitest framework
- **E2E Tests:** 10+ Playwright test files
- **Coverage Goal:** 60% critical paths
- **CI/CD:** GitHub Actions automation

---

## 11. Important Notes & Considerations

### Authentication

- Uses Supabase Auth with JWT tokens
- Supports email/password, OAuth (Google), social login
- Session management via Supabase client
- Automatic token refresh

### Multi-tenancy

- Organization-level data segregation
- Team-based permissions
- Family membership support
- Course access control

### Scalability

- Serverless Edge Functions auto-scale
- PostgreSQL connection pooling
- Vercel global CDN
- Horizontal scaling ready

### Compliance

- GDPR-ready with data deletion
- WCAG 2.1 accessibility compliance
- Row-Level Security for data privacy
- Audit logging for compliance

### Development Workflow

- **Code Quality:** ESLint + Prettier enforced
- **Git Hooks:** Husky pre-commit hooks
- **Semantic Commits:** Commitlint validation
- **Type Safety:** Strict TypeScript configuration
- **Testing:** Pre-commit test running via lint-staged

### Known Limitations

- Current accessibility: 6 errors, 349 warnings (being addressed)
- Current test coverage: 20% (target 60%)
- Some technical debt documented in TECHNICAL_DEBT.md

---

## Summary

**AiBorg Learn Sphere** is a sophisticated, production-ready LMS platform combining modern
React/TypeScript frontend with Supabase backend. It features AI-powered adaptive assessments,
comprehensive analytics, social learning, gamification, and a flexible membership system. The
codebase demonstrates strong architectural patterns, type safety, accessibility focus, and
performance optimization, making it scalable for enterprise education deployments.
