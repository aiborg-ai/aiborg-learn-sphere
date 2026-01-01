# Component Refactoring Plan

## Overview

This document outlines the strategy for breaking down large components (1000+ lines) into smaller,
more maintainable pieces following React best practices.

## Components to Refactor

### 1. WebhookManager.tsx (1,035 lines)

**Location**: `src/components/admin/webhooks/WebhookManager.tsx`

**Current Responsibilities**:

- Webhook CRUD operations
- Delivery history management
- UI for webhook list, forms, testing
- Data fetching from Supabase

**Proposed Structure**:

```
src/components/admin/webhooks/
├── WebhookManager.tsx (main coordinator, ~150 lines)
├── hooks/
│   └── useWebhookData.ts (data fetching & state, ~200 lines)
├── components/
│   ├── WebhookList.tsx (webhook table, ~150 lines)
│   ├── WebhookForm.tsx (create/edit dialog, ~200 lines)
│   ├── WebhookTestDialog.tsx (test functionality, ~100 lines)
│   ├── DeliveryHistory.tsx (delivery table, ~150 lines)
│   └── DeliveryDetails.tsx (delivery detail view, ~100 lines)
├── types.ts (shared types, ~50 lines)
└── utils.ts (helper functions, ~50 lines)
```

**Refactoring Steps**:

1. Extract types and constants to `types.ts`
2. Create `useWebhookData` hook for all data operations
3. Extract `WebhookList` component (table + actions)
4. Extract `WebhookForm` component (create/edit dialog)
5. Extract `WebhookTestDialog` component
6. Extract `DeliveryHistory` component
7. Extract `DeliveryDetails` component
8. Update main `WebhookManager` to compose sub-components

**Benefits**:

- Each component has single responsibility
- Easier to test individual pieces
- Better code reusability
- Reduced cognitive load
- Clearer separation of concerns

---

### 2. FamilyMembershipEnrollment.tsx (1,095 lines)

**Location**: `src/pages/FamilyMembershipEnrollment.tsx`

**Current Responsibilities**:

- Multi-step enrollment wizard
- Family member management
- Payment integration
- Form validation and submission

**Proposed Structure**:

```
src/pages/FamilyMembershipEnrollment/
├── index.tsx (main coordinator, ~100 lines)
├── hooks/
│   ├── useEnrollmentWizard.ts (wizard state, ~150 lines)
│   └── useFamilyMembers.ts (member management, ~100 lines)
├── steps/
│   ├── PlanSelectionStep.tsx (~150 lines)
│   ├── FamilyMembersStep.tsx (~200 lines)
│   ├── BillingInformationStep.tsx (~150 lines)
│   └── ReviewStep.tsx (~100 lines)
├── components/
│   ├── FamilyMemberForm.tsx (~150 lines)
│   ├── WizardNavigation.tsx (~80 lines)
│   └── PlanCard.tsx (~80 lines)
└── types.ts (~50 lines)
```

**Refactoring Steps**:

1. Extract wizard navigation logic to `useEnrollmentWizard` hook
2. Create step components (PlanSelection, FamilyMembers, Billing, Review)
3. Extract reusable form components (FamilyMemberForm, PlanCard)
4. Create shared types file
5. Update main component to orchestrate wizard flow

**Benefits**:

- Each step is independently testable
- Wizard logic reusable for other flows
- Easier to modify individual steps
- Better UX consistency
- Reduced bundle size per lazy-loaded step

---

### 3. useAIReadinessAssessment.ts (1,124 lines)

**Location**: `src/hooks/useAIReadinessAssessment.ts`

**Current Responsibilities**:

- Assessment state management
- Question navigation
- Answer validation
- Score calculation
- Adaptive testing logic
- Results generation

**Proposed Structure**:

```
src/hooks/aiReadinessAssessment/
├── index.ts (main hook export, ~100 lines)
├── useAssessmentState.ts (state management, ~150 lines)
├── useQuestionNavigation.ts (nav logic, ~100 lines)
├── useAdaptiveTesting.ts (CAT algorithm, ~200 lines)
├── useScoring.ts (score calculation, ~150 lines)
├── useResults.ts (results generation, ~100 lines)
├── types.ts (shared types, ~100 lines)
└── utils/
    ├── scoreCalculator.ts (~150 lines)
    └── adaptiveAlgorithm.ts (~150 lines)
```

**Refactoring Steps**:

1. Extract types to dedicated file
2. Create `useAssessmentState` for state management
3. Extract navigation logic to `useQuestionNavigation`
4. Move CAT algorithm to `useAdaptiveTesting`
5. Extract scoring to `useScoring` and utilities
6. Create `useResults` for result generation
7. Compose hooks in main index file

**Benefits**:

- Each hook has focused responsibility
- Easier to test algorithms independently
- Can reuse hooks for different assessment types
- Better performance (memoization opportunities)
- Clearer data flow

---

## Refactoring Principles

### 1. Single Responsibility Principle

Each component/hook should have one clear purpose.

### 2. Composition Over Inheritance

Build complex UIs by composing smaller components.

### 3. Extract Custom Hooks

Move stateful logic and side effects to custom hooks.

### 4. Co-locate Related Code

Keep components, hooks, types together in feature folders.

### 5. Progressive Enhancement

Refactor incrementally without breaking existing functionality.

### 6. Maintain Test Coverage

Write tests for extracted components before refactoring.

## Implementation Priority

### Phase 1: High Impact, Low Risk

1. **Extract types and constants** from all three components
2. **Create custom hooks** for data fetching

### Phase 2: UI Component Extraction

1. WebhookManager → Extract list and form components
2. FamilyMembershipEnrollment → Extract step components

### Phase 3: Complex Logic Separation

1. useAIReadinessAssessment → Extract algorithm utilities
2. All components → Extract helper functions to utils

### Phase 4: Polish and Optimize

1. Add PropTypes/TypeScript strict types
2. Add component-level tests
3. Document component APIs
4. Optimize re-renders with React.memo

## Success Metrics

- ✅ No component/hook exceeds 500 lines
- ✅ Each component has < 5 responsibilities
- ✅ Test coverage maintained or improved
- ✅ No functionality regressions
- ✅ Bundle size unchanged or reduced
- ✅ Lighthouse performance score maintained

## Template: Component Extraction Checklist

For each component to extract:

- [ ] Identify clear responsibility boundary
- [ ] Create new file with descriptive name
- [ ] Extract relevant JSX/logic
- [ ] Define clear prop interface
- [ ] Add TypeScript types
- [ ] Import and use in parent component
- [ ] Verify functionality unchanged
- [ ] Add basic tests
- [ ] Update documentation
- [ ] Commit changes

## Notes

- All refactoring should be done in feature branches
- Each extracted component should be committed separately
- Maintain backward compatibility during transition
- Document any API changes in component comments
- Consider using Storybook for component documentation

---

**Last Updated**: 2026-01-01 **Status**: Planning Phase **Next Steps**: Begin Phase 1 with type
extraction
