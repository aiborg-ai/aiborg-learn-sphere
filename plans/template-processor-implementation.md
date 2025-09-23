# Template Processing System - Implementation Plan

## Phase 1: Foundation (Week 1)

### 1.1 Validation Schemas
**Location**: `src/lib/schemas/`

#### Files to Create:
```
src/lib/schemas/
├── course-template.schema.ts
├── event-template.schema.ts
├── common.schema.ts
└── index.ts
```

#### Implementation:
```typescript
// course-template.schema.ts
import { z } from 'zod';

export const CourseTemplateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  audiences: z.array(z.enum(['Primary', 'Secondary', 'Professional', 'Business'])).min(1),
  mode: z.enum(['Online', 'Offline', 'Hybrid']),
  duration: z.string(),
  price: z.string(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  start_date: z.string(),
  features: z.array(z.string()).min(1),
  category: z.string(),
  keywords: z.array(z.string()),
  prerequisites: z.string().default('None'),
  is_active: z.boolean().default(true),
  currently_enrolling: z.boolean().default(true),
  display: z.boolean().default(true),
  sort_order: z.number().default(0),
  course_materials: z.array(CourseMaterialSchema).optional(),
  instructor_info: InstructorSchema.optional(),
  batch_info: BatchInfoSchema.optional(),
  schedule: ScheduleSchema.optional()
});

export type CourseTemplate = z.infer<typeof CourseTemplateSchema>;
```

### 1.2 Validation Service
**Location**: `src/services/template/`

#### Files to Create:
```
src/services/template/
├── validator.service.ts
├── processor.service.ts
├── import-manager.service.ts
└── index.ts
```

#### Key Functions:
- `validateCourseTemplate(data: unknown): ValidationResult`
- `validateEventTemplate(data: unknown): ValidationResult`
- `validateBatch(data: unknown[], type: TemplateType): BatchValidationResult`
- `checkDuplicates(templates: Template[]): DuplicateCheckResult`

## Phase 2: Database Layer (Week 1)

### 2.1 Supabase Migrations
**Location**: `supabase/migrations/`

#### New Tables:
```sql
-- Template import history
CREATE TABLE template_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  import_type TEXT CHECK (import_type IN ('course', 'event')),
  file_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_count INTEGER NOT NULL DEFAULT 0,
  success_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  errors JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Template import items
CREATE TABLE template_import_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  import_id UUID REFERENCES template_imports(id) ON DELETE CASCADE,
  item_index INTEGER NOT NULL,
  item_type TEXT CHECK (item_type IN ('course', 'event')),
  item_data JSONB NOT NULL,
  status TEXT CHECK (status IN ('pending', 'valid', 'invalid', 'imported')),
  validation_errors JSONB,
  result_id INTEGER, -- References course.id or event.id
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Database Functions
**Location**: `supabase/functions/database/`

#### Functions to Create:
- `import_course_from_template(template JSONB): course_id`
- `import_event_from_template(template JSONB): event_id`
- `validate_course_dependencies(template JSONB): validation_result`
- `check_course_duplicates(title TEXT, start_date TEXT): boolean`

### 2.3 Edge Functions
**Location**: `supabase/functions/`

#### New Functions:
```
supabase/functions/
├── validate-template/
│   └── index.ts
├── import-template/
│   └── index.ts
└── get-import-history/
    └── index.ts
```

## Phase 3: API Layer (Week 2)

### 3.1 API Routes
**Location**: `src/api/admin/templates/`

#### Endpoints:
```typescript
// src/api/admin/templates/routes.ts
export const templateRoutes = {
  validate: '/api/admin/templates/validate',
  import: '/api/admin/templates/import',
  preview: '/api/admin/templates/preview',
  history: '/api/admin/templates/history',
  download: '/api/admin/templates/download/:type',
  retry: '/api/admin/templates/retry/:importId'
};
```

### 3.2 API Hooks
**Location**: `src/hooks/templates/`

#### Custom Hooks:
```typescript
// useTemplateImport.ts
export function useTemplateImport() {
  const validateTemplate = useMutation({...});
  const importTemplate = useMutation({...});
  const getImportHistory = useQuery({...});

  return {
    validateTemplate,
    importTemplate,
    getImportHistory
  };
}
```

## Phase 4: UI Components (Week 2)

### 4.1 Component Structure
**Location**: `src/components/admin/template-import/`

#### Components Tree:
```
src/components/admin/template-import/
├── TemplateImportModal.tsx
├── TemplateUploader.tsx
├── TemplateValidator.tsx
├── TemplatePreview.tsx
├── ImportProgress.tsx
├── ImportHistory.tsx
├── ErrorReport.tsx
└── index.ts
```

### 4.2 Main Component Implementation
```typescript
// TemplateImportModal.tsx
interface TemplateImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'course' | 'event';
  onSuccess: (result: ImportResult) => void;
}

export function TemplateImportModal({
  isOpen,
  onClose,
  type,
  onSuccess
}: TemplateImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        {step === 'upload' && <TemplateUploader onFileSelect={handleFileSelect} />}
        {step === 'validate' && <TemplateValidator file={file} onValidate={handleValidate} />}
        {step === 'preview' && <TemplatePreview data={validationResult} />}
        {step === 'import' && <ImportProgress onComplete={handleComplete} />}
        {step === 'complete' && <ImportSummary result={importResult} />}
      </DialogContent>
    </Dialog>
  );
}
```

### 4.3 Admin Page Integration
**Location**: `src/pages/Admin.tsx`

#### Add Import Section:
```typescript
// Admin.tsx - Add to existing admin page
<Tabs>
  <TabsList>
    <TabsTrigger value="courses">Courses</TabsTrigger>
    <TabsTrigger value="events">Events</TabsTrigger>
    <TabsTrigger value="import">Bulk Import</TabsTrigger> {/* New */}
  </TabsList>

  <TabsContent value="import">
    <TemplateImportSection />
  </TabsContent>
</Tabs>
```

## Phase 5: Testing (Week 3)

### 5.1 Unit Tests
**Location**: `src/__tests__/templates/`

#### Test Files:
```
src/__tests__/templates/
├── schemas.test.ts
├── validator.test.ts
├── processor.test.ts
└── components.test.tsx
```

### 5.2 Integration Tests
**Location**: `src/__tests__/integration/`

#### Test Scenarios:
- Valid single course import
- Valid batch course import (100+ items)
- Invalid data handling
- Duplicate detection
- Transaction rollback
- File upload limits

### 5.3 E2E Tests
**Location**: `e2e/template-import.spec.ts`

```typescript
// e2e/template-import.spec.ts
test('Admin can import courses from JSON', async ({ page }) => {
  await page.goto('/admin');
  await page.click('text=Bulk Import');
  await page.setInputFiles('input[type="file"]', 'fixtures/courses.json');
  await page.click('text=Validate');
  await expect(page.locator('.validation-success')).toBeVisible();
  await page.click('text=Import');
  await expect(page.locator('.import-complete')).toBeVisible();
});
```

## Phase 6: Documentation & Deployment (Week 3)

### 6.1 Documentation
**Location**: `docs/`

#### Documents to Create:
- `docs/admin/template-import-guide.md`
- `docs/api/template-endpoints.md`
- `docs/schemas/template-formats.md`

### 6.2 Admin Guide
```markdown
# Template Import Guide

## Supported Formats
- JSON files with single or multiple items
- Maximum file size: 10MB
- UTF-8 encoding required

## Course Template Format
[Include example JSON]

## Event Template Format
[Include example JSON]

## Common Errors and Solutions
[List common validation errors]
```

## Implementation Timeline

### Week 1: Foundation & Database
- [ ] Day 1-2: Create validation schemas
- [ ] Day 3-4: Set up database tables and functions
- [ ] Day 5: Create Supabase edge functions

### Week 2: API & UI
- [ ] Day 1-2: Implement API endpoints
- [ ] Day 3-4: Build UI components
- [ ] Day 5: Integration with admin panel

### Week 3: Testing & Deployment
- [ ] Day 1-2: Write and run tests
- [ ] Day 3: Documentation
- [ ] Day 4: Performance optimization
- [ ] Day 5: Deployment and monitoring setup

## Technical Stack

### Frontend
- **React 18** - UI components
- **TypeScript** - Type safety
- **Zod** - Schema validation
- **React Hook Form** - Form handling
- **TanStack Query** - API state management
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library

### Backend
- **Supabase** - Database and auth
- **PostgreSQL** - Data storage
- **Edge Functions** - Serverless processing
- **Zod** - Server-side validation

### Testing
- **Vitest** - Unit testing
- **React Testing Library** - Component testing
- **Playwright** - E2E testing

## Performance Targets

- File upload: < 2 seconds for 10MB file
- Validation: < 500ms for 100 items
- Import: < 30 seconds for 1000 courses
- UI response: < 100ms for user actions

## Security Considerations

### Input Validation
- File type checking (JSON only)
- File size limits (10MB max)
- Content sanitization
- Schema validation

### Access Control
- Admin-only access required
- Session validation
- Rate limiting (10 imports/hour)
- Audit logging

### Data Protection
- No sensitive data in templates
- Encrypted file transfer
- Secure temporary storage
- Automatic cleanup

## Monitoring & Metrics

### Key Metrics
- Import success rate
- Average processing time
- Validation error rate
- User adoption rate

### Logging
- All import attempts
- Validation failures
- Performance metrics
- Error details

### Alerts
- Import failure rate > 10%
- Processing time > 60s
- Database errors
- Storage quota warnings

## Rollout Strategy

### Phase 1: Beta Testing
- Deploy to staging environment
- Test with 5 admin users
- Process 100+ test imports
- Gather feedback

### Phase 2: Limited Release
- Deploy to production
- Enable for senior admins only
- Monitor performance
- Fix any issues

### Phase 3: General Availability
- Enable for all admins
- Add to admin training
- Create video tutorials
- Monitor adoption

## Success Criteria

- [ ] Successfully import 1000+ courses without errors
- [ ] Processing time < 30 seconds for large batches
- [ ] Error rate < 5% for valid templates
- [ ] Admin satisfaction score > 4.5/5
- [ ] Zero security incidents
- [ ] 99.9% uptime for import service

## Risk Mitigation

### Technical Risks
- **Database locks**: Use row-level locking and transactions
- **Memory issues**: Stream large files, process in chunks
- **Validation complexity**: Comprehensive test coverage
- **Performance degradation**: Implement caching and optimization

### Business Risks
- **Data corruption**: Implement rollback mechanisms
- **User adoption**: Provide training and documentation
- **Support burden**: Create self-service error resolution
- **Compliance**: Ensure audit trail and data governance

## Future Enhancements

### Q2 2025
- CSV/Excel import support
- Drag-and-drop interface
- Template builder UI
- Automated scheduling

### Q3 2025
- API for external systems
- AI-powered error correction
- Template marketplace
- Version control for templates

### Q4 2025
- Multi-language support
- Advanced duplicate handling
- Bulk export functionality
- Template recommendations