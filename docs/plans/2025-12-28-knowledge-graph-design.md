# Knowledge Graph System Design

**Date**: 2025-12-28 **Status**: Approved - Ready for Implementation **Tech Stack**: React +
TypeScript, Supabase (PostgreSQL)

---

## Executive Summary

Build a comprehensive knowledge graph system that tracks:

- Relationships between learning concepts
- Prerequisite chains for learning paths
- Skill hierarchies and taxonomies
- User mastery levels with evidence-based tracking

**Key Features:**

- Smart learning path recommendations
- Prerequisite validation before course enrollment
- Skill mastery tracking (Beginner → Intermediate → Advanced → Mastered)
- AI-assisted graph creation and enrichment
- Admin UI for graph management
- Future: Interactive visualization

---

## Design Decisions

### Granularity: Hybrid Approach

- **Course-level**: Courses remain the primary learning unit
- **Concept-level**: Reusable concepts/skills that can appear in multiple courses
- Example: "Python Lists" concept appears in both "Python Basics" and "Data Structures" courses

### Relationship Types: Rich Graph

- `prerequisite`: Must learn A before B (directed)
- `related_to`: Similar/complementary concepts (undirected)
- `part_of`: Hierarchical parent-child (directed)
- `builds_on`: Enhancement/extension of concept (directed)
- `alternative_to`: Different approach to same goal (undirected)

### Mastery Model: Hybrid Evidence-Based

- **Display**: Levels (None, Beginner, Intermediate, Advanced, Mastered)
- **Calculate**: From evidence points with configurable weights
- **Evidence types**: Course completions, assessments, practice, time spent
- **Decay**: Recent evidence weighted more heavily

### Population Strategy: Hybrid AI-Assisted

- **Import**: Extract concepts from existing course data
- **AI-Assist**: Generate suggestions for concepts and relationships
- **Manual**: Admin review, refinement, and enrichment

### Implementation: Backend First, UI Later

- **Phase 1-5**: Build graph logic, admin tools, integrations
- **Phase 6**: Add student-facing visualization (future)

---

## Database Schema

### Core Tables

#### 1. `concepts` (Graph Nodes)

```sql
CREATE TABLE public.concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) UNIQUE NOT NULL,
  description TEXT,
  type VARCHAR(50) NOT NULL CHECK (type IN ('skill', 'topic', 'technology', 'technique')),
  difficulty_level VARCHAR(20) NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_hours DECIMAL(5,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_concepts_type ON concepts(type);
CREATE INDEX idx_concepts_difficulty ON concepts(difficulty_level);
CREATE INDEX idx_concepts_active ON concepts(is_active);
CREATE INDEX idx_concepts_slug ON concepts(slug);
```

#### 2. `concept_relationships` (Graph Edges)

```sql
CREATE TABLE public.concept_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  target_concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  relationship_type VARCHAR(50) NOT NULL CHECK (
    relationship_type IN ('prerequisite', 'related_to', 'part_of', 'builds_on', 'alternative_to')
  ),
  strength DECIMAL(3,2) DEFAULT 0.5 CHECK (strength BETWEEN 0 AND 1),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent self-relationships
  CHECK (source_concept_id != target_concept_id),

  -- Unique relationship per type between two concepts
  UNIQUE(source_concept_id, target_concept_id, relationship_type)
);

CREATE INDEX idx_relationships_source ON concept_relationships(source_concept_id);
CREATE INDEX idx_relationships_target ON concept_relationships(target_concept_id);
CREATE INDEX idx_relationships_type ON concept_relationships(relationship_type);
CREATE INDEX idx_relationships_active ON concept_relationships(is_active);

-- Index for graph traversal queries
CREATE INDEX idx_relationships_source_type ON concept_relationships(source_concept_id, relationship_type);
CREATE INDEX idx_relationships_target_type ON concept_relationships(target_concept_id, relationship_type);
```

#### 3. `course_concepts` (Links Courses to Concepts)

```sql
CREATE TABLE public.course_concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  coverage_level VARCHAR(20) NOT NULL CHECK (
    coverage_level IN ('introduces', 'covers', 'masters')
  ),
  order_index INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  weight DECIMAL(3,2) DEFAULT 0.5 CHECK (weight BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(course_id, concept_id)
);

CREATE INDEX idx_course_concepts_course ON course_concepts(course_id);
CREATE INDEX idx_course_concepts_concept ON course_concepts(concept_id);
CREATE INDEX idx_course_concepts_primary ON course_concepts(is_primary);
```

#### 4. `user_concept_mastery` (Evidence-Based Tracking)

```sql
CREATE TABLE public.user_concept_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  concept_id UUID NOT NULL REFERENCES concepts(id) ON DELETE CASCADE,
  mastery_level VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (
    mastery_level IN ('none', 'beginner', 'intermediate', 'advanced', 'mastered')
  ),
  evidence JSONB DEFAULT '[]'::jsonb,
  -- Evidence format:
  -- [
  --   {"type": "course_completion", "course_id": "...", "score": 0.95, "date": "2025-01-15"},
  --   {"type": "assessment", "assessment_id": "...", "score": 0.85, "date": "2025-01-20"},
  --   {"type": "practice", "exercise_id": "...", "attempts": 3, "success": true, "date": "2025-01-22"}
  -- ]
  last_practiced TIMESTAMPTZ,
  confidence_score DECIMAL(3,2) DEFAULT 0 CHECK (confidence_score BETWEEN 0 AND 1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, concept_id)
);

CREATE INDEX idx_user_mastery_user ON user_concept_mastery(user_id);
CREATE INDEX idx_user_mastery_concept ON user_concept_mastery(concept_id);
CREATE INDEX idx_user_mastery_level ON user_concept_mastery(mastery_level);
CREATE INDEX idx_user_mastery_user_level ON user_concept_mastery(user_id, mastery_level);
```

---

## Mastery Calculation Algorithm

### Evidence Weights (Configurable)

```typescript
const EVIDENCE_WEIGHTS = {
  course_completion: 0.4, // Completing a course covering this concept
  assessment: 0.35, // Quiz/test scores
  practice: 0.15, // Hands-on exercises
  time_spent: 0.1, // Engagement time
};
```

### Recency Decay

- Evidence < 6 months: Full weight (1.0x)
- Evidence 6-12 months: Reduced weight (0.8x)
- Evidence > 12 months: Half weight (0.5x)

### Score to Level Mapping

```typescript
const MASTERY_THRESHOLDS = {
  none: [0.0, 0.2],
  beginner: [0.2, 0.5],
  intermediate: [0.5, 0.75],
  advanced: [0.75, 0.9],
  mastered: [0.9, 1.0],
};
```

### Confidence Calculation

- Based on number of evidence points
- 1 point = 0.3 confidence
- 3 points = 0.7 confidence
- 5+ points = 1.0 confidence

---

## Services Architecture

### `KnowledgeGraphService.ts`

Core graph operations:

- `getConcept(id)` - Get concept with all relationships
- `getPrerequisiteChain(id)` - Recursive prerequisite lookup
- `getDependents(id)` - What depends on this concept
- `getRelatedConcepts(id, type?)` - Filter by relationship type
- `validateGraph()` - Check for circular dependencies
- `findLearningPath(from, to)` - Shortest path between concepts

### `UserMasteryService.ts`

Mastery tracking:

- `getMastery(userId, conceptId)` - Get current mastery
- `addEvidence(userId, conceptId, evidence)` - Record evidence point
- `recalculateMastery(userId, conceptId)` - Update mastery from evidence
- `getMasteredConcepts(userId)` - All mastered concepts
- `getMasterySummary(userId)` - Aggregate by skill family

### `LearningRecommendationService.ts`

Smart recommendations:

- `getRecommendations(userId, options)` - Top N suggestions
- `findReadyConcepts(userId)` - Prerequisites met, not mastered
- `calculateRecommendationScore(concept, context)` - Multi-factor scoring
  - Relationship strength (30%)
  - Natural progression (25%)
  - User preferences (20%)
  - Popularity (15%)
  - Skill gap filling (10%)

---

## Integration Points

### Course Enrollment

```typescript
// Check prerequisites before enrollment
const validation = await validatePrerequisites(userId, courseConcepts);
if (!validation.allowed) {
  // Block enrollment, suggest prerequisite courses
}
```

### Assessment Completion

```typescript
// Add evidence when user completes quiz
await UserMasteryService.addEvidence(userId, conceptId, {
  type: 'assessment',
  score: quizScore,
  date: new Date(),
});
```

### Course Completion

```typescript
// Update mastery for all concepts in course
for (const { concept, coverage_level } of courseConcepts) {
  const weight = coverageLevelWeights[coverage_level];
  await addEvidence(userId, concept.id, {
    type: 'course_completion',
    score: finalScore * weight,
  });
}
```

### Dashboard

- Show "Ready to Learn" recommendations
- Display mastery badges
- Show prerequisite locks on courses
- Skill family progress bars

---

## Admin UI Components

Add "Knowledge Graph" tab to admin dashboard with 4 sub-tabs:

### 1. Concepts Manager

- Table: Name, Type, Difficulty, # Relationships, # Courses
- CRUD operations
- Bulk import/export (CSV, JSON)
- AI-generate button
- Search & filter

### 2. Relationships Manager

- Visual relationship editor
- Add relationships (drag-drop or form)
- Edit relationship properties
- Validation (prevent circular prereqs)
- Auto-suggest related concepts

### 3. Course Mapping

- Map concepts to courses
- Set coverage levels
- Set weights and order
- Preview concept distribution

### 4. Graph Analytics

- Total concepts/relationships stats
- Most connected concepts (hubs)
- Orphaned concepts (no relationships)
- Prerequisite chain depths
- Coverage gaps
- Circular dependency checker

---

## AI-Assisted Population

### Import from Existing Courses

Extract concepts from:

- `keywords` array → concept nodes
- `category` field → parent concepts
- `prerequisites` text → parse relationships

### AI Suggestion Endpoint

```typescript
// Input: Course ID or concept name
// Output: Suggested graph structure
{
  "suggested_concepts": [
    {
      "name": "List Comprehensions",
      "type": "technique",
      "description": "...",
      "difficulty": "intermediate",
      "estimated_hours": 2
    }
  ],
  "suggested_relationships": [
    {
      "from": "Lists",
      "to": "List Comprehensions",
      "type": "prerequisite",
      "strength": 0.9,
      "rationale": "Must understand lists first"
    }
  ],
  "suggested_hierarchy": {
    "Python": {
      "Data Structures": ["Lists", "Tuples", "Dictionaries"],
      "Advanced": ["List Comprehensions", "Decorators"]
    }
  }
}
```

### Admin Review Workflow

- Review AI suggestions
- Approve/reject/edit
- Bulk approve
- Manual additions
- Export/import for backup

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)

- Create database migration
- Build core services
- Add RLS policies
- Seed test data
- Unit tests

### Phase 2: Admin UI (Week 3-4)

- Knowledge Graph admin tab
- Concepts Manager
- Relationships Manager
- Manual CRUD operations

### Phase 3: AI Population (Week 5)

- AI suggestion endpoint
- Import from existing courses
- Admin review workflow
- Populate initial graph

### Phase 4: Integration (Week 6-7)

- Link concepts to courses
- Enrollment prerequisite checks
- Assessment evidence tracking
- Course completion updates
- Feature flag

### Phase 5: Recommendations (Week 8)

- Recommendation engine
- Dashboard integration
- "Recommended for You" section
- A/B testing

### Phase 6: Visualization (Future)

- Interactive graph UI
- Student skill tree
- Gamification
- Public profiles

---

## Success Metrics

### Phase 1-3 (Foundation)

- ✅ 50-100 concepts created
- ✅ 200+ relationships defined
- ✅ All courses mapped to concepts
- ✅ Zero circular dependencies

### Phase 4-5 (Integration)

- ✅ Prerequisite validation working
- ✅ Mastery tracking accurate
- ✅ Recommendations relevant (>70% click-through)
- ✅ No breaking changes to existing features

### Phase 6 (Future)

- ✅ Student engagement with graph +30%
- ✅ Course completion rate +15%
- ✅ User satisfaction score >4.5/5

---

## Risk Mitigation

### Circular Dependencies

- Validation function prevents cycles
- Admin UI shows warnings
- Graph traversal has max depth limit

### Performance

- Indexes on all foreign keys
- Cache mastery calculations
- Lazy load relationships
- Limit graph depth (max 10 levels)

### Data Quality

- AI suggestions require admin approval
- Validation rules in database
- Regular graph audits
- Easy rollback with feature flag

### Backward Compatibility

- All features are additive
- Courses work without concepts
- Gradual rollout
- Feature flag for instant disable

---

## Future Enhancements

- Visual graph editor (drag-drop nodes)
- Public skill profiles (share on LinkedIn)
- Skill-based job matching
- Learning style adaptation
- Concept difficulty auto-adjustment
- Multi-language concept names
- Community-contributed concepts
- External skill API integration

---

## Technical Notes

### Graph Traversal

Use recursive CTEs for efficient queries:

```sql
WITH RECURSIVE prereq_chain AS (
  SELECT source_concept_id, target_concept_id, 1 as depth
  FROM concept_relationships
  WHERE target_concept_id = $1 AND relationship_type = 'prerequisite'

  UNION ALL

  SELECT cr.source_concept_id, cr.target_concept_id, pc.depth + 1
  FROM concept_relationships cr
  JOIN prereq_chain pc ON cr.target_concept_id = pc.source_concept_id
  WHERE pc.depth < 10 AND cr.relationship_type = 'prerequisite'
)
SELECT * FROM prereq_chain;
```

### Caching Strategy

- Cache mastery calculations (5 min TTL)
- Cache recommendation results (1 hour TTL)
- Cache prerequisite chains (24 hour TTL)
- Invalidate on evidence addition

### Security (RLS)

- Admins: Full CRUD on concepts/relationships
- Users: Read-only on concepts
- Users: CRUD own mastery records only

---

## Conclusion

This knowledge graph system provides:

- ✅ Structured learning paths with prerequisites
- ✅ Granular skill tracking and mastery
- ✅ Smart recommendations based on user progress
- ✅ Flexible, extensible graph structure
- ✅ AI-assisted graph creation
- ✅ Zero breaking changes to existing platform

**Ready to implement in phases, starting with database foundation.**
