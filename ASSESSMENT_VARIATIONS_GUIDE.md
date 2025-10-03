## Assessment Variations - Complete Implementation Guide

## 🎯 Overview

The Assessment Variations system provides multiple assessment experiences tailored to different learning goals: domain-specific assessments, certification tracks, practice vs. certification modes, timed challenges, and competitive leaderboards.

---

## 🏗️ Architecture

### Core Components

1. **Assessment Domains** - Specialized subject areas (AI for Marketing, Development, etc.)
2. **Certification Tracks** - Progressive certification levels (Foundation → Professional → Expert)
3. **Assessment Modes** - Practice, Certification, or Timed Challenge
4. **Leaderboards** - Competitive rankings (Global, Domain, Track, Challenge)
5. **Timed Challenges** - Time-bound competitive assessments

---

## 📚 1. Assessment Domains

### Predefined Domains

| Domain | Slug | Target Audience | Description |
|--------|------|----------------|-------------|
| **AI for Marketing** | `ai-marketing` | Professional, Business | Marketing automation, content creation, campaign optimization |
| **AI for Development** | `ai-development` | Professional, Secondary | AI-powered coding tools, code generation, software assistance |
| **AI for Data Science** | `ai-data-science` | Professional | Data analysis, visualization, predictive modeling |
| **AI for Content Creation** | `ai-content` | Professional, Business | AI writing, image, and video generation tools |
| **AI for Customer Service** | `ai-customer-service` | Professional, Business | AI chatbots and automation for customer support |
| **AI for Education** | `ai-education` | Professional, Secondary | AI tools for teaching, learning, and admin |

### Domain Schema

```typescript
interface AssessmentDomain {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string; // Lucide icon name
  color: string; // Hex color
  targetAudience: string[];
  industryTags: string[];
  difficultyRange: string;
  isActive: boolean;
  isPremium: boolean;
  requiresPrerequisites: boolean;
  coverImageUrl?: string;
  learningOutcomes: string[];
  estimatedDurationMinutes: number;
}
```

### Usage

```typescript
// Get all active domains
const { data: domains } = await supabase
  .from('assessment_domains')
  .select('*')
  .eq('is_active', true);

// Get specific domain
const { data: domain } = await supabase
  .from('assessment_domains')
  .select('*')
  .eq('slug', 'ai-marketing')
  .single();
```

---

## 🏆 2. Certification Tracks

### Progressive Levels

Each domain can have multiple certification levels:

1. **Foundation** - Entry-level certification (70% required)
2. **Professional** - Intermediate certification (80% required)
3. **Expert** - Advanced certification (85% required)
4. **Master** - Elite certification (90% required)

### Track Schema

```typescript
interface CertificationTrack {
  id: string;
  domainId: string;
  name: string;
  slug: string;
  level: 'foundation' | 'professional' | 'expert' | 'master';
  description: string;
  minScorePercentage: number;
  passingCriteria: object;
  prerequisiteTrackId?: string;
  totalQuestions: number;
  timeLimitMinutes: number;
  allowedAttempts: number;
  certificateTemplate: string;
  certificateValidityMonths?: number; // null = lifetime
  badgeImageUrl: string;
  certificateCodePrefix: string;
  isActive: boolean;
  isPremium: boolean;
}
```

### Example Tracks

```sql
-- AI Marketing Foundation
name: 'AI Marketing Foundation'
level: 'foundation'
min_score: 70%
time_limit: 45 min
code_prefix: 'AIMKT-F-'

-- AI Marketing Professional
name: 'AI Marketing Professional'
level: 'professional'
min_score: 80%
time_limit: 60 min
prerequisite: 'AI Marketing Foundation'
code_prefix: 'AIMKT-P-'
```

---

## 🎮 3. Assessment Modes

### Mode Types

#### **Practice Mode** 🎯
- **Purpose**: Learn without pressure
- **Features**:
  - No time limits
  - Can see correct answers immediately
  - Doesn't count towards certification
  - Can retry questions
  - Hints available
  - No leaderboard ranking

#### **Certification Mode** 📜
- **Purpose**: Earn official certification
- **Features**:
  - Strict time limits
  - No hints or help
  - Counts towards certification
  - Limited attempts (typically 3)
  - Proctored (future: webcam monitoring)
  - Official certificate on pass

#### **Timed Challenge Mode** ⚡
- **Purpose**: Competitive speed assessment
- **Features**:
  - Countdown timer
  - Leaderboard integration
  - Real-time rankings
  - Bonus points for speed
  - Challenge-specific rewards
  - Social sharing

### Mode Configuration

```typescript
interface AssessmentConfig {
  mode: 'practice' | 'certification' | 'timed_challenge';
  domainId?: string;
  certificationTrackId?: string;
  timeLimitSeconds?: number;
  showHints: boolean;
  showCorrectAnswers: boolean;
  allowRetry: boolean;
  updateLeaderboard: boolean;
}
```

---

## 📜 4. User Certifications

### Certification Award

When a user completes a certification assessment with a passing score, they receive:

1. **Unique Certificate Code** (e.g., `AIMKT-F-A7B3C9D2`)
2. **Digital Certificate PDF** (auto-generated)
3. **Badge Image** (for social sharing)
4. **Public Verification URL** (`/verify/AIMKT-F-A7B3C9D2`)
5. **Expiry Date** (if applicable)

### Certificate Schema

```typescript
interface UserCertification {
  id: string;
  userId: string;
  certificationTrackId: string;
  assessmentId: string;
  certificateCode: string; // Unique, verifiable
  issuedDate: Date;
  expiryDate?: Date; // null = lifetime
  finalScore: number;
  finalPercentage: number;
  abilityLevel: number;
  categoryScores: object;
  verificationUrl: string;
  certificatePdfUrl: string;
  badgeEarnedUrl: string;
  status: 'active' | 'expired' | 'revoked';
  revokedReason?: string;
}
```

### Awarding Certification

```sql
-- Automatic certification award on assessment completion
SELECT award_certification(
  p_user_id := 'user-uuid',
  p_assessment_id := 'assessment-uuid'
);
```

### Verification

```typescript
// Public verification endpoint
GET /verify/:certificateCode

// Returns:
{
  valid: true,
  holderName: "John Doe",
  trackName: "AI Marketing Professional",
  issuedDate: "2025-10-04",
  expiryDate: null,
  finalPercentage: 87.5,
  status: "active"
}
```

---

## 🏅 5. Leaderboards

### Leaderboard Types

1. **Global Leaderboard** - All users, all assessments
2. **Domain Leaderboard** - Top performers in specific domain
3. **Track Leaderboard** - Rankings for certification track
4. **Challenge Leaderboard** - Timed challenge participants

### Time Periods

- **Daily** - Resets every 24 hours
- **Weekly** - Monday to Sunday
- **Monthly** - Calendar month
- **All-Time** - Historical best

### Ranking Metrics

Primary: **Score** (total points earned)
Tiebreakers:
1. Time taken (faster = better)
2. Accuracy rate
3. Questions answered

### Leaderboard Schema

```typescript
interface LeaderboardEntry {
  id: string;
  userId: string;
  leaderboardType: 'global' | 'domain' | 'track' | 'timed_challenge';
  scopeId?: string; // domain_id or track_id
  score: number;
  percentage: number;
  timeTakenSeconds: number;
  questionsAnswered: number;
  accuracyRate: number;
  rank: number;
  percentile: number;
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  displayName: string;
  avatarUrl?: string;
  showInLeaderboard: boolean;
}
```

### Privacy Controls

Users can opt-in/out of leaderboards:

```sql
UPDATE leaderboard_entries
SET show_in_leaderboard = false
WHERE user_id = 'user-uuid';
```

---

## ⏱️ 6. Timed Challenges

### Challenge Structure

```typescript
interface TimedChallenge {
  id: string;
  domainId?: string;
  name: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  timeLimitSeconds: number; // e.g., 600 (10 minutes)
  startTime: Date;
  endTime: Date;
  questionCount: number;
  minQuestionsToComplete: number;
  rewardPoints: number;
  badgeImageUrl: string;
  hasLeaderboard: boolean;
  leaderboardPrizePool: object;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  isRecurring: boolean;
  recurrencePattern?: string;
}
```

### Example Challenges

**Daily Sprint**
- Duration: 10 minutes
- Questions: 20
- Recurring: Daily at 9 AM
- Reward: 100 points
- Leaderboard: Top 10 win badges

**Weekly Mastery**
- Duration: 30 minutes
- Questions: 50
- Recurring: Every Monday
- Reward: 500 points
- Prizes: Top 3 get premium courses

### Challenge Lifecycle

1. **Scheduled** → Challenge announced, users can register
2. **Active** → Challenge is live, users can participate
3. **Completed** → Challenge ended, leaderboard finalized
4. **Cancelled** → Challenge cancelled (rare)

---

## 💻 UI Components

### 1. DomainSelector.tsx

```tsx
<DomainSelector
  onSelect={(domain) => startDomainAssessment(domain)}
  showPremiumOnly={false}
/>
```

Features:
- Grid or list view
- Filter by audience, industry
- Show premium badges
- Display learning outcomes
- Show estimated duration

---

### 2. CertificationTrackView.tsx

```tsx
<CertificationTrackView
  domainSlug="ai-marketing"
  showProgress={true}
/>
```

Features:
- Progressive track visualization
- Current level indicator
- Next certification requirements
- Prerequisite checking
- Attempt tracking
- Certificate gallery

---

### 3. AssessmentModeSelector.tsx

```tsx
<AssessmentModeSelector
  onModeSelect={(mode, config) => startAssessment(mode, config)}
  availableModes={['practice', 'certification']}
/>
```

Features:
- Mode comparison table
- Feature highlights
- Prerequisite warnings
- Attempt counter
- Mode-specific instructions

---

### 4. TimedChallengeCard.tsx

```tsx
<TimedChallengeCard
  challenge={challenge}
  onJoin={() => joinChallenge(challenge.id)}
/>
```

Features:
- Countdown timer
- Participant count
- Reward display
- Difficulty badge
- Join/Register button
- Past results (if recurring)

---

### 5. Leaderboard.tsx

```tsx
<Leaderboard
  type="domain"
  scopeId={domainId}
  period="weekly"
  highlightCurrentUser={true}
/>
```

Features:
- Podium for top 3
- User rankings with avatars
- Score/time display
- Rank badges (🥇🥈🥉)
- Current user highlight
- Pagination
- Real-time updates

---

### 6. CertificateView.tsx

```tsx
<CertificateView
  certificationId={certId}
  allowDownload={true}
  allowShare={true}
/>
```

Features:
- Certificate preview
- Download PDF
- Social share buttons
- QR code for verification
- Badge display
- LinkedIn integration

---

## 🔄 Assessment Flow

### Practice Mode Flow

```
1. Select Domain → 2. Choose Practice Mode → 3. Start Assessment
   ↓                   ↓                        ↓
4. Answer Questions → 5. See Immediate Feedback → 6. Review Results
   (No time limit)     (With explanations)         (With insights)
```

### Certification Mode Flow

```
1. Select Domain → 2. Choose Track (Foundation/Pro/Expert)
   ↓                   ↓
3. Check Prerequisites → 4. Review Requirements
   ↓                        ↓
5. Start Certification → 6. Timed Assessment (No hints)
   ↓                        ↓
7. Submit Assessment → 8. Calculate Score → 9. Award Certificate (if passed)
   ↓                                            ↓
10. View Results + Certificate              Share & Verify
```

### Timed Challenge Flow

```
1. Browse Active Challenges → 2. Join Challenge
   ↓                              ↓
3. Wait for Start Time → 4. Countdown Timer
   ↓                        ↓
5. Speed Assessment → 6. Real-time Leaderboard Updates
   ↓                     ↓
7. Submit → 8. Final Ranking → 9. Reward Distribution
```

---

## 📊 Database Functions

### Award Certification

```sql
SELECT award_certification(
  p_user_id := 'uuid',
  p_assessment_id := 'uuid'
);
```

Auto-generates:
- Unique certificate code
- Verification URL
- Expiry date (if applicable)

### Update Leaderboard

```sql
SELECT update_leaderboard(
  p_user_id := 'uuid',
  p_assessment_id := 'uuid'
);
```

Updates:
- Global leaderboard
- Domain leaderboard (if applicable)
- Track leaderboard (if certification mode)
- Challenge leaderboard (if timed challenge)

### Generate Certificate Code

```sql
SELECT generate_certificate_code('track-uuid');
-- Returns: 'AIMKT-F-A7B3C9D2'
```

---

## 🎨 Branding & Design

### Domain Colors

Each domain has a unique color for branding:

- **AI for Marketing**: `#FF6B6B` (Red)
- **AI for Development**: `#4ECDC4` (Teal)
- **AI for Data Science**: `#95E1D3` (Mint)
- **AI for Content Creation**: `#F38181` (Pink)
- **AI for Customer Service**: `#AA96DA` (Purple)
- **AI for Education**: `#FCBAD3` (Rose)

### Certificate Templates

Templates include:
- Professional design with domain branding
- QR code for verification
- User name and score
- Issue and expiry dates
- Unique certificate code
- Digital signature

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation ✅
- ✅ Database schema
- ✅ Domain and track setup
- ✅ SQL functions
- ⏳ Basic UI components

### Phase 2: Core Features
- DomainSelector component
- CertificationTrackView component
- AssessmentModeSelector component
- Certificate generation

### Phase 3: Competitive Features
- Leaderboard component
- TimedChallenge component
- Real-time rankings
- Challenge scheduling

### Phase 4: Premium Features
- Certificate PDF generation
- Verification system
- Social sharing
- LinkedIn integration
- Advanced analytics

---

## 📈 Usage Examples

### Start Domain Assessment

```typescript
// Practice mode
await startAssessment({
  mode: 'practice',
  domainId: 'ai-marketing-domain-id',
  showHints: true,
  showCorrectAnswers: true
});

// Certification mode
await startAssessment({
  mode: 'certification',
  certificationTrackId: 'ai-marketing-pro-id',
  timeLimitSeconds: 3600,
  attemptNumber: 1
});

// Timed challenge
await startAssessment({
  mode: 'timed_challenge',
  challengeId: 'daily-sprint-id',
  timeLimitSeconds: 600
});
```

---

## 🎯 Benefits

### For Learners
- ✅ Clear certification paths
- ✅ Domain-specific learning
- ✅ Multiple practice options
- ✅ Gamification via leaderboards
- ✅ Verifiable credentials

### For Platform
- ✅ Premium monetization (certification fees)
- ✅ Increased engagement
- ✅ Professional credibility
- ✅ Community building (leaderboards)
- ✅ Partnership opportunities (industry certifications)

---

**Last Updated**: October 4, 2025
**Version**: 1.0.0
**Status**: Database & Functions Complete ✅

**Next Steps**: Build UI components
