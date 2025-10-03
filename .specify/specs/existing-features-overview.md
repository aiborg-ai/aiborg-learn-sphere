# AIBORG Learn Sphere - Existing Features Specification

**Version**: 1.0.0
**Date**: 2025-10-01
**Status**: Documented from existing implementation

---

## 1. Overview

AIBORG Learn Sphere is a comprehensive learning management platform that provides course enrollment, content delivery, assessments, and administrative tools for educational institutions.

### Core User Roles
- **Students**: Enroll in courses, access content, submit assignments, take assessments
- **Instructors**: Manage course content, review submissions, grade assignments
- **Administrators**: Manage users, courses, events, blog content, and platform settings

---

## 2. Authentication & User Management

### 2.1 Authentication System
**Location**: `src/pages/Auth.tsx`, `src/hooks/useAuth.ts`

**Features**:
- Email/password authentication via Supabase Auth
- Password reset functionality (`/auth/reset-password`)
- OAuth callback handling (`/auth/callback`)
- Session management with automatic token refresh
- Protected routes requiring authentication

**Database Tables**:
- `profiles` - User profile information
- Supabase Auth - Authentication and session management

### 2.2 User Profiles
**Location**: `src/pages/Profile.tsx`, `src/pages/PublicProfile.tsx`

**Features**:
- Private profile management for authenticated users
- Public profile viewing (`/user/:userId`)
- Profile customization and settings
- Enrollment history and progress tracking

---

## 3. Course Management System

### 3.1 Course Catalog
**Location**: `src/components/TrainingPrograms.tsx`, `src/hooks/useCourses.ts`

**Features**:
- Browse available courses and training programs
- Filter and search courses
- View course details, pricing, and descriptions
- Course prerequisites and requirements

### 3.2 Course Enrollment
**Location**: `src/components/EnrollmentForm.tsx`, `src/hooks/useEnrollments.ts`

**Features**:
- Student course enrollment workflow
- Payment integration for paid courses
- Enrollment confirmation and receipts
- Enrollment status tracking

**Database Tables**:
- `courses` - Course information
- `enrollments` - Student enrollment records
- `course_materials` - Associated learning materials

### 3.3 Course Materials
**Location**: `src/hooks/useCourseMaterials.ts`

**Features**:
- Video lectures with playback controls
- Downloadable resources
- Reading materials in various formats
- Transcriptions for accessibility

### 3.4 Course Recordings
**Location**: `src/components/CourseRecordingsModal.tsx`

**Features**:
- Access to recorded lectures
- Video player with controls
- Progress tracking for video completion
- Related materials linked to recordings

---

## 4. Assessment & Assignments

### 4.1 AI-Powered Assessments
**Location**: `src/pages/AIAssessment.tsx`, `src/pages/AIAssessmentResults.tsx`

**Features**:
- Interactive AI-driven assessments
- Multiple question types support
- Real-time assessment generation
- Personalized feedback
- Assessment result visualization

**Supabase Functions**:
- AI assessment generation and grading logic

### 4.2 Homework Submission
**Location**: `src/pages/HomeworkSubmissionRefactored.tsx`

**Features**:
- File upload for assignments
- Submission tracking and history
- Deadline management
- Resubmission capabilities
- Instructor feedback viewing

**Database Tables**:
- `assignments` - Assignment definitions
- `submissions` - Student submissions

---

## 5. Events & Scheduling

### 5.1 Event Management
**Location**: `src/pages/AdminRefactored.tsx` (admin), `src/components/EventsSection.tsx` (display)

**Features**:
- Create and manage educational events
- Event registration system
- Event calendar and reminders
- Capacity management
- Event materials distribution

**Hooks**: `src/hooks/useEvents.ts`, `src/hooks/useEventRegistrations.ts`

**Database Tables**:
- `events` - Event information
- `event_registrations` - Registration records

---

## 6. Student Dashboard

### 6.1 Dashboard Overview
**Location**: `src/pages/DashboardRefactored.tsx`

**Features**:
- Enrolled courses overview
- Upcoming assignments and deadlines
- Progress tracking visualizations
- Recent activity feed
- Quick access to active courses
- Announcements and notifications

### 6.2 Progress Tracking
**Features**:
- Course completion percentages
- Assignment submission status
- Assessment scores and history
- Learning path visualization

---

## 7. Content Management System (CMS)

### 7.1 Admin Panel
**Location**: `src/pages/AdminRefactored.tsx`

**Features**:
- User management (view, edit, deactivate)
- Course creation and editing
- Event management
- Platform settings configuration
- Analytics and reporting

**Access Control**: Role-based, admin-only routes

### 7.2 Blog Management
**Location**: `src/pages/CMS/BlogCMS.tsx`, `src/pages/Blog/`

**Features**:
- Create and edit blog posts
- Markdown support with live preview
- SEO optimization (meta tags, slugs)
- Draft and publish workflow
- Content sanitization (DOMPurify)
- Blog listing and individual post pages

**Database Tables**:
- `blog_posts` - Blog content and metadata

### 7.3 Template System
**Location**: `src/pages/admin/TemplateImport.tsx`

**Features**:
- Export course/content templates
- Import templates for content reuse
- Template validation
- Version control for templates

**Supabase Functions**:
- `export-template` - Export functionality
- `import-template` - Import and validation
- `import-from-url` - Import from external URLs
- `validate-template` - Template validation

---

## 8. Payment Integration

### 8.1 Payment Processing
**Location**: `src/pages/PaymentSuccess.tsx`

**Features**:
- Secure payment processing
- Payment confirmation page
- Invoice generation
- Enrollment activation after payment
- Transaction history

**Supabase Functions**:
- `create-payment` - Initialize payments
- `generate-invoice` - Invoice generation

---

## 9. Reviews & Feedback

### 9.1 Course Reviews
**Location**: `src/components/ReviewForm.tsx`, `src/components/UnifiedReviewForm.tsx`

**Features**:
- Submit course reviews and ratings
- Review approval workflow
- Display approved reviews
- Review moderation by admins

**Hooks**: `src/hooks/useReviews.ts`, `src/hooks/useUserReviews.ts`

### 9.2 Event Reviews
**Location**: `src/components/EventReviewForm.tsx`

**Features**:
- Event feedback collection
- Event rating system
- Feedback display for future attendees

**Supabase Functions**:
- `send-review-notification` - Notify about new reviews
- `approve-review` - Review approval
- `send-review-acceptance-notification` - Approval notification

---

## 10. AI Chatbot

### 10.1 AI Assistant
**Location**: `src/components/AIChatbot.tsx`

**Features**:
- Context-aware chat support
- Course-related queries
- Platform navigation help
- Learning assistance

**Supabase Functions**:
- `ai-chat` - AI chatbot backend

---

## 11. Media Features

### 11.1 Video Recording
**Location**: `src/components/VideoRecorder.tsx`

**Features**:
- In-browser video recording
- Video upload to Supabase Storage
- Video preview before submission

### 11.2 Voice Recording
**Location**: `src/components/VoiceRecorder.tsx`

**Features**:
- Audio recording for assignments
- Voice note submissions
- Audio transcription support

**Supabase Functions**:
- `transcribe-audio` - Audio transcription
- `transcribe-video` - Video transcription

### 11.3 Enhanced Video Player
**Location**: `src/components/EnhancedVideoPlayer.tsx`

**Features**:
- Custom video controls
- Playback speed adjustment
- Subtitles/captions support
- Progress tracking

---

## 12. UI/UX Features

### 12.1 Personalization
**Location**: `src/contexts/PersonalizationContext.tsx`

**Features**:
- User preference storage
- Theme customization
- Layout preferences
- Personalized content display

### 12.2 Navigation
**Location**: `src/components/Navbar.tsx`, `src/components/Breadcrumbs.tsx`

**Features**:
- Responsive navigation bar
- User menu with authentication status
- Breadcrumb navigation
- Mobile-friendly menu

### 12.3 Announcements
**Location**: `src/components/AnnouncementTicker.tsx`

**Features**:
- Platform-wide announcements
- Ticker-style display
- Priority messaging

### 12.4 Contact & Information
**Location**: `src/components/ContactSection.tsx`, `src/components/AboutSection.tsx`

**Features**:
- Contact form
- About page information
- FAQ section (`src/components/FAQ.tsx`)
- Terms and conditions modal

**Supabase Functions**:
- `send-contact-notification` - Contact form submissions

---

## 13. Data Management

### 13.1 Optimized Data Fetching
**Hooks**: `src/hooks/useCoursesOptimized.ts`, `src/hooks/usePagination.ts`

**Features**:
- React Query caching (5min stale, 10min cache)
- Pagination for large datasets
- Optimistic updates
- Background refetching

### 13.2 Secure API Calls
**Location**: `src/hooks/useSecureApi.ts`, `src/hooks/useApiCall.ts`

**Features**:
- Authenticated API requests
- Error handling and retry logic
- Request timeout management
- CSRF protection

---

## 14. Developer Features

### 14.1 Performance Monitoring
**Tools**: `vite-bundle-visualizer`

**Features**:
- Bundle size analysis
- Code splitting visualization
- Performance optimization insights

### 14.2 Code Quality
**Tools**: ESLint, Prettier, Husky, Commitlint

**Features**:
- Pre-commit linting and formatting
- Commit message standardization
- TypeScript strict mode enforcement
- Automated code quality checks

### 14.3 Error Handling
**Location**: `src/components/ErrorBoundary.tsx`

**Features**:
- Global error boundary
- Error logging
- User-friendly error messages
- Fallback UI

---

## 15. Infrastructure

### 15.1 Deployment
**Platform**: Vercel

**Features**:
- Auto-deployment on push to main branch
- Preview deployments for branches
- Environment variable management
- Build optimization

**Repository**: https://github.com/aiborg-ai/aiborg-ai-web
**Live Site**: https://aiborg-ai-web.vercel.app

### 15.2 Backend Services
**Platform**: Supabase

**Services**:
- PostgreSQL database with RLS
- Authentication and user management
- File storage for media
- Edge Functions (15 functions deployed)
- Real-time subscriptions (if used)

---

## 16. Database Schema (Key Tables)

Based on Supabase integration:

- `profiles` - User profile data
- `courses` - Course catalog
- `enrollments` - Student-course relationships
- `course_materials` - Learning resources
- `assignments` - Assignment definitions
- `submissions` - Student assignment submissions
- `events` - Educational events
- `event_registrations` - Event attendee tracking
- `blog_posts` - Blog content
- `reviews` - Course/event reviews
- Templates and imported content tables

---

## 17. Security Features

### 17.1 Authentication & Authorization
- Supabase Auth with session management
- Row Level Security (RLS) policies on database
- Role-based access control (student, instructor, admin)
- Protected API routes

### 17.2 Data Protection
- Input sanitization (DOMPurify for markdown)
- Secure file upload validation (`src/components/SecureFileUpload.tsx`)
- HTTPS enforcement
- Environment variable protection

### 17.3 Payment Security
- Secure payment gateway integration
- PCI compliance considerations
- Transaction logging

---

## 18. Accessibility Features

- Keyboard navigation support
- ARIA labels on interactive elements
- Audio/video transcriptions
- Responsive design for mobile devices
- High contrast support
- Screen reader compatibility

---

## 19. Future Considerations

Areas identified for potential enhancement:
- Live class/webinar integration
- Mobile app development
- Advanced analytics dashboard
- Gamification features
- Certificate generation system
- Integration with third-party LMS tools
- Social learning features (study groups, forums)

---

## Conclusion

This specification documents the current state of the AIBORG Learn Sphere platform as of October 2025. The platform provides a comprehensive learning management solution with robust features for content delivery, assessment, administration, and user engagement.

All new features and modifications should adhere to the principles outlined in the project constitution (`.specify/memory/constitution.md`).
