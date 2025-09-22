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

#### GitHub Repository
- **Repository URL**: https://github.com/aiborg-ai/aiborg-ai-web
- **Main Branch**: `main`
- **Auto-deployment**: Pushes to main branch automatically trigger Vercel deployments

#### Vercel Deployment
- **Production URL**: https://aiborg-ai-web.vercel.app
- **Vercel Dashboard**: https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web/deployments
- **Project Name**: `aiborg-ai-web` (NOT `aiborg-learn-sphere`)
- **Team**: `hirendra-vikrams-projects`

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

#### Git Configuration & Commands

**Repository Setup:**
```bash
# Clone the repository
git clone https://github.com/aiborg-ai/aiborg-ai-web.git

# Set remote (if needed)
git remote set-url origin https://github.com/aiborg-ai/aiborg-ai-web.git

# Check current remote
git remote -v
```

**CRITICAL Git Author Configuration** (Required for deployments):
```bash
git config user.email "hirendra.vikram@aiborg.ai"
git config user.name "aiborg-ai"
```

**Push to GitHub (triggers auto-deployment):**
```bash
# Add changes
git add .

# Commit with proper author
git commit -m "Your commit message"

# Push to main branch
git push origin main
```

**Fix Author Issues:**
If deployment fails with "Git author must have access" error:
```bash
git commit --amend --author="aiborg-ai <hirendra.vikram@aiborg.ai>" --no-edit
git push --force origin main
```

#### Branding Assets
- Logo: `/public/aiborg-logo.svg` - Gold "AI" with "BORG™" text on black
- Favicon: `/public/aiborg-favicon.svg` - Compact "AI" icon in gold
- No Lovable branding should remain

#### Development Workflow
Changes can be deployed through:
1. **Local Development** → Push to GitHub → Auto-deploys to Vercel
2. **Direct GitHub Editing** → Auto-deploys on commit to main branch
3. **Vercel Dashboard** → Manual redeployment if needed

**Important URLs:**
- GitHub Repo: https://github.com/aiborg-ai/aiborg-ai-web
- Live Site: https://aiborg-ai-web.vercel.app
- Vercel Dashboard: https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web/deployments