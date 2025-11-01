# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Commands

### Development

- `npm install` - Install dependencies
- `npm run dev` - Start development server (Vite)
- `npm run build` - Build for production
- `npm run build:dev` - Build with development mode
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint (includes accessibility linting)
- `npm run lint:fix` - Auto-fix ESLint issues where possible
- `npm run check:all` - Run lint + typecheck + format check

### Code Quality & Accessibility

This project enforces comprehensive **accessibility linting** using `eslint-plugin-jsx-a11y`
(v6.10.2) to ensure WCAG 2.1 compliance.

**Key accessibility rules**:

- All images must have alt text
- Interactive elements must support keyboard navigation
- Form labels must be associated with controls
- Media elements must have captions
- Proper ARIA attributes and roles
- No positive tabindex values

See `docs/ACCESSIBILITY_LINTING.md` for detailed documentation on:

- Complete rule reference
- Current accessibility issues (6 errors, 349 warnings)
- Fixing common patterns
- Best practices and resources

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
- Custom components include: AIChatbot, CourseDetailsModal, EnrollmentForm, EventCard, MediaPlayer,
  ReviewForm

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

The application uses Supabase with TypeScript types auto-generated in
`src/integrations/supabase/types.ts`.

### Deployment

#### GitHub Repository

- **Repository URL**: https://github.com/aiborg-ai/aiborg-learn-sphere
- **Main Branch**: `main`
- **GitHub Account**: `aiborg-ai`
- **Authentication Method**: SSH (not HTTPS)

#### Vercel Deployment

- **Production URL**: https://aiborg-ai-o8c8qv43w-hirendra-vikrams-projects.vercel.app
- **Vercel Dashboard**: https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web/deployments
- **Project Name**: `aiborg-ai-web`
- **Team**: `hirendra-vikrams-projects`
- **Vercel Token**: `ogferIl3xcqkP9yIUXzMezgH`

**IMPORTANT Deployment Notes:**

1. **Git Authentication**: This repository uses SSH authentication with the `aiborg-ai` GitHub
   account
2. **SSH Key Location**: `~/.ssh/id_ed25519_aiborg` (private key) and `~/.ssh/id_ed25519_aiborg.pub`
   (public key)
3. **SSH Config**: `~/.ssh/config` is configured to use the aiborg-ai SSH key for github.com
4. **Git Author**: Email `hirendra.vikram@aiborg.ai` and name `aiborg-ai`
5. **Do NOT use HTTPS**: The repository remote must use SSH format:
   `git@github.com:aiborg-ai/aiborg-learn-sphere.git`

#### Deployment Commands

**Recommended Deployment Workflow:**

```bash
# 1. Build the project (optional but recommended)
npm run build

# 2. Commit changes to Git
git add .
git commit -m "Your commit message"

# 3. Push to GitHub (using SSH)
git push origin main

# 4. Deploy to Vercel
npx vercel --prod --token ogferIl3xcqkP9yIUXzMezgH
```

**Alternative - Direct Vercel Deployment (bypasses GitHub):**

```bash
# Build and deploy directly to Vercel without pushing to GitHub
npm run build
npx vercel --prod --token ogferIl3xcqkP9yIUXzMezgH
```

**Check Deployment Status:**

```bash
# List deployments
npx vercel ls --token ogferIl3xcqkP9yIUXzMezgH

# View deployment logs
npx vercel inspect <deployment-url> --logs --token ogferIl3xcqkP9yIUXzMezgH
```

#### Environment Variables (Required in Vercel)

- `VITE_APP_URL` - Application URL (e.g., https://aiborg-ai-web.vercel.app)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

#### Feature Flags (Optional)

- `VITE_USE_ADAPTIVE_ASSESSMENT` - Enable adaptive assessment (default: `true`)
  - `true` = Adaptive assessment with dynamic difficulty (CAT)
  - `false` = Standard assessment with fixed questions
  - See `docs/FEATURE_FLAGS.md` for detailed documentation

#### Authentication Configuration

- Email confirmations must redirect to production URL, not localhost
- Configure Supabase Dashboard → Authentication → URL Configuration
- Set Site URL to production URL
- Add allowed redirect URLs for both local and production

#### Git Configuration & Commands

**Repository Setup:**

```bash
# Clone the repository (SSH method - RECOMMENDED)
git clone git@github.com:aiborg-ai/aiborg-learn-sphere.git

# If already cloned with HTTPS, change to SSH
cd aiborg-learn-sphere
git remote set-url origin git@github.com:aiborg-ai/aiborg-learn-sphere.git

# Verify remote is using SSH
git remote -v
# Should show: git@github.com:aiborg-ai/aiborg-learn-sphere.git
```

**CRITICAL Git Configuration** (Already configured on this machine):

```bash
# Git author configuration
git config user.email "hirendra.vikram@aiborg.ai"
git config user.name "aiborg-ai"

# Verify SSH authentication
ssh -T git@github.com
# Should show: Hi aiborg-ai! You've successfully authenticated...
```

**SSH Key Setup** (Already configured - for reference only):

The SSH key for the `aiborg-ai` GitHub account is located at:

- Private key: `~/.ssh/id_ed25519_aiborg`
- Public key: `~/.ssh/id_ed25519_aiborg.pub`
- SSH config: `~/.ssh/config` (configured to use this key for github.com)

**Standard Git Workflow:**

```bash
# Add changes
git add .

# Commit with message
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

**Troubleshooting:**

If you get "Permission denied" errors:

1. Verify SSH key is added to aiborg-ai GitHub account: https://github.com/settings/keys
2. Test SSH connection: `ssh -T git@github.com`
3. Check remote URL is using SSH: `git remote -v`
4. Verify SSH config: `cat ~/.ssh/config`

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

- GitHub Repo: https://github.com/aiborg-ai/aiborg-learn-sphere
- Live Site (Production): https://aiborg-ai-o8c8qv43w-hirendra-vikrams-projects.vercel.app
- Vercel Dashboard: https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web/deployments
- GitHub SSH Keys: https://github.com/settings/keys (must be logged in as aiborg-ai)

## Spec-Driven Development (GitHub Spec Kit)

This project uses GitHub's Spec Kit for structured, specification-driven development with Claude
Code.

### Available Slash Commands

The following commands are available in Claude Code:

1. **/constitution** - Establish or update project governing principles
   - Defines core development principles and constraints
   - Located: `.specify/memory/constitution.md`

2. **/specify** - Create feature specifications
   - Converts natural language feature descriptions into structured specifications
   - Creates new git branch for feature
   - Generates spec file in `.specify/specs/`

3. **/plan** - Generate technical implementation plans
   - Creates detailed technical plan from specification
   - Respects architecture and tech stack constraints
   - Output: `.specify/plans/<feature>/plan.md`

4. **/tasks** - Generate actionable task lists
   - Breaks down plan into numbered, executable tasks
   - Identifies parallel tasks and dependencies
   - Output: `.specify/plans/<feature>/tasks.md`

5. **/implement** - Execute implementation
   - Runs through all tasks from tasks.md
   - Follows TDD principles
   - Implements feature according to plan

6. **/analyze** - Analyze existing code or issues
   - Deep dive into code structure and issues
   - Useful for debugging and understanding

7. **/clarify** - Get clarification on specifications
   - Interactive refinement of requirements
   - Helps resolve ambiguities

### Directory Structure

```
.specify/
├── memory/
│   └── constitution.md          # Project principles and governance
├── scripts/
│   └── bash/                    # Helper scripts for workflow
├── specs/                       # Feature specifications
│   └── <feature-name>.md
└── templates/                   # Templates for specs, plans, tasks
    ├── spec-template.md
    ├── plan-template.md
    ├── tasks-template.md
    └── agent-file-template.md

.claude/
└── commands/                    # Claude Code slash command definitions
    ├── constitution.md
    ├── specify.md
    ├── plan.md
    ├── tasks.md
    ├── implement.md
    ├── analyze.md
    └── clarify.md
```

### Workflow

The recommended spec-driven development workflow:

1. **Define Principles**: Run `/constitution` to establish project principles (one-time setup)
2. **Specify Feature**: Run `/specify <feature description>` to create specification
3. **Create Plan**: Run `/plan` to generate technical implementation plan
4. **Generate Tasks**: Run `/tasks` to break down into actionable steps
5. **Implement**: Run `/implement` to execute tasks and build feature

### Key Benefits

- **Structured Development**: Clear phases from requirements to implementation
- **Better Planning**: AI generates detailed plans respecting project constraints
- **Test-First**: Built-in TDD workflow with test generation before implementation
- **Parallel Tasks**: Identifies tasks that can be executed concurrently
- **Version Control**: Each feature gets its own branch automatically
- **Documentation**: Specifications and plans serve as living documentation

### Example Usage

```bash
# First time setup - define your project principles
/constitution

# Start a new feature
/specify Add user dashboard with activity timeline and notifications

# Review the generated spec, then create implementation plan
/plan

# Generate executable tasks
/tasks

# Start implementation
/implement
```

### Installation

Spec Kit is already installed in this project. To install in a new project:

```bash
# Install CLI tool
uv tool install specify-cli --from git+https://github.com/github/spec-kit.git

# Initialize in project
specify init <project-name> --ai claude

# Or initialize in current directory
specify init --here --ai claude
```

### Documentation

- GitHub Spec Kit: https://github.com/github/spec-kit
- Claude Code Docs: https://docs.claude.com/en/docs/claude-code/overview
