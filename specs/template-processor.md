# Template Processing System - Detailed Specification

## Overview
A robust JSON template processing system for bulk importing courses and events into the AIBorg Learn Sphere platform with comprehensive validation, error handling, and audit capabilities.

## Architecture

### Components

#### 1. Template Validator Service
```typescript
interface TemplateValidator {
  validateCourse(data: unknown): ValidationResult<Course>
  validateEvent(data: unknown): ValidationResult<Event>
  validateBatch(data: unknown[]): BatchValidationResult
}
```

#### 2. Template Processor Service
```typescript
interface TemplateProcessor {
  processCourse(template: CourseTemplate): Promise<ProcessResult>
  processEvent(template: EventTemplate): Promise<ProcessResult>
  processBatch(templates: Template[]): Promise<BatchProcessResult>
}
```

#### 3. Import Manager
```typescript
interface ImportManager {
  uploadFile(file: File): Promise<UploadResult>
  validateImport(fileId: string): Promise<ValidationSummary>
  executeImport(fileId: string, options: ImportOptions): Promise<ImportResult>
  getImportHistory(): Promise<ImportHistory[]>
}
```

## Data Schemas

### Course Template Schema
```typescript
const CourseTemplateSchema = z.object({
  // Required fields
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  audiences: z.array(z.enum(['Primary', 'Secondary', 'Professional', 'Business'])).min(1),
  mode: z.enum(['Online', 'Offline', 'Hybrid']),
  duration: z.string().min(1).max(100),
  price: z.string().min(1).max(50),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$|^Flexible$|^Coming Soon$/),

  // Required arrays
  features: z.array(z.string()).min(1).max(20),
  keywords: z.array(z.string()).min(1).max(30),

  // Required with defaults
  category: z.string().min(1).max(100),
  prerequisites: z.string().default('None'),
  is_active: z.boolean().default(true),
  currently_enrolling: z.boolean().default(true),
  display: z.boolean().default(true),
  sort_order: z.number().int().min(0).default(0),

  // Optional nested objects
  course_materials: z.array(CourseMaterialSchema).optional(),
  instructor_info: InstructorSchema.optional(),
  batch_info: BatchInfoSchema.optional(),
  schedule: ScheduleSchema.optional()
})
```

### Event Template Schema
```typescript
const EventTemplateSchema = z.object({
  // Required fields
  title: z.string().min(1).max(200),
  description: z.string().min(10).max(5000),
  event_type: z.enum(['workshop', 'webinar', 'seminar', 'conference', 'meetup', 'hackathon', 'bootcamp', 'training']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().min(1).max(100),
  duration: z.string().min(1).max(50),
  location: z.string().min(1).max(200),
  max_attendees: z.number().int().positive().nullable(),
  registration_deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  price: z.string().min(1).max(50),

  // Required with defaults
  is_featured: z.boolean().default(false),
  is_active: z.boolean().default(true),
  display: z.boolean().default(true),

  // Required arrays
  tags: z.array(z.string()).min(1).max(20),

  // Optional nested objects
  venue_details: VenueDetailsSchema.optional(),
  speaker_info: SpeakerSchema.optional(),
  agenda: z.array(AgendaItemSchema).optional(),
  benefits: z.array(z.string()).optional(),
  target_audience: z.array(z.string()).optional(),
  certificates: CertificateSchema.optional(),
  sponsors: z.array(SponsorSchema).optional()
})
```

## API Endpoints

### REST API
```
POST /api/admin/templates/validate
  - Body: { type: 'course' | 'event', data: object | object[] }
  - Response: ValidationResult

POST /api/admin/templates/import
  - Body: { type: 'course' | 'event', data: object[], options: ImportOptions }
  - Response: ImportResult

POST /api/admin/templates/preview
  - Body: { type: 'course' | 'event', data: object[] }
  - Response: PreviewResult

GET /api/admin/templates/history
  - Query: { page: number, limit: number, type?: string }
  - Response: ImportHistory[]

GET /api/admin/templates/download/:type
  - Params: { type: 'course' | 'event' }
  - Response: Template file download
```

### Supabase Edge Functions
```typescript
// validate-template
export async function handler(req: Request) {
  const { type, data } = await req.json()
  const validator = new TemplateValidator()
  return validator.validate(type, data)
}

// import-template
export async function handler(req: Request) {
  const { type, data, options } = await req.json()
  const processor = new TemplateProcessor()
  return processor.process(type, data, options)
}
```

## UI Components

### Template Upload Component
```typescript
interface TemplateUploadProps {
  type: 'course' | 'event'
  onSuccess: (result: ImportResult) => void
  onError: (errors: ValidationError[]) => void
}

const TemplateUpload: React.FC<TemplateUploadProps> = ({ type, onSuccess, onError }) => {
  // File upload with drag-and-drop
  // JSON validation on client
  // Preview before submission
  // Progress tracking
  // Error display
}
```

### Import History Component
```typescript
interface ImportHistoryProps {
  type?: 'course' | 'event'
  limit?: number
}

const ImportHistory: React.FC<ImportHistoryProps> = ({ type, limit = 10 }) => {
  // Display past imports
  // Filter by type and status
  // Download original files
  // View error details
  // Retry failed imports
}
```

## Validation Rules

### Business Rules
1. **Duplicate Detection**
   - Courses: Check title + start_date combination
   - Events: Check title + date + time combination

2. **Dependency Validation**
   - If price is "Free", no payment-related fields required
   - If mode is "Online", location should indicate platform
   - If max_attendees is set, enforce registration limits

3. **Date Validations**
   - start_date must be future date or "Flexible"
   - registration_deadline must be before event date
   - Course materials order_index must be sequential

4. **Reference Validations**
   - Instructor email must be valid format
   - URLs in materials must be accessible
   - Category must exist in system

## Error Handling

### Error Response Format
```json
{
  "success": false,
  "errors": [
    {
      "field": "courses[0].title",
      "message": "Title is required",
      "code": "REQUIRED_FIELD",
      "suggestion": "Add a title between 1-200 characters"
    },
    {
      "field": "courses[1].start_date",
      "message": "Invalid date format",
      "code": "INVALID_FORMAT",
      "suggestion": "Use YYYY-MM-DD format or 'Flexible'"
    }
  ],
  "summary": {
    "total": 10,
    "valid": 8,
    "invalid": 2,
    "warnings": 3
  }
}
```

### Error Recovery
- Partial imports with rollback option
- Ability to fix and retry failed items
- Export error report as CSV
- Suggested fixes for common issues

## Database Operations

### Transaction Management
```sql
BEGIN;
  -- Validate foreign keys
  SELECT validate_course_dependencies($1);

  -- Insert course
  INSERT INTO courses (...) VALUES (...) RETURNING id;

  -- Insert course materials
  INSERT INTO course_materials (...) VALUES (...);

  -- Insert course audiences
  INSERT INTO course_audiences (...) VALUES (...);

  -- Log import
  INSERT INTO import_history (...) VALUES (...);
COMMIT;
```

### Rollback Strategy
- Use database transactions for atomicity
- Savepoints for partial rollbacks
- Audit trail of all operations
- Ability to undo imports within 24 hours

## Performance Optimizations

### Batch Processing
- Process in chunks of 100 records
- Parallel validation for independent fields
- Bulk database inserts with COPY
- Connection pooling for concurrent operations

### Caching
- Cache validation schemas
- Cache reference data (categories, instructors)
- Cache recent import results
- Use Redis for session storage

### File Handling
- Stream large files instead of loading to memory
- Compress import history files
- Clean up temporary files after processing
- Use CDN for template downloads

## Security Measures

### Input Validation
- Sanitize all text inputs
- Prevent SQL injection via parameterized queries
- Validate JSON structure before parsing
- Check file size and type restrictions

### Access Control
- Admin-only endpoints with role checking
- Rate limiting per user: 10 imports per hour
- Audit log all import operations
- Encrypt sensitive data in transit

### Data Protection
- No sensitive data in templates
- Mask personal information in logs
- Secure temporary file storage
- Regular security audits

## Testing Strategy

### Unit Tests
- Schema validation tests
- Business rule validation tests
- Data transformation tests
- Error handling tests

### Integration Tests
- Database transaction tests
- File upload/download tests
- API endpoint tests
- End-to-end workflow tests

### Performance Tests
- Load testing with 1000+ records
- Concurrent import testing
- Memory usage monitoring
- Database query optimization

## Monitoring & Logging

### Metrics to Track
- Import success/failure rates
- Average processing time
- Validation error frequency
- Database transaction times

### Logging Requirements
- Log all import attempts with user info
- Log validation errors with details
- Log database operations
- Log performance metrics

### Alerts
- Failed import rate > 10%
- Processing time > 60 seconds
- Database connection errors
- File system space warnings

## Future Enhancements

### Phase 1 (Immediate)
- Excel/CSV import support
- Template builder UI
- Validation rule customization
- Email notifications on import

### Phase 2 (Q2 2025)
- API for third-party integrations
- Scheduled imports from URLs
- Template marketplace
- AI-assisted error correction

### Phase 3 (Q3 2025)
- Real-time collaborative editing
- Version control for templates
- Advanced duplicate merging
- Multi-language template support