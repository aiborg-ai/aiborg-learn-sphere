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

#### Vercel Deployment
This project is deployed on Vercel at https://aiborg-ai-web.vercel.app

**IMPORTANT Deployment Notes:**
1. **Correct Project**: Use `aiborg-ai-web` (NOT `aiborg-learn-sphere`)
2. **Vercel Account**: Deployed under `hirendra-vikrams-projects` team
3. **Git Author**: Must use email `hirendra.vikram@aiborg.ai` for deployments to work
4. **Vercel Token**: Use token `ogferIl3xcqkP9yIUXzMezgH` for CLI deployments

#### Deployment Commands
```bash
# Deploy to production (with token)
npx vercel --prod --token ogferIl3xcqkP9yIUXzMezgH

# Check deployment status
npx vercel ls --token ogferIl3xcqkP9yIUXzMezgH

# View logs
npx vercel inspect <deployment-url> --logs --token ogferIl3xcqkP9yIUXzMezgH
```

#### Environment Variables (Required in Vercel)
- `VITE_APP_URL` - Application URL (e.g., https://aiborg-ai-web.vercel.app)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

#### Authentication Configuration
- Email confirmations must redirect to production URL, not localhost
- Configure Supabase Dashboard → Authentication → URL Configuration
- Set Site URL to production URL
- Add allowed redirect URLs for both local and production

#### Git Configuration
**CRITICAL**: Set correct git author for deployments to work:
```bash
git config user.email "hirendra.vikram@aiborg.ai"
git config user.name "aiborg-ai"
```

If deployment fails with "Git author must have access" error, amend commit:
```bash
git commit --amend --author="aiborg-ai <hirendra.vikram@aiborg.ai>" --no-edit
git push --force origin main
```

#### Branding Assets
- Logo: `/public/aiborg-logo.svg` - Gold "AI" with "BORG™" text on black
- Favicon: `/public/aiborg-favicon.svg` - Compact "AI" icon in gold
- No Lovable branding should remain

#### Development Origins
Originally created on Lovable.dev, now independently deployed. Changes can be made via:
1. Local development (push to GitHub → auto-deploy to Vercel)
2. Direct GitHub editing (auto-deploys)
3. Lovable.dev interface (if still connected)