# Feature Flags

This document describes the feature flags available in the AIBORG Learning Platform and how to
configure them.

## Available Feature Flags

### `VITE_USE_ADAPTIVE_ASSESSMENT`

**Type**: Boolean (string) **Default**: `true` **Location**: `.env.local`, `.env.example`

Controls which AI assessment engine is used for user evaluations.

#### Values:

- `true` - Use **Adaptive Assessment** (CAT - Computerized Adaptive Testing)
  - Dynamic difficulty adjustment based on user performance
  - Requires user authentication
  - Uses IRT (Item Response Theory) for precise ability estimation
  - Typically 15-20 questions with early termination

- `false` - Use **Standard Assessment**
  - Fixed question set
  - Allows guest access (with confirmation)
  - Linear progression through all questions
  - Typically 30-40 questions

#### Configuration:

**Local Development:**

```bash
# .env.local
VITE_USE_ADAPTIVE_ASSESSMENT=true
```

**Production (Vercel):**

1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add: `VITE_USE_ADAPTIVE_ASSESSMENT` = `true`
3. Redeploy for changes to take effect

#### Implementation Details:

**File**: `src/pages/AIAssessment.tsx`

```typescript
// Feature flag: read from environment variable
// Defaults to true if not set
const USE_ADAPTIVE_ASSESSMENT = import.meta.env.VITE_USE_ADAPTIVE_ASSESSMENT !== 'false';
```

The flag determines which component is rendered:

- `true` → `<AIAssessmentWizardAdaptive />`
- `false` → `<AIAssessmentWizard />`

#### Assessment Flow Comparison:

| Feature             | Adaptive (true)                    | Standard (false)                        |
| ------------------- | ---------------------------------- | --------------------------------------- |
| **Authentication**  | Required (database needed for CAT) | Optional (guest mode with confirmation) |
| **Questions**       | 15-20 (dynamic)                    | 30-40 (fixed)                           |
| **Difficulty**      | Adapts to user                     | Static progression                      |
| **Duration**        | 10-15 minutes                      | 15-20 minutes                           |
| **Early Exit**      | Yes (when confident)               | No                                      |
| **Precision**       | High (IRT-based)                   | Standard                                |
| **SME Routing**     | ✅ Supported                       | ✅ Supported                            |
| **Progress Saving** | Real-time to database              | Session-based only (guest)              |

**Note on Authentication**: The adaptive assessment requires authentication because it needs to save
real-time progress and ability estimates to the database for the computerized adaptive algorithm to
work correctly. The standard assessment can work in guest mode since it follows a fixed question
sequence.

#### SME (Business) Routing:

Both assessment variants support automatic routing to the company assessment:

- When a user selects "SMEs" (business) in profiling questionnaire
- They are redirected to `/sme-assessment` (9-section company evaluation)
- This applies regardless of the `USE_ADAPTIVE_ASSESSMENT` setting

---

## Adding New Feature Flags

When adding a new feature flag:

1. **Add to `.env.example`** with documentation:

   ```bash
   # Feature description
   # Accepted values: value1, value2
   VITE_YOUR_FEATURE_FLAG=default_value
   ```

2. **Add to `.env.local`** for local development

3. **Add to Vercel** environment variables for production

4. **Document here** with:
   - Purpose and impact
   - Accepted values
   - Default behavior
   - Implementation location

5. **Use in code**:
   ```typescript
   const FEATURE_ENABLED = import.meta.env.VITE_YOUR_FEATURE_FLAG === 'true';
   ```

## Best Practices

✅ **DO:**

- Use environment variables for feature toggles
- Document all flags in this file
- Provide sensible defaults
- Test both enabled/disabled states
- Remove flags after feature is stable

❌ **DON'T:**

- Hardcode feature flags in source code
- Use flags for configuration (use proper env vars instead)
- Leave unused flags in production
- Forget to update Vercel environment

---

**Last Updated**: October 2025 **Maintainer**: AIBORG Development Team
