# Learner Profiles & AI Curriculum Builder System

## 📋 Overview

This system implements a **two-phase intelligent onboarding and curriculum building platform** that enables users to:

1. **Create Learning Profiles** - Step-by-step workflow to capture learning goals, preferences, and context
2. **Generate AI Curricula** - AI-powered course recommendations personalized to each profile

**Inspiration**: Based on appboardguru2's workflow system combined with aiborg-learn-sphere's AI assessment infrastructure.

---

## 🎯 Features

### Phase 1: Learner Profiles
- ✅ **Multiple Profiles** - Users can create profiles for different goals (e.g., "Career Switch", "Leadership Development")
- ✅ **Step-by-Step Wizard** - 6-step guided workflow with validation
- ✅ **Assessment Integration** - Links AI assessment results for personalization
- ✅ **Auto-Updates** - Profiles automatically update based on user learning activities
- ✅ **Primary Profile** - One profile can be marked as primary/default

### Phase 2: AI Curriculum Builder
- ✅ **AI Generation** - Intelligent course recommendations based on profile data
- ✅ **Gap Analysis** - Uses IRT scores to identify knowledge gaps
- ✅ **User Approval** - Users can approve/reject each recommended course
- ✅ **Module Organization** - Courses grouped into Foundation → Application → Mastery
- ✅ **Progress Tracking** - Real-time curriculum completion tracking
- ✅ **Enrollment Integration** - One-click enrollment from curriculum

---

## 🗄️ Database Schema

### Core Tables

#### `learner_profiles`
Stores user learning profiles with goals and preferences.

```sql
Key Fields:
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- profile_name: TEXT (e.g., "AI Career Switch")
- learning_goals: JSONB (array of goal objects)
- experience_level: TEXT (beginner/intermediate/advanced/expert)
- preferred_learning_style: TEXT (visual/reading/hands-on/mixed)
- available_hours_per_week: INTEGER
- latest_assessment_id: UUID (linked assessment)
- is_primary: BOOLEAN (default profile)
```

#### `profile_workflow_steps`
Template defining the 6-step profile creation wizard.

```sql
Key Fields:
- step_order: INTEGER (1-6)
- step_name: TEXT (welcome, background, learning_goals, etc.)
- title: TEXT
- step_type: TEXT (form/assessment/selection/review)
- fields_to_collect: JSONB (field definitions)
- is_skippable: BOOLEAN
```

#### `user_profile_workflow_progress`
Tracks individual user progress through the workflow.

```sql
Key Fields:
- user_id: UUID
- profile_id: UUID (null until profile created)
- current_step_order: INTEGER
- completed_steps: INTEGER[] (array of completed step orders)
- step_data: JSONB (accumulated user input)
- status: TEXT (not_started/in_progress/completed/abandoned)
```

#### `user_curricula`
AI-generated custom curricula for each profile.

```sql
Key Fields:
- id: UUID
- profile_id: UUID
- curriculum_name: TEXT
- generated_by_ai: BOOLEAN
- ai_confidence_score: DECIMAL (0.00-1.00)
- total_courses: INTEGER
- progress_percentage: DECIMAL
- is_published: BOOLEAN (user approved)
```

#### `curriculum_courses`
Many-to-many junction table with rich metadata.

```sql
Key Fields:
- curriculum_id: UUID
- course_id: INTEGER
- sequence_order: INTEGER
- recommendation_score: DECIMAL (0.00-1.00)
- recommendation_reason: TEXT
- user_approved: BOOLEAN (true=keep, false=remove, null=pending)
- is_required: BOOLEAN
```

---

## 🚀 Workflow System

### Profile Creation Workflow (6 Steps)

#### **Step 1: Welcome & Profile Name**
- **Purpose**: Collect profile name and description
- **Fields**:
  - `profile_name` (required, 3-100 chars)
  - `description` (optional, max 500 chars)
- **UI**: Simple form with inspiring examples
- **Estimated Time**: 2 minutes

#### **Step 2: Your Background**
- **Purpose**: Understand professional context
- **Fields**:
  - `target_audience` (professional/business/student/etc.)
  - `experience_level` (beginner/intermediate/advanced/expert)
  - `industry`, `job_role`, `company_size`, `years_experience` (conditional)
- **UI**: Smart dropdowns with conditional fields
- **Estimated Time**: 3 minutes

#### **Step 3: Learning Goals**
- **Purpose**: Capture what user wants to achieve
- **Fields**:
  - `learning_goals` (multi-select + custom input, 1-5 selections)
- **Predefined Options**:
  - Master AI Fundamentals
  - Become ML Engineer
  - Build AI Products
  - Lead AI Strategy
  - Master Data Science
  - NLP Specialist
  - Computer Vision Expert
  - AI Ethics & Governance
- **UI**: Multi-select chips with custom goal input
- **Estimated Time**: 3 minutes

#### **Step 4: Learning Preferences**
- **Purpose**: Understand learning style and availability
- **Fields**:
  - `preferred_learning_style` (visual/reading/hands-on/mixed)
  - `available_hours_per_week` (slider, 1-40)
  - `preferred_schedule` (optional day/time selector)
- **UI**: Visual cards + sliders
- **Estimated Time**: 2 minutes

#### **Step 5: Assessment Integration** (OPTIONAL/SKIPPABLE)
- **Purpose**: Link assessment results for better personalization
- **Fields**:
  - `has_assessment` (yes/no/take_now)
  - `latest_assessment_id` (assessment selector)
- **UI**: Radio options + assessment picker
- **Estimated Time**: 2 minutes
- **Skippable**: Yes

#### **Step 6: Review & Confirm**
- **Purpose**: Final review before creating profile
- **Fields**: None (review only)
- **UI**: Summary cards with edit buttons
- **Actions**:
  - Edit any previous step
  - Confirm and create profile
- **Estimated Time**: 2 minutes

**Total Estimated Time**: 10-15 minutes

---

## 🤖 AI Curriculum Generation

### Algorithm Flow

```
1. INPUT COLLECTION
   ├─ Profile data (goals, experience, preferences)
   ├─ Assessment results (IRT scores, proficiency areas)
   ├─ Learning path data (existing recommendations)
   └─ Available courses (filtered by is_active = true)

2. GAP ANALYSIS
   ├─ Compare current IRT ability vs target
   ├─ Identify skill gaps from proficiency_areas
   └─ Map gaps to learning goals

3. COURSE FILTERING
   ├─ Match by audience & experience level
   ├─ Filter by prerequisites user can meet
   └─ Exclude already enrolled courses

4. RELEVANCE SCORING (0.00-1.00)
   ├─ Skill gap coverage: 40%
   ├─ Learning goal alignment: 30%
   ├─ Difficulty appropriateness: 20%
   └─ Time/schedule fit: 10%

5. PATH GENERATION
   ├─ Sort by relevance score (highest first)
   ├─ Sequence by dependencies & difficulty
   ├─ Group into modules (Foundation/Application/Mastery)
   ├─ Select top 5-12 courses
   └─ Generate recommendation reasons

6. OUTPUT
   ├─ user_curricula record (curriculum metadata)
   ├─ curriculum_courses records (each with score & reason)
   └─ curriculum_modules records (optional grouping)
```

### Recommendation Scoring Example

**Course: "Machine Learning Fundamentals"**
```javascript
{
  skill_gap_coverage: 0.85,      // Covers 85% of identified gaps
  goal_alignment: 0.90,          // Strongly matches goal "Master AI Fundamentals"
  difficulty_fit: 1.00,          // Perfect match for intermediate level
  schedule_fit: 0.70,            // Mostly fits available hours

  final_score: (0.85 * 0.40) + (0.90 * 0.30) + (1.00 * 0.20) + (0.70 * 0.10)
             = 0.34 + 0.27 + 0.20 + 0.07
             = 0.88 (★★★★☆)
}
```

### Recommendation Reasons

AI generates human-readable reasons for each course:

- "Fills critical knowledge gap in Neural Networks"
- "Directly supports your goal: Build AI Products"
- "Builds on your existing Machine Learning knowledge"
- "Prerequisites met based on your assessment results"
- "Matches your hands-on learning preference"

---

## 💻 Service Layer

### `ProfileWorkflowService.ts`

```typescript
class ProfileWorkflowService {
  // Get workflow steps template
  async getWorkflowSteps(): Promise<WorkflowStep[]>

  // Get or create user's workflow progress
  async getOrCreateProgress(userId: string): Promise<WorkflowProgress>

  // Update step data and advance workflow
  async updateStepData(progressId: string, stepOrder: number, data: any): Promise<void>

  // Complete step and move to next
  async completeStep(progressId: string, stepOrder: number): Promise<void>

  // Go back to previous step
  async goToPreviousStep(progressId: string): Promise<void>

  // Finalize workflow and create profile
  async finalizeWorkflow(progressId: string): Promise<LearnerProfile>

  // Get workflow summary for review
  async getWorkflowSummary(progressId: string): Promise<WorkflowSummary>
}
```

### `CurriculumGenerationService.ts`

```typescript
class CurriculumGenerationService {
  // Generate AI curriculum for a profile
  async generateCurriculum(profileId: string): Promise<CurriculumGenerationJob>

  // Get generation job status
  async getGenerationStatus(jobId: string): Promise<GenerationJob>

  // Core AI algorithm
  private async runGenerationAlgorithm(
    profile: LearnerProfile,
    courses: Course[]
  ): Promise<CurriculumDraft>

  // Calculate course relevance score
  private calculateRelevanceScore(
    course: Course,
    profile: LearnerProfile,
    assessment: Assessment
  ): number

  // Generate recommendation reason
  private generateRecommendationReason(
    course: Course,
    profile: LearnerProfile,
    score: number
  ): string

  // Sequence courses by difficulty and dependencies
  private sequenceCourses(courses: ScoredCourse[]): SequencedCourse[]

  // Group courses into modules
  private groupIntoModules(courses: SequencedCourse[]): Module[]
}
```

### `CurriculumApprovalService.ts`

```typescript
class CurriculumApprovalService {
  // Approve a course in curriculum
  async approveCourse(curriculumId: string, courseId: number): Promise<void>

  // Reject a course in curriculum
  async rejectCourse(curriculumId: string, courseId: number): Promise<void>

  // Bulk approve multiple courses
  async bulkApprove(curriculumId: string, courseIds: number[]): Promise<void>

  // Publish curriculum (finalize user choices)
  async publishCurriculum(curriculumId: string): Promise<Curriculum>

  // Add custom course to curriculum
  async addCustomCourse(curriculumId: string, courseId: number): Promise<void>
}
```

---

## 🎨 UI Components

### Profile Workflow Components

```
src/components/profile-workflow/
├── ProfileWorkflowWizard.tsx          # Main wizard container with stepper
├── WorkflowStepIndicator.tsx          # Progress indicator (1/6, 2/6, etc.)
├── steps/
│   ├── Step1Welcome.tsx               # Profile name & description
│   ├── Step2Background.tsx            # Professional context
│   ├── Step3Goals.tsx                 # Learning goals multi-select
│   ├── Step4Preferences.tsx           # Learning style & schedule
│   ├── Step5Assessment.tsx            # Assessment integration
│   └── Step6Review.tsx                # Summary review
├── ProfileCard.tsx                    # Display created profile
├── ProfileList.tsx                    # List all user profiles
├── ProfileSelector.tsx                # Select from multiple profiles
└── ProfileSettings.tsx                # Edit profile details
```

### Curriculum Builder Components

```
src/components/curriculum/
├── CurriculumBuilder.tsx              # Main builder flow orchestrator
├── ProfileSelector.tsx                # Select which profile to use
├── AIGenerationLoader.tsx             # Loading state with progress
├── CurriculumDraftView.tsx            # Show AI recommendations
├── CourseRecommendationCard.tsx       # Individual course card
│   ├── Course details (name, duration, price)
│   ├── Recommendation score (★★★★☆)
│   ├── Reason ("Why this course?")
│   └── Actions (✅ Keep, ❌ Remove, ℹ️ Details)
├── CurriculumModuleGroup.tsx          # Group courses by module
├── CurriculumSummary.tsx              # Stats overview
├── MyCurriculaDashboard.tsx           # View all user curricula
├── CurriculumProgressTracker.tsx      # Track completion
└── CurriculumEnrollmentPanel.tsx      # Bulk enrollment UI
```

---

## 🔄 Auto-Update System

### Profile Interaction Tracking

**Triggers**: Automatically log user activities that affect profile

```sql
-- Example: Course completion
CREATE TRIGGER on_course_completion
AFTER UPDATE ON enrollments
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION log_profile_interaction('course_completed');

-- Example: Assessment taken
CREATE TRIGGER on_assessment_complete
AFTER INSERT ON user_ai_assessments
WHEN (NEW.is_complete = true)
EXECUTE FUNCTION log_profile_interaction('assessment_taken');
```

**Profile Updates**:
- Update `proficiency_areas` based on completed courses
- Adjust `irt_ability_score` from new assessments
- Mark goals as progressing/completed
- Suggest curriculum updates

---

## 📊 User Flows

### New User Journey

```
1. Sign Up → Email Verification
   ↓
2. Welcome Screen → "Create Your Learning Profile"
   ↓
3. Complete 6-Step Wizard (10-15 min)
   ↓
4. Profile Created → "Generate Your Custom Curriculum?"
   ↓
5. AI Generates Recommendations (15-30 seconds)
   ↓
6. Review Courses → Approve/Reject each
   ↓
7. Publish Curriculum
   ↓
8. Start Learning! (Enroll in courses)
```

### Existing User (Multiple Profiles)

```
1. Profile Page → "Create New Profile" button
   ↓
2. Complete Wizard for new goal
   ↓
3. User now has multiple profiles:
   - "AI Career Switch" (primary)
   - "Leadership Development"
   - "Data Science Mastery"
   ↓
4. Generate curricula for each profile
   ↓
5. Switch between profiles anytime
```

---

## 🔐 Security & Privacy

### Row Level Security (RLS)

All tables have RLS policies ensuring:
- Users can only access their own data
- No cross-user data leakage
- Admin can view anonymized analytics

### Data Ownership

```sql
-- Example RLS Policy
CREATE POLICY "users_own_profiles"
ON learner_profiles
FOR ALL
USING (auth.uid() = user_id);
```

---

## 📈 Analytics & Metrics

### Key Performance Indicators

**Profile Creation**:
- Profile completion rate (target: 70%+)
- Average time to complete workflow
- Step drop-off rates
- Primary profile usage

**Curriculum Generation**:
- Generation usage rate (target: 50% of profile creators)
- Course approval rate (target: 60%+)
- Average courses per curriculum
- AI confidence scores distribution

**Engagement**:
- Enrollment from curriculum (target: 40%+)
- Curriculum completion rate
- Profile update frequency
- Multi-profile users percentage

---

## 🚦 Implementation Status

### ✅ Completed
- [x] Database schema design
- [x] Migration files created
- [x] Workflow steps seeded
- [x] RLS policies implemented
- [x] Core triggers and functions

### 🔄 In Progress
- [ ] CurriculumGenerationService
- [ ] Profile Workflow UI components
- [ ] Curriculum Builder UI
- [ ] API endpoints

### 📋 Upcoming
- [ ] Integration with existing pages
- [ ] Mobile responsive design
- [ ] Analytics dashboard
- [ ] User documentation

---

## 🎯 Next Steps

1. **Deploy Migrations** - Run both SQL migration files
2. **Build Services** - Implement TypeScript service layer
3. **Create UI Components** - Build React components
4. **Integration** - Add to main navigation and onboarding
5. **Testing** - E2E tests with Playwright
6. **Launch** - Gradual rollout with analytics

---

## 📚 Additional Resources

- **Database Migrations**:
  - `supabase/migrations/20251016000000_learner_profiles_workflow.sql`
  - `supabase/migrations/20251016000001_curriculum_builder.sql`

- **Services** (to be created):
  - `src/services/profile/ProfileWorkflowService.ts`
  - `src/services/curriculum/CurriculumGenerationService.ts`
  - `src/services/curriculum/CurriculumApprovalService.ts`

- **Components** (to be created):
  - `src/components/profile-workflow/`
  - `src/components/curriculum/`

---

**System Version**: 1.0.0
**Last Updated**: October 16, 2025
**Maintainers**: Development Team
