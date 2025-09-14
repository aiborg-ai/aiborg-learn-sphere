# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm install` - Install dependencies
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run build:dev` - Build with development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Architecture

### Tech Stack
- **Frontend Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Context (PersonalizationContext) + TanStack Query
- **Routing**: React Router v6
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Forms**: React Hook Form with Zod validation

### Project Structure

#### Core Application
- `src/App.tsx` - Main application entry with routing setup
- `src/pages/` - Route components (Index, Auth, Profile, Admin, CMS, PaymentSuccess)
- `src/contexts/PersonalizationContext.tsx` - User personalization state management
- `src/integrations/supabase/` - Supabase client configuration and types

#### Key Features
- **Authentication**: Supabase Auth with email/password
- **Admin Panel**: `/admin` route for content management
- **CMS**: `/cms` route for content editing
- **User Profiles**: `/profile` route for user management
- **Payment Integration**: Payment success page with enrollment handling

#### Component Organization
- `src/components/` - Reusable React components
- `src/components/ui/` - shadcn/ui base components (Button, Card, Dialog, etc.)
- Custom components include: AIChatbot, CourseDetailsModal, EnrollmentForm, EventCard, MediaPlayer, ReviewForm

#### Data Fetching
- Custom hooks in `src/hooks/`:
  - `useAuth` - Authentication state
  - `useCourses` - Course data management
  - `useEvents` - Event management
  - `useEnrollments` - Course enrollment handling
  - `useReviews`, `useUserReviews` - Review system

#### Supabase Functions
Edge functions in `supabase/functions/`:
- `ai-chat` - AI chatbot functionality
- `create-payment` - Payment processing
- `generate-invoice` - Invoice generation
- `transcribe-audio`, `transcribe-video` - Media transcription
- `send-review-notification`, `approve-review` - Review workflow

### Database Schema
The application uses Supabase with TypeScript types auto-generated in `src/integrations/supabase/types.ts`.

### Deployment
This is a Lovable.dev project that syncs with GitHub. Changes can be made via:
1. Lovable.dev interface (auto-commits to repo)
2. Local development (push changes to GitHub)
3. Direct GitHub editing