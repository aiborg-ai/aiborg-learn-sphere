# Template Processing System - API Documentation

## Overview

The Template Processing System provides RESTful API endpoints for validating and importing course and event templates in bulk. All endpoints are implemented as Supabase Edge Functions and require authentication.

## Base URL

```
https://[your-supabase-project].supabase.co/functions/v1
```

## Authentication

All endpoints require Bearer token authentication using Supabase Auth:

```http
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### Required Permissions
- User must have `admin` or `super_admin` role in the `user_roles` table
- Permissions are enforced via Row Level Security (RLS)

## Endpoints

### 1. Validate Template

Validates course or event templates without importing them.

#### Endpoint
```http
POST /validate-template
```

#### Request Body
```typescript
interface ValidationRequest {
  type: 'course' | 'event';           // Template type
  data: any | any[];                   // Single item or array
  options?: {
    checkDuplicates?: boolean;         // Check for duplicates (default: false)
    validateDependencies?: boolean;    // Validate references (default: false)
    batchMode?: boolean;              // Enable batch processing (default: false)
  };
}
```

#### Response
```typescript
interface ValidationResponse {
  success: boolean;                    // Overall validation status
  data?: any;                         // Validated and transformed data
  errors?: ValidationError[];         // List of validation errors
  warnings?: ValidationWarning[];     // Non-critical warnings
  summary?: ValidationSummary;        // Batch validation summary
  duplicates?: DuplicateInfo[];       // Detected duplicates
}

interface ValidationError {
  field: string;                      // Field path (e.g., "title", "features[0]")
  message: string;                    // Error description
  code: string;                        // Error code (e.g., "invalid_type")
  suggestion?: string;                // Helpful suggestion
  index?: number;                     // Item index (for batch)
}

interface ValidationWarning {
  field: string;
  message: string;
  type: string;                        // Warning type (e.g., "missing_reference")
}

interface ValidationSummary {
  total: number;                      // Total items processed
  valid: number;                      // Successfully validated
  invalid: number;                     // Failed validation
  warnings: number;                    // Items with warnings
  duplicates?: number;                // Duplicate items found
}

interface DuplicateInfo {
  indices?: number[];                 // Indices in batch
  field: string;                      // Duplicate field(s)
  value: string;                      // Duplicate value
  existingId?: number;                // ID of existing record
}
```

#### Example Request
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/validate-template \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "course",
    "data": {
      "title": "Web Development Bootcamp",
      "description": "Learn full-stack web development",
      "audiences": ["Student", "Professional"],
      "mode": "Online",
      "duration": "12 weeks",
      "price": "₹25000",
      "level": "Beginner",
      "start_date": "2025-03-01",
      "features": ["Live sessions", "Projects"],
      "keywords": ["web", "javascript"],
      "category": "Technology"
    },
    "options": {
      "checkDuplicates": true
    }
  }'
```

#### Example Response - Success
```json
{
  "success": true,
  "data": {
    "title": "Web Development Bootcamp",
    "description": "Learn full-stack web development",
    "audiences": ["Student", "Professional"],
    "mode": "Online",
    "duration": "12 weeks",
    "price": "₹25000",
    "level": "Beginner",
    "start_date": "2025-03-01",
    "features": ["Live sessions", "Projects"],
    "keywords": ["web", "javascript"],
    "category": "Technology"
  }
}
```

#### Example Response - Validation Error
```json
{
  "success": false,
  "errors": [
    {
      "field": "description",
      "message": "Description must be at least 10 characters",
      "code": "too_small",
      "suggestion": "Please provide a more detailed description"
    }
  ]
}
```

### 2. Import Template

Imports validated templates into the database.

#### Endpoint
```http
POST /import-template
```

#### Request Body
```typescript
interface ImportRequest {
  type: 'course' | 'event';           // Template type
  data: any | any[];                   // Single item or array
  options?: {
    skip_duplicates?: boolean;         // Skip existing items (default: true)
    update_existing?: boolean;         // Update if exists (default: false)
    dry_run?: boolean;                // Simulate import (default: false)
    send_notifications?: boolean;      // Send user notifications (default: false)
    auto_publish?: boolean;            // Auto-publish items (default: false)
    validate_first?: boolean;          // Validate before import (default: false)
  };
}
```

#### Response
```typescript
interface ImportResponse {
  success: boolean;                   // Overall import status
  import_id?: string;                 // Unique import identifier
  summary?: {
    total: number;                    // Total items processed
    imported: number;                 // Successfully imported
    skipped: number;                  // Skipped (duplicates)
    failed: number;                   // Failed to import
    updated: number;                  // Updated existing
  };
  results?: ImportResult[];          // Individual item results
  errors?: ImportError[];            // Import errors
}

interface ImportResult {
  index?: number;                    // Item index in batch
  id: number;                        // Database ID (if successful)
  type: 'course' | 'event';
  title: string;
  status: 'imported' | 'updated' | 'skipped' | 'failed';
  message?: string;                  // Status message
}

interface ImportError {
  index?: number;
  field?: string;
  message: string;
  code: string;
}
```

#### Example Request
```bash
curl -X POST \
  https://your-project.supabase.co/functions/v1/import-template \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "course",
    "data": [
      {
        "title": "Python Programming",
        "description": "Complete Python course for beginners",
        "audiences": ["Student"],
        "mode": "Online",
        "duration": "8 weeks",
        "price": "₹15000",
        "level": "Beginner",
        "start_date": "2025-03-15",
        "features": ["Video lessons", "Exercises"],
        "keywords": ["python", "programming"],
        "category": "Technology"
      }
    ],
    "options": {
      "skip_duplicates": true,
      "validate_first": true
    }
  }'
```

#### Example Response - Success
```json
{
  "success": true,
  "import_id": "550e8400-e29b-41d4-a716-446655440000",
  "summary": {
    "total": 1,
    "imported": 1,
    "skipped": 0,
    "failed": 0,
    "updated": 0
  },
  "results": [
    {
      "index": 0,
      "id": 123,
      "type": "course",
      "title": "Python Programming",
      "status": "imported",
      "message": "Course imported successfully"
    }
  ]
}
```

### 3. Import History

Retrieves import history with filtering and pagination.

#### Endpoint
```http
GET /import-history
```

#### Query Parameters
```typescript
interface HistoryRequest {
  page?: number;                      // Page number (default: 1)
  limit?: number;                     // Items per page (default: 10)
  status?: string;                    // Filter by status
  type?: 'course' | 'event' | 'mixed'; // Filter by type
  date_from?: string;                 // Start date (YYYY-MM-DD)
  date_to?: string;                   // End date (YYYY-MM-DD)
  sort_by?: 'created_at' | 'completed_at' | 'total_count' | 'success_count';
  sort_order?: 'asc' | 'desc';       // Sort direction (default: desc)
}
```

#### Response
```typescript
interface HistoryResponse {
  success: boolean;
  imports?: ImportRecord[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  error?: string;
}

interface ImportRecord {
  id: string;
  import_type: string;
  file_name: string;
  file_size?: number;
  status: string;
  started_at: string;
  completed_at?: string;
  total_count: number;
  success_count: number;
  error_count: number;
  warning_count: number;
  skipped_count: number;
  errors?: any[];
  warnings?: any[];
  options?: any;
}
```

#### Example Request
```bash
curl -X GET \
  "https://your-project.supabase.co/functions/v1/import-history?page=1&limit=10&sort_by=created_at" \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Import Details

Get detailed information about a specific import.

#### Endpoint
```http
GET /import-history/{import_id}
```

#### Response
Returns a single `ImportRecord` with additional fields:
- `items`: Array of imported items with their status
- `audit_logs`: Array of audit trail entries

#### Example Request
```bash
curl -X GET \
  "https://your-project.supabase.co/functions/v1/import-history/550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Import Statistics

Get aggregate statistics for all imports.

#### Endpoint
```http
GET /import-history/statistics
```

#### Response
```typescript
interface StatisticsResponse {
  success: boolean;
  statistics: {
    total_imports: number;
    successful_imports: number;
    failed_imports: number;
    total_items_imported: number;
    total_items_failed: number;
    total_items_skipped: number;
    recent_imports: ImportRecord[];  // Last 5 imports
  };
}
```

## Data Schemas

### Course Template Schema

```typescript
interface CourseTemplate {
  // Required fields
  title: string;                      // 1-200 characters
  description: string;                // 10-5000 characters
  audiences: Audience[];              // Min 1, max 4
  mode: CourseMode;
  duration: string;                   // e.g., "8 weeks", "3 months"
  price: string;                      // "Free" or currency amount
  level: CourseLevel;
  start_date: string;                 // YYYY-MM-DD or "Flexible"
  features: string[];                 // Min 1, max 20
  keywords: string[];                 // Min 1, max 30
  category: string;                   // 1-100 characters

  // Optional fields
  end_date?: string;
  enrollment_deadline?: string;
  prerequisites?: string;              // Max 1000 characters
  max_students?: number;
  min_students?: number;
  certification_available?: boolean;
  completion_criteria?: string;
  refund_policy?: string;

  // Complex optional fields
  instructor_info?: {
    name: string;
    email: string;                    // Valid email
    bio?: string;
    designation?: string;
    company?: string;
    linkedin?: string;                // Valid URL
    photo_url?: string;               // Valid URL
  };

  course_materials?: Array<{
    title: string;
    type: MaterialType;
    url?: string;                     // Valid URL
    description?: string;
    duration?: string;
    order_index?: number;
    is_preview?: boolean;
    is_mandatory?: boolean;
  }>;

  // Display settings
  is_featured?: boolean;
  is_active?: boolean;
  display?: boolean;
  sort_order?: number;

  // SEO
  meta_title?: string;                // Max 60 characters
  meta_description?: string;          // Max 160 characters

  // Admin
  admin_notes?: string;
  custom_fields?: Record<string, any>;
}

// Enums
type Audience = 'Student' | 'Professional' | 'Teacher' | 'Parent' | 'Business';
type CourseMode = 'Online' | 'Offline' | 'Hybrid';
type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'All Levels';
type MaterialType = 'video' | 'document' | 'assignment' | 'quiz' | 'resource';
```

### Event Template Schema

```typescript
interface EventTemplate {
  // Required fields
  title: string;                      // 1-200 characters
  description: string;                // 10-5000 characters
  event_type: EventType;
  audiences: Audience[];              // Min 1, max 4
  date: string;                       // YYYY-MM-DD
  time: string;                       // e.g., "2:00 PM IST"
  duration: string;                   // e.g., "3 hours"
  mode: EventMode;
  price: string;                      // "Free" or amount
  tags: string[];                     // Min 1, max 20

  // Optional fields
  location?: string;                  // Max 200 characters
  max_attendees?: number;
  min_attendees?: number;
  registration_deadline?: string;
  registration_required?: boolean;
  registration_link?: string;         // Valid URL

  // Complex optional fields
  venue_details?: {
    platform?: string;
    meeting_link?: string;            // Valid URL
    address?: string;
    room?: string;
    parking?: string;
    accessibility?: string;
    map_url?: string;                 // Valid URL
  };

  speaker_info?: {
    name: string;
    designation?: string;
    company?: string;
    bio?: string;
    linkedin?: string;                // Valid URL
    photo_url?: string;               // Valid URL
  };

  agenda?: Array<{
    time: string;
    topic: string;
    description?: string;
    speaker?: string;
    duration?: string;
  }>;

  // Additional fields
  prerequisites?: string;
  what_to_bring?: string[];          // Max 10 items
  benefits?: string[];               // Max 15 items
  target_audience?: string[];        // Max 10 items

  certificates?: {
    provided: boolean;
    type?: 'Digital' | 'Physical' | 'Both';
    criteria?: string;
  };

  sponsors?: Array<{
    name: string;
    logo_url?: string;                // Valid URL
    website?: string;                 // Valid URL
    type?: 'Gold' | 'Silver' | 'Bronze' | 'Partner';
  }>;

  // Display settings
  is_featured?: boolean;
  is_active?: boolean;
  display?: boolean;

  // SEO
  meta_title?: string;
  meta_description?: string;
  hashtags?: string[];                // Max 10

  // Admin
  admin_notes?: string;
  custom_fields?: Record<string, any>;
}

// Enums
type EventType = 'workshop' | 'webinar' | 'seminar' | 'conference' |
                 'meetup' | 'hackathon' | 'bootcamp' | 'training';
type EventMode = 'online' | 'offline' | 'hybrid';
```

## Error Codes

### Validation Error Codes
| Code | Description | Resolution |
|------|-------------|------------|
| `invalid_type` | Wrong data type | Check field type in schema |
| `too_small` | Below minimum length/value | Increase value/length |
| `too_big` | Exceeds maximum | Reduce value/length |
| `invalid_enum_value` | Value not in allowed list | Use valid enum value |
| `invalid_date` | Wrong date format | Use YYYY-MM-DD format |
| `invalid_string` | String validation failed | Check string format |
| `custom` | Custom validation failed | Check specific requirements |
| `required` | Missing required field | Provide required field |

### Import Error Codes
| Code | Description | Resolution |
|------|-------------|------------|
| `INVALID_REQUEST` | Malformed request | Check request format |
| `UNAUTHORIZED` | Missing/invalid auth | Provide valid token |
| `FORBIDDEN` | Insufficient permissions | Requires admin role |
| `VALIDATION_ERROR` | Validation failed | Fix validation errors |
| `DUPLICATE_ERROR` | Duplicate detected | Use skip_duplicates option |
| `DATABASE_ERROR` | Database operation failed | Check data/retry |
| `SERVER_ERROR` | Internal server error | Contact support |

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/validate-template` | 100 requests | 1 minute |
| `/import-template` | 10 requests | 1 minute |
| `/import-history` | 60 requests | 1 minute |

## Best Practices

### 1. Batch Processing
- Group items in batches of 50-100
- Use batch validation before import
- Monitor rate limits

### 2. Error Handling
```typescript
try {
  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.json();
    // Handle specific error codes
    switch(error.code) {
      case 'VALIDATION_ERROR':
        // Show validation errors to user
        break;
      case 'UNAUTHORIZED':
        // Refresh token and retry
        break;
      default:
        // Generic error handling
    }
  }

  const data = await response.json();
  // Process successful response
} catch (error) {
  // Network or parsing error
}
```

### 3. Validation Strategy
1. Validate locally first (JSON schema)
2. Use validation endpoint for server-side checks
3. Handle duplicates appropriately
4. Review warnings before import

### 4. Import Options
- Always use `dry_run` for testing
- Enable `skip_duplicates` by default
- Use `update_existing` carefully
- Batch notifications to avoid spam

## SDK Examples

### JavaScript/TypeScript
```typescript
import { createClient } from '@supabase/supabase-js';

class TemplateImporter {
  private supabase: any;

  constructor(url: string, key: string) {
    this.supabase = createClient(url, key);
  }

  async validateTemplate(type: 'course' | 'event', data: any) {
    const { data: session } = await this.supabase.auth.getSession();

    const response = await fetch(
      `${this.supabase.supabaseUrl}/functions/v1/validate-template`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, data })
      }
    );

    return response.json();
  }

  async importTemplate(type: 'course' | 'event', data: any, options = {}) {
    const { data: session } = await this.supabase.auth.getSession();

    const response = await fetch(
      `${this.supabase.supabaseUrl}/functions/v1/import-template`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type, data, options })
      }
    );

    return response.json();
  }
}
```

### Python
```python
import requests
from typing import Dict, List, Optional

class TemplateImporter:
    def __init__(self, supabase_url: str, access_token: str):
        self.base_url = f"{supabase_url}/functions/v1"
        self.headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        }

    def validate_template(
        self,
        template_type: str,
        data: Dict | List[Dict],
        options: Optional[Dict] = None
    ) -> Dict:
        """Validate template data"""
        payload = {
            "type": template_type,
            "data": data,
            "options": options or {}
        }

        response = requests.post(
            f"{self.base_url}/validate-template",
            json=payload,
            headers=self.headers
        )

        return response.json()

    def import_template(
        self,
        template_type: str,
        data: Dict | List[Dict],
        options: Optional[Dict] = None
    ) -> Dict:
        """Import template data"""
        payload = {
            "type": template_type,
            "data": data,
            "options": options or {"skip_duplicates": True}
        }

        response = requests.post(
            f"{self.base_url}/import-template",
            json=payload,
            headers=self.headers
        )

        return response.json()

# Usage
importer = TemplateImporter(
    "https://your-project.supabase.co",
    "your-access-token"
)

# Validate first
validation_result = importer.validate_template(
    "course",
    {"title": "Python Course", ...}
)

if validation_result["success"]:
    # Import if valid
    import_result = importer.import_template(
        "course",
        validation_result["data"]
    )
```

## Webhooks

The system can trigger webhooks on import completion (future feature):

```typescript
interface ImportWebhook {
  event: 'import.completed' | 'import.failed';
  import_id: string;
  summary: ImportSummary;
  timestamp: string;
}
```

## Support

For API support:
- Check error messages and codes
- Review rate limits
- Verify authentication
- Contact: api-support@aiborg.ai

---

*API Version: 1.0*
*Last Updated: September 2025*