<!--
Sync Impact Report:
- Version change: [INITIAL] → 1.0.0
- New constitution created from application analysis
- Principles established based on existing architecture
- Templates require review for alignment with principles
- Follow-up: Review all template files for consistency
-->

# AIBORG Learn Sphere Constitution

## Core Principles

### I. User-Centric Learning Platform
**Description**: Every feature must enhance the learning experience and support educational outcomes.

**Rules**:
- All features must serve learners, instructors, or administrators directly
- User interfaces must be intuitive, accessible, and responsive
- Content delivery must be optimized for various learning styles (video, text, interactive)
- Student progress tracking and assessment must be transparent and actionable

**Rationale**: The platform exists to facilitate effective learning. Features that don't directly support this mission create unnecessary complexity.

### II. Data Integrity & Security (NON-NEGOTIABLE)
**Description**: User data, educational content, and assessment results must be protected and accurate.

**Rules**:
- All authentication must use Supabase Auth with proper session management
- Sensitive operations require authentication verification
- File uploads must be validated and sanitized
- Payment processing must be secure and comply with standards
- Student assessment data must be immutable once submitted
- Database operations must use Row Level Security (RLS) policies

**Rationale**: Educational platforms handle sensitive student data, payment information, and academic records. Security breaches or data corruption could have serious consequences for users.

### III. Component Modularity
**Description**: UI components must be reusable, composable, and maintainable.

**Rules**:
- Use shadcn/ui as the base component library
- Components must be self-contained with clear interfaces
- Shared logic must be extracted into custom hooks (in `src/hooks/`)
- Component dependencies must be explicitly declared
- Large components must be split into logical subcomponents

**Rationale**: Modular components reduce duplication, improve maintainability, and enable parallel development.

### IV. Performance First
**Description**: The platform must load quickly and respond smoothly to user interactions.

**Rules**:
- Use lazy loading for all routes except the homepage (`src/App.tsx`)
- Images and media must be optimized before upload
- React Query must be used for data fetching with proper caching (5min stale, 10min cache)
- Heavy computations must be memoized or moved to Web Workers
- Bundle size must be monitored using `vite-bundle-visualizer`
- Code splitting must be applied to large features

**Rationale**: Educational content includes large media files. Poor performance directly impacts learning outcomes and user retention.

### V. Type Safety & Code Quality (NON-NEGOTIABLE)
**Description**: All code must be type-safe and follow established quality standards.

**Rules**:
- TypeScript strict mode must be enabled
- All functions must have explicit return types
- No `any` types without explicit justification
- ESLint and Prettier must pass before commits (enforced via Husky pre-commit hooks)
- Type generation from Supabase schema must be kept in sync

**Rationale**: Type safety prevents runtime errors and makes refactoring safe. Educational platforms cannot afford bugs in assessment or enrollment logic.

### VI. Backend Integration Standards
**Description**: Backend operations must be reliable, secure, and well-structured.

**Rules**:
- All Supabase Edge Functions must handle errors gracefully
- Database migrations must be reversible
- API responses must follow consistent formats
- Supabase client must be properly configured (`src/integrations/supabase/`)
- Edge Functions must validate inputs and handle CORS properly

**Rationale**: Backend reliability is critical for enrollment, payments, assessments, and content delivery.

### VII. Content Management & Accessibility
**Description**: Educational content must be manageable, accessible, and properly structured.

**Rules**:
- Admin/CMS interfaces must be protected by role-based access
- Blog content must support markdown with proper sanitization (using DOMPurify)
- Media content must include transcriptions for accessibility
- Templates must be exportable and importable for content reuse
- Content must be versioned and reviewable before publication

**Rationale**: Educational institutions need robust content management. Accessibility compliance ensures all learners can access materials.

### VIII. Testing & Quality Assurance
**Description**: Critical features must be tested to ensure reliability.

**Rules**:
- Authentication flows must have integration tests
- Payment processing must be tested in sandbox mode
- Form validation must be tested with invalid inputs
- Assessment submission must be tested for edge cases
- Admin operations must be tested for authorization

**Rationale**: Bugs in enrollment, payments, or assessments directly harm users and the institution's reputation.

## Technology Stack Standards

**Frontend**:
- React 18+ with TypeScript
- Vite as build tool
- Tailwind CSS + shadcn/ui for styling
- React Router v6 for routing
- TanStack Query (React Query) for data fetching
- React Hook Form + Zod for form validation

**Backend**:
- Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- Deno runtime for Edge Functions

**Development Tools**:
- ESLint + Prettier for code formatting
- Husky for git hooks
- Commitlint for commit message standards
- vite-bundle-visualizer for bundle analysis

**Deployment**:
- Vercel for frontend hosting
- GitHub Actions for CI/CD (auto-deploy on push to main)
- Environment variables managed in Vercel dashboard

## Development Workflow

**Branch Strategy**:
- `main` branch is protected and auto-deploys to production
- Feature branches must be created for new work
- Branch naming: `feature/<feature-name>`, `fix/<bug-name>`

**Code Review**:
- All changes require review before merging to main
- Reviewers must verify:
  - Type safety (no TypeScript errors)
  - Tests pass (if applicable)
  - Performance impact (bundle size, query optimization)
  - Security implications (authentication, data access)
  - Accessibility compliance

**Commit Standards**:
- Follow Conventional Commits format
- Use commitlint to enforce standards
- Commit types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

**Quality Gates**:
- Pre-commit: ESLint, Prettier, TypeScript check
- Pre-push: All tests must pass
- Deployment: Build must succeed without warnings

## Governance

**Constitutional Authority**:
This constitution supersedes all other development practices. When conflicts arise, constitutional principles take precedence.

**Amendment Process**:
1. Propose changes with rationale
2. Discuss impact on existing features
3. Update dependent templates and documentation
4. Increment version according to semantic versioning
5. Document in Sync Impact Report

**Compliance**:
- All pull requests must verify constitutional compliance
- Features violating principles must be rejected or redesigned
- Technical debt must be justified and time-boxed

**Version Tracking**:
- MAJOR: Breaking changes to core principles
- MINOR: New principles or significant expansions
- PATCH: Clarifications, typo fixes, minor updates

**Version**: 1.0.0 | **Ratified**: 2025-10-01 | **Last Amended**: 2025-10-01
