# 🚀 Learner Profiles & Curriculum Builder - Implementation & Deployment Guide

## ✅ COMPLETED COMPONENTS

### Backend & Services (100% Complete)

**Database Schema**:
- ✅ `supabase/migrations/20251016000000_learner_profiles_workflow.sql` - Profile system
- ✅ `supabase/migrations/20251016000001_curriculum_builder.sql` - Curriculum system

**Services**:
- ✅ `src/services/curriculum/CurriculumGenerationService.ts` - AI generation engine
- ✅ `src/services/profile/ProfileWorkflowService.ts` - Workflow management
- ✅ `src/services/curriculum/CurriculumApprovalService.ts` - Course approval logic

**React Hooks**:
- ✅ `src/hooks/useLearnerProfiles.ts` - Profile CRUD operations
- ✅ `src/hooks/useCurriculum.ts` - Curriculum management

**Documentation**:
- ✅ `docs/LEARNER_PROFILES_AND_CURRICULUM.md` - Complete system documentation

---

## 📋 DEPLOYMENT STEPS

### Step 1: Deploy Database Migrations

```bash
cd /home/vik/aiborg_CC/aiborg-learn-sphere

# Deploy Profile Workflow Migration
PGPASSWORD='hirendra$1234ABCD' psql -h aws-0-ap-south-1.pooler.supabase.com -p 5432 -U postgres.afrulkxxzcmngbrdfuzj -d postgres -f supabase/migrations/20251016000000_learner_profiles_workflow.sql

# Deploy Curriculum Builder Migration
PGPASSWORD='hirendra$1234ABCD' psql -h aws-0-ap-south-1.pooler.supabase.com -p 5432 -U postgres.afrulkxxzcmngbrdfuzj -d postgres -f supabase/migrations/20251016000001_curriculum_builder.sql
```

**Verify Deployment**:
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('learner_profiles', 'profile_workflow_steps', 'user_curricula', 'curriculum_courses');

-- Check workflow steps seeded
SELECT step_order, step_name, title FROM profile_workflow_steps ORDER BY step_order;

-- Should return 6 steps: welcome, background, learning_goals, learning_preferences, assessment_link, review
```

### Step 2: Build & Test Services

The services are ready to use. Test them:

```typescript
// Test Profile Workflow Service
import { profileWorkflowService } from '@/services/profile/ProfileWorkflowService';

const steps = await profileWorkflowService.getWorkflowSteps();
console.log('Workflow steps:', steps);

// Test Curriculum Generation
import { curriculumGenerationService } from '@/services/curriculum/CurriculumGenerationService';

const job = await curriculumGenerationService.generateCurriculum(profileId);
console.log('Generation job:', job);
```

---

## 🎨 UI COMPONENTS TO BUILD

### Priority 1: Profile Workflow Components (Essential)

Create these components in `src/components/profile-workflow/`:

#### 1. **ProfileWorkflowWizard.tsx** (Main Container)

```typescript
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { profileWorkflowService } from '@/services/profile/ProfileWorkflowService';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';

export const ProfileWorkflowWizard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState([]);
  const [progressId, setProgressId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const workflowSteps = await profileWorkflowService.getWorkflowSteps();
      setSteps(workflowSteps);

      const progress = await profileWorkflowService.getOrCreateProgress(user.id);
      setProgressId(progress.id);
      setCurrentStep(progress.current_step_order);
      setLoading(false);
    }
    init();
  }, [user]);

  const handleStepComplete = async (stepData: any) => {
    await profileWorkflowService.updateStepData(progressId, currentStep, stepData);
    await profileWorkflowService.completeStep(progressId, currentStep);
    setCurrentStep(currentStep + 1);
  };

  const handleFinalize = async () => {
    const profile = await profileWorkflowService.finalizeWorkflow(progressId);
    navigate(`/profile?tab=learning-paths`);
  };

  if (loading) return <div>Loading...</div>;

  const currentStepData = steps.find(s => s.step_order === currentStep);
  const progressPercentage = (currentStep / steps.length) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Progress value={progressPercentage} className="mb-8" />

      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-4">{currentStepData?.title}</h2>
        <p className="text-gray-600 mb-6">{currentStepData?.description}</p>

        {/* Render current step component */}
        {currentStep === 1 && <Step1Welcome onComplete={handleStepComplete} />}
        {currentStep === 2 && <Step2Background onComplete={handleStepComplete} />}
        {currentStep === 3 && <Step3Goals onComplete={handleStepComplete} />}
        {currentStep === 4 && <Step4Preferences onComplete={handleStepComplete} />}
        {currentStep === 5 && <Step5Assessment onComplete={handleStepComplete} />}
        {currentStep === 6 && <Step6Review progressId={progressId} onFinalize={handleFinalize} />}
      </Card>
    </div>
  );
};
```

#### 2. **Step Components** (`steps/Step1Welcome.tsx` through `Step6Review.tsx`)

Each step should:
- Use React Hook Form for validation
- Pull field definitions from workflow step data
- Call `onComplete(stepData)` when done
- Have Previous/Next navigation

**Example - Step1Welcome.tsx**:
```typescript
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const Step1Welcome = ({ onComplete }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    onComplete(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label>Profile Name *</label>
        <Input
          {...register('profile_name', { required: true, minLength: 3, maxLength: 100 })}
          placeholder="e.g., Career Switch to AI, Leadership Development"
        />
        {errors.profile_name && <span className="text-red-500">Profile name is required (3-100 chars)</span>}
      </div>

      <div>
        <label>Description (Optional)</label>
        <Textarea
          {...register('description', { maxLength: 500 })}
          placeholder="Describe what you want to achieve..."
          rows={4}
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit">Next →</Button>
      </div>
    </form>
  );
};
```

**Copy this pattern for all 6 steps**, using the field definitions from the database.

### Priority 2: Curriculum Builder Components

Create in `src/components/curriculum/`:

#### 1. **CurriculumBuilder.tsx**

```typescript
import { useState, useEffect } from 'react';
import { useCurriculum } from '@/hooks/useCurriculum';
import { useLearnerProfiles } from '@/hooks/useLearnerProfiles';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export const CurriculumBuilder = ({ profileId }) => {
  const { generateCurriculum, checkGenerationStatus } = useCurriculum();
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | generating | completed | failed
  const [curriculumId, setCurriculumId] = useState(null);

  const handleGenerate = async () => {
    setStatus('generating');
    const job = await generateCurriculum(profileId);
    setJobId(job.id);

    // Poll for completion
    const interval = setInterval(async () => {
      const jobStatus = await checkGenerationStatus(job.id);
      if (jobStatus.status === 'completed') {
        clearInterval(interval);
        setStatus('completed');
        setCurriculumId(jobStatus.generated_curriculum_id);
      } else if (jobStatus.status === 'failed') {
        clearInterval(interval);
        setStatus('failed');
      }
    }, 2000);
  };

  if (status === 'generating') {
    return (
      <Card className="p-12 text-center">
        <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-blue-600" />
        <h3 className="text-xl font-semibold">AI is Analyzing Your Profile...</h3>
        <p className="text-gray-600 mt-2">This usually takes 15-30 seconds</p>
      </Card>
    );
  }

  if (status === 'completed') {
    return <CurriculumDraftView curriculumId={curriculumId} />;
  }

  return (
    <Card className="p-8">
      <h2 className="text-2xl font-bold mb-4">Generate Your Custom Curriculum</h2>
      <p className="text-gray-600 mb-6">
        Our AI will analyze your profile and recommend a personalized learning path.
      </p>
      <Button onClick={handleGenerate} size="lg">
        Generate Curriculum →
      </Button>
    </Card>
  );
};
```

#### 2. **CurriculumDraftView.tsx** (Course Approval UI)

```typescript
import { useCurriculum } from '@/hooks/useCurriculum';
import { CourseRecommendationCard } from './CourseRecommendationCard';
import { Button } from '@/components/ui/button';

export const CurriculumDraftView = ({ curriculumId }) => {
  const { currentCurriculum, approveCourse, rejectCourse, publishCurriculum } = useCurriculum(curriculumId);

  const handlePublish = async () => {
    await publishCurriculum(curriculumId);
    // Redirect to curricula dashboard
  };

  if (!currentCurriculum) return <div>Loading...</div>;

  const approvedCount = currentCurriculum.courses.filter(c => c.user_approved === true).length;

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-2xl font-bold">{currentCurriculum.curriculum_name}</h2>
        <p className="text-gray-600">{currentCurriculum.description}</p>
        <div className="flex gap-4 mt-4 text-sm">
          <span>📚 {currentCurriculum.total_courses} courses</span>
          <span>⏱️ {currentCurriculum.estimated_completion_weeks} weeks</span>
          <span>✅ {approvedCount} approved</span>
        </div>
      </div>

      {/* Group by modules */}
      {currentCurriculum.modules.map(module => (
        <div key={module.module_name}>
          <h3 className="text-xl font-semibold mb-4">{module.module_name}</h3>
          <div className="space-y-4">
            {currentCurriculum.courses
              .filter(c => c.module_name === module.module_name)
              .map(course => (
                <CourseRecommendationCard
                  key={course.id}
                  course={course}
                  onApprove={() => approveCourse(curriculumId, course.course_id)}
                  onReject={() => rejectCourse(curriculumId, course.course_id)}
                />
              ))}
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button onClick={handlePublish} size="lg" disabled={approvedCount === 0}>
          Publish Curriculum ({approvedCount} courses)
        </Button>
      </div>
    </div>
  );
};
```

#### 3. **CourseRecommendationCard.tsx**

```typescript
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Info } from 'lucide-react';

export const CourseRecommendationCard = ({ course, onApprove, onReject }) => {
  const stars = '★'.repeat(Math.round(course.recommendation_score * 5));

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="text-lg font-semibold">{course.course?.title}</h4>
          <p className="text-sm text-gray-600 mb-2">{course.course?.description}</p>

          <div className="flex gap-2 mb-3">
            <Badge variant="outline">{course.course?.level}</Badge>
            <Badge variant="outline">{course.course?.duration}</Badge>
            <Badge variant="secondary">{stars} ({course.recommendation_score.toFixed(2)})</Badge>
          </div>

          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm font-medium text-blue-900">Why this course?</p>
            <p className="text-sm text-blue-700">{course.recommendation_reason}</p>
          </div>

          {course.skill_gaps_addressed.length > 0 && (
            <div className="mt-2">
              <span className="text-xs text-gray-500">Addresses: </span>
              {course.skill_gaps_addressed.map(gap => (
                <Badge key={gap} variant="outline" className="mr-1">{gap}</Badge>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 ml-4">
          <Button
            size="sm"
            variant={course.user_approved === true ? "default" : "outline"}
            onClick={onApprove}
          >
            <CheckCircle className="w-4 h-4 mr-1" /> Keep
          </Button>
          <Button
            size="sm"
            variant={course.user_approved === false ? "destructive" : "outline"}
            onClick={onReject}
          >
            <XCircle className="w-4 h-4 mr-1" /> Remove
          </Button>
        </div>
      </div>
    </Card>
  );
};
```

---

## 🔗 INTEGRATION STEPS

### 1. Add Routes

In `src/App.tsx`, add routes:

```typescript
import { ProfileWorkflowWizard } from '@/components/profile-workflow/ProfileWorkflowWizard';
import { CurriculumBuilder } from '@/components/curriculum/CurriculumBuilder';

// Add routes
<Route path="/create-profile" element={<ProfileWorkflowWizard />} />
<Route path="/create-curriculum/:profileId" element={<CurriculumBuilder />} />
```

### 2. Add to Navigation

In main navigation, add:

```typescript
<Link to="/create-profile">
  <Button variant="outline">
    <User className="mr-2" /> Create Learning Profile
  </Button>
</Link>
```

### 3. Add to Profile Page

In `src/pages/Profile.tsx`, add a new tab:

```typescript
<TabsList>
  <TabsTrigger value="profile">Profile</TabsTrigger>
  <TabsTrigger value="learning-paths">Learning Paths</TabsTrigger> {/* NEW */}
  <TabsTrigger value="assessments">Assessments</TabsTrigger>
  ...
</TabsList>

<TabsContent value="learning-paths">
  <LearningPathsTab /> {/* Shows profiles + curricula */}
</TabsContent>
```

### 4. Onboarding Integration

In new user onboarding flow:

```typescript
// After email verification
if (user.is_new) {
  navigate('/create-profile');
}
```

---

## 🧪 TESTING

### Manual Testing Checklist

**Profile Workflow**:
- [ ] Can create new profile through 6-step wizard
- [ ] Form validation works on each step
- [ ] Can go back to previous steps
- [ ] Can skip optional step 5 (assessment)
- [ ] Profile is saved correctly
- [ ] Multiple profiles can be created
- [ ] Can set one as primary

**Curriculum Generation**:
- [ ] AI generates curriculum (wait 15-30s)
- [ ] Courses are grouped into modules
- [ ] Recommendation scores display correctly
- [ ] Can approve/reject courses
- [ ] Can publish curriculum
- [ ] Only approved courses remain after publish

**Integration**:
- [ ] Profile workflow accessible from nav
- [ ] Profile page shows learning paths tab
- [ ] Can generate curriculum from profile
- [ ] Enrollment works from curriculum

### Database Verification

```sql
-- Check profile created
SELECT * FROM learner_profiles WHERE user_id = 'YOUR_USER_ID';

-- Check curriculum generated
SELECT * FROM user_curricula WHERE profile_id = 'YOUR_PROFILE_ID';

-- Check courses recommended
SELECT * FROM curriculum_courses WHERE curriculum_id = 'YOUR_CURRICULUM_ID';

-- Check workflow progress
SELECT * FROM user_profile_workflow_progress WHERE user_id = 'YOUR_USER_ID';
```

---

## 📊 ROLLOUT PLAN

### Phase 1: Soft Launch (Week 1)
- Deploy to production
- Enable for admin users only
- Monitor logs and database
- Fix critical bugs

### Phase 2: Beta (Week 2)
- Enable for 10-20 beta users
- Collect feedback
- Refine AI algorithm based on approval rates
- Improve recommendation reasons

### Phase 3: Full Launch (Week 3)
- Add onboarding banner for all users
- Send email announcement
- Monitor metrics (profile completion rate, curriculum generation usage)
- Optimize based on usage patterns

---

## 📈 SUCCESS METRICS

Track these in analytics:

```javascript
// Example analytics events
analytics.track('Profile Workflow Started', { user_id });
analytics.track('Profile Workflow Step Completed', { step_order, time_spent });
analytics.track('Profile Created', { profile_id, has_assessment });
analytics.track('Curriculum Generated', { profile_id, courses_count, confidence_score });
analytics.track('Course Approved', { curriculum_id, course_id, score });
analytics.track('Curriculum Published', { curriculum_id, approved_count, rejected_count });
```

**Key Metrics**:
- Profile completion rate (target: 70%+)
- Average time to complete workflow (target: <15 min)
- Curriculum generation usage (target: 50% of profiles)
- Course approval rate (target: 60%+)
- Enrollment from curriculum (target: 40%+)

---

## 🐛 TROUBLESHOOTING

### Issue: Curriculum generation stuck

**Solution**: Check generation job status:
```sql
SELECT * FROM curriculum_generation_jobs WHERE status = 'processing' AND created_at < NOW() - INTERVAL '5 minutes';
```

Mark as failed if stuck:
```sql
UPDATE curriculum_generation_jobs
SET status = 'failed', error_message = 'Timeout'
WHERE id = 'JOB_ID';
```

### Issue: No courses recommended

**Possible causes**:
1. User has all courses enrolled already
2. No courses match profile audience
3. All courses filtered out by level mismatch

**Debug**:
```typescript
// Add logging in CurriculumGenerationService.filterEligibleCourses()
logger.info('Eligible courses after filtering:', eligibleCourses.length);
```

### Issue: Workflow step data lost

**Solution**: Check step_data in workflow progress:
```sql
SELECT step_data FROM user_profile_workflow_progress WHERE id = 'PROGRESS_ID';
```

Re-save if needed via service.

---

## 🎯 NEXT ENHANCEMENTS (Future)

1. **AI Improvements**:
   - Use GPT-4 for better recommendation reasons
   - Factor in course reviews/ratings
   - Consider user's past course performance

2. **Social Features**:
   - Share profiles with mentors
   - Curriculum templates marketplace
   - Peer-recommended courses

3. **Advanced Features**:
   - Schedule generation (auto-create calendar)
   - Progress notifications
   - Curriculum versioning (update with new courses)
   - Export to PDF

4. **Analytics Dashboard**:
   - Admin view of all profiles
   - Most common goals
   - Course recommendation heatmap
   - Completion funnels

---

## 📝 SUMMARY

✅ **What's Complete**:
- Full database schema (2 migrations)
- 3 complete service layers
- 2 custom React hooks
- Comprehensive documentation

📋 **What You Need to Build**:
- Profile Workflow UI (6 step components + wizard)
- Curriculum Builder UI (3-4 main components)
- Integration with navigation and Profile page

⏱️ **Estimated Time to Complete UI**: 8-12 hours

🚀 **Ready to Deploy**: Database migrations can be deployed now!

---

**Questions? Issues?** Check `docs/LEARNER_PROFILES_AND_CURRICULUM.md` for detailed system documentation.

**Happy Building! 🎉**
