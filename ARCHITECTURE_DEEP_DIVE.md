# AiBorg Learn Sphere - Architecture Deep Dive

## Adaptive Assessment System (CAT - Computerized Adaptive Testing)

The platform implements a sophisticated **Item Response Theory (IRT)-based adaptive testing engine**
that dynamically adjusts question difficulty based on student performance:

### Key Algorithm Features:

- **Binary Search Question Selection**: Optimal question difficulty based on student ability
  estimate
- **Dynamic Difficulty Levels**: Four tiers (foundational, applied, advanced, strategic)
- **IRT Parameters**: Each question has calibrated difficulty scores
- **Optimal Stopping Criteria**: Assessment terminates when confidence threshold is reached
- **Performance Estimation**: Real-time ability calculation based on responses

### Implementation Details (src/services/AdaptiveAssessmentEngine.ts):

```typescript
// Question interface supporting 9 question types:
type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'scale'
  | 'frequency'
  | 'scenario_multimedia'
  | 'drag_drop_ranking'
  | 'drag_drop_ordering'
  | 'code_evaluation'
  | 'case_study';

// Dynamic properties for adaptation:
interface AdaptiveQuestion {
  irt_difficulty: number; // IRT calibration
  difficulty_level: string; // Categorical difficulty
  media_type?: string; // Rich media support
  scenario_context?: string; // Context for complex questions
  code_snippet?: string; // For coding assessments
  case_study_data?: unknown; // For case studies
}
```

---

## State Management Architecture

### Hybrid Approach - Best of All Worlds

**1. React Context (PersonalizationContext)**

- **Purpose**: Audience-specific content personalization (primary, secondary, professional,
  business)
- **Features**:
  - URL hash-based audience detection
  - localStorage persistence
  - Generic content selection: `getPersonalizedContent<T>(content)`
  - Style personalization: `getPersonalizedStyles(styles)`
- **Use Case**: Rendering different content for different user segments without re-fetching

**2. TanStack React Query (React Query)**

- **Purpose**: Server state management and caching
- **Benefits**:
  - Automatic cache invalidation
  - Background refetching
  - Optimistic updates
  - Request deduplication
  - Pagination support
- **Used For**: API calls, course data, user progress, analytics

**3. React Hook Form**

- **Purpose**: Form state management
- **Features**:
  - Zero dependencies
  - Performance optimized (field-level subscriptions)
  - Zod integration for validation
  - Error handling
- **Used For**: All user input forms (enrollment, assessments, etc.)

**4. Local Component State**

- **Purpose**: UI toggle states, modal visibility, filters
- **Pattern**: `const [isOpen, setIsOpen] = useState(false)`

---

## Database Architecture & Type Safety

### Type Generation Pipeline

```
Supabase Database Schema
           ↓
[Auto-generated types via Supabase CLI]
           ↓
src/integrations/supabase/types.ts (1 massive file)
           ↓
Imported in services and hooks
           ↓
Full TypeScript type safety at runtime
```

### Row-Level Security (RLS) Strategy

Every table implements Supabase RLS policies:

- **User-based**: Only access own data
- **Organization-based**: Team/organization isolation
- **Role-based**: Admin, instructor, student roles
- **Soft Deletes**: Archived records not returned by default

### Database Feature Highlights

- **100+ Tables** organized by feature domain
- **Vector Support** (pgvector) for RAG implementation
- **Real-Time Subscriptions** via PostgreSQL triggers
- **Full-Text Search** for blog and content discovery
- **Audit Logging** for compliance tracking

---

## Component Architecture Patterns

### Atomic Design + Feature-Driven

**Hierarchy:**

```
Base Components (shadcn/ui)
      ↓
Feature Components (domain-specific)
      ↓
Page Components (route handlers)
```

**Example Structure:**

```
src/components/
├── ui/                    # shadcn base components
│   ├── Button.tsx
│   ├── Card.tsx
│   └── Dialog.tsx
│
├── dashboard/            # Feature: Student Dashboard
│   ├── CourseProgress.tsx
│   ├── AssignmentsSection.tsx
│   ├── AIInsightsWidget.tsx
│   └── StudyRecommendations.tsx
│
├── ai-assessment/        # Feature: Adaptive Testing
│   ├── AIAssessmentWizard.tsx
│   ├── AIAssessmentWizardAdaptive.tsx
│   ├── LiveStatsPanel.tsx
│   └── AssessmentProgressIndicator.tsx
│
└── pages/               # Routes
    ├── DashboardRefactored.tsx
    ├── AIAssessment.tsx
    └── CoursePage.tsx
```

### Lazy Loading Strategy

Heavy libraries are **lazy-loaded** to reduce initial bundle:

```typescript
// In vite.config.ts
manualChunks: id => {
  // PDF & Document handling - lazy loaded
  if (id.includes('pdfjs-dist') || id.includes('jspdf')) {
    return 'pdf-libs';
  }

  // Charts - lazy loaded
  if (id.includes('recharts') || id.includes('d3-')) {
    return 'charts-libs';
  }

  // Everything else in vendor bundle
  return 'vendor';
};

// In components
const LazyPDFViewer = lazy(() => import('@/components/pdf/LazyPDFViewer'));
const AnalyticsChart = lazy(() => import('@/components/analytics/Chart'));
```

---

## Performance Optimization Techniques

### 1. Bundle Size Management

- **Vite-powered builds** with tree-shaking
- **Code splitting by route** using React.lazy()
- **Chunk size warnings** at 400KB limit
- **Bundle visualization** tools for analysis
- **Terser minification** with aggressive compression

### 2. Runtime Performance

- **React.memo()** for expensive components
- **Memoization** with useMemo/useCallback
- **TanStack Query caching** with stale-while-revalidate
- **Virtual scrolling** for large lists
- **Image optimization** (WebP, lazy loading)

### 3. Network Performance

- **Module preload optimization** to avoid waterfalls
- **Async/await patterns** for non-blocking operations
- **Debouncing/throttling** for frequent operations
- **Request batching** where possible

### 4. Monitoring

```typescript
// Performance metrics tracked
Web Vitals:
- Largest Contentful Paint (LCP) < 2.5s
- First Input Delay (FID) < 100ms
- Cumulative Layout Shift (CLS) < 0.1

Custom Metrics:
- Assessment question load time
- API response times
- Component render performance
- Memory usage
```

---

## API & Edge Functions Architecture

### Supabase Edge Functions

**40+ serverless Deno functions** for backend operations:

**Categories:**

1. **AI & NLP** (3 functions)
   - `ai-chat` - Conversational AI
   - `ai-study-assistant` - Learning support
   - `ai-chat-with-analytics-cached` - Performance-optimized

2. **Email & Notifications** (9 functions)
   - `send-email-notification` - Generic emails
   - `send-review-notification` - Review alerts
   - `send-batch-email` - Bulk campaigns
   - `send-team-invitation` - Team invites
   - [5 more email functions]

3. **Payment Processing** (3 functions)
   - `stripe-webhook` - Payment events
   - `stripe-webhook-subscription` - Subscription webhooks
   - `create-subscription` - New subscriptions

4. **Media & Content** (4 functions)
   - `transcribe-audio` - Speech-to-text
   - `transcribe-video` - Video transcription
   - `validate-template` - Template validation
   - `import-history` - Bulk imports

5. **Event & Session Management** (5 functions)
   - `register-for-session` - Registration
   - `create-session-meeting` - Jitsi integration
   - `track-attendance` - Attendance logging
   - `send-session-reminder` - Event reminders
   - `send-post-session-email` - Follow-ups

6. **Membership & Access** (2 functions)
   - `submit-vault-claim` - Claim premium content
   - `process-vault-claim` - Process claims

### Key Characteristics

- **Auto-scaling**: Built-in request-based scaling
- **Type-safe**: TypeScript support
- **Fast execution**: Deno runtime optimization
- **Database integration**: Direct PostgreSQL access
- **Secret management**: Secure env variables
- **Error handling**: Comprehensive logging

---

## Security Implementation

### Frontend Security

```typescript
// Vercel deployment security headers
Headers: {
  'X-Frame-Options': 'DENY',                    // Clickjacking prevention
  'X-Content-Type-Options': 'nosniff',          // MIME type sniffing
  'X-XSS-Protection': '1; mode=block',          // XSS protection
  'Strict-Transport-Security': 'HSTS',          // Force HTTPS
  'Content-Security-Policy': 'strict',          // Script execution control
  'Referrer-Policy': 'strict-origin',           // Privacy
  'Permissions-Policy': 'camera=(), mic=()'    // Feature permissions
}
```

### Backend Security

1. **Row-Level Security (RLS)**
   - Every table has policies
   - User-based isolation
   - Role-based access control

2. **Authentication**
   - Supabase Auth with JWT
   - Session management
   - Automatic token refresh

3. **Data Protection**
   - DOMPurify XSS prevention
   - Zod input validation
   - SQL parameter escaping

4. **API Security**
   - CORS configuration
   - Rate limiting ready
   - Request validation

---

## Accessibility (WCAG 2.1) Implementation

### Template-Based Approach

```
src/templates/accessibility/
├── components/
│   ├── AccessibleButton.template.tsx
│   ├── AccessibleForm.template.tsx
│   └── AccessibleDialog.template.tsx
├── patterns/
│   ├── Accordion.pattern.tsx
│   └── Tooltip.pattern.tsx
└── docs/
    └── WCAG guidelines
```

### Key Compliance Areas

1. **Semantic HTML** - Proper tag usage
2. **ARIA Attributes** - Screen reader support
3. **Keyboard Navigation** - Tab order and focus management
4. **Color Contrast** - WCAG AA compliance (4.5:1 ratio)
5. **Text Alternatives** - Alt text for images
6. **Form Accessibility** - Labels, error messages, hints
7. **Focus Management** - Visible focus indicators
8. **Motion Safety** - prefers-reduced-motion support

### ESLint Enforcement

```javascript
// eslint.config.js includes:
('jsx-a11y/alt-text', // Images need alt text
  'jsx-a11y/no-static-element-interactions', // Interactive elements
  'jsx-a11y/click-events-have-key-events', // Keyboard support
  'jsx-a11y/role-has-required-aria-props'); // ARIA completeness
```

---

## Testing Architecture

### Unit Testing (Vitest)

```typescript
// Pattern
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Component } from './Component';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByText('text')).toBeInTheDocument();
  });
});

// Run: npm run test
// Coverage: npm run test:coverage
```

### E2E Testing (Playwright)

```typescript
// Pattern
import { test, expect } from '@playwright/test';

test('user can complete assessment', async ({ page }) => {
  await page.goto('/assessment');
  await page.fill('[name="answer"]', 'response');
  await page.click('[type="submit"]');
  await expect(page).toHaveURL('/results');
});

// Run: npm run test:e2e
// Debug: npm run test:e2e:debug
```

---

## Deployment Pipeline

### Local → Production Flow

```
1. Local Development
   └─ npm run dev (Vite HMR)

2. Code Quality Check
   └─ npm run check:all (lint + typecheck + format)

3. Build for Production
   └─ npm run build:production
       └─ npm run monitor:bundle

4. Git Commit
   └─ Git hooks (Husky)
       └─ Pre-commit linting (lint-staged)
       └─ Commitlint validation

5. Push to GitHub
   └─ git push origin main

6. GitHub Actions
   └─ Bundle size tracking (workflow)

7. Vercel Auto-Deploy
   └─ Build and deploy to production
       └─ Auto-run database migrations

8. Production Live
   └─ Global CDN distribution
```

### Environment Configuration

```
Local:       .env.local
Development: .env.development
Staging:     (via Vercel preview)
Production:  .env.production + Vercel env vars
```

---

## Internationalization (i18n) Strategy

### Multi-Language Support

```
src/locales/
├── en/
│   ├── common.json
│   ├── dashboard.json
│   ├── assessment.json
│   └── courses.json
├── es/
├── fr/
└── de/
```

### Implementation Pattern

```typescript
import { useTranslation } from 'react-i18next';

export const Component = () => {
  const { t, i18n } = useTranslation('dashboard');

  return (
    <>
      <h1>{t('title')}</h1>
      <button onClick={() => i18n.changeLanguage('es')}>
        Spanish
      </button>
    </>
  );
};
```

### Features

- **Auto-detection**: Detects browser language
- **Persistent**: Saves language preference
- **Lazy loading**: Load only used namespaces
- **4 Languages**: en, es, fr, de (extensible)

---

## Notable Architectural Decisions

### 1. Why Supabase (not Firebase)?

- **PostgreSQL** instead of NoSQL - better for complex queries
- **RLS** instead of Firestore security rules - finer granularity
- **Edge Functions** - serverless with database access
- **Open source** - self-hosting option
- **Vector support** - pgvector for AI features

### 2. Why Vite (not Create React App)?

- **5-10x faster** builds
- **Fast HMR** - instant feedback
- **Native ESM** - better tree-shaking
- **Modern tooling** - less abstraction
- **Smaller base** - lighter final bundle

### 3. Why Shadcn/ui (not Material-UI)?

- **Headless** - full control over styling
- **Accessible** - Radix UI foundation
- **Copy-paste** - components are yours to modify
- **Lightweight** - no bloated theme system
- **TypeScript-first** - better DX

### 4. Why TypeScript (strict mode)?

- **Catch bugs at compile time** - not runtime
- **Better IDE support** - autocomplete and refactoring
- **Self-documenting code** - types are documentation
- **Team safety** - prevent accidental modifications
- **Refactoring confidence** - know what breaks

### 5. Why Zod (not Joi/Yup)?

- **TypeScript-first** - infer types from schemas
- **Minimal** - smaller bundle
- **Chainable API** - readable validation
- **Runtime safe** - full schema validation
- **Better errors** - detailed error messages

---

## Summary: Architecture Strengths

1. **Scalability**: Serverless backend with auto-scaling
2. **Type Safety**: Full TypeScript + auto-generated types
3. **Performance**: Optimized bundles with code splitting
4. **Security**: RLS + CSP + HTTPS enforcement
5. **Accessibility**: WCAG 2.1 compliance built-in
6. **Testing**: Unit + E2E test coverage
7. **Monitoring**: Bundle size + performance tracking
8. **Internationalization**: 4-language support
9. **Maintainability**: Clear folder structure + patterns
10. **User Experience**: Real-time updates + smooth interactions

---

## Future Architecture Considerations

1. **Vector Database (pgvector)**: For semantic search and RAG
2. **Caching Layer**: Redis for frequently accessed data
3. **Message Queue**: For async processing (email, analytics)
4. **Microservices**: Extract complex domains if scaling
5. **GraphQL**: Alternative to REST API patterns
6. **PWA**: Offline-first capabilities
7. **WebSocket**: Real-time collaboration features
