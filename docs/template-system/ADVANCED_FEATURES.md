# Advanced Template Features Documentation

## 🚀 New Features Overview

The Template Processing System has been enhanced with powerful advanced features to streamline bulk data management:

## 1. 📥 Bulk Export

Export your existing courses and events to JSON or CSV format for backup, analysis, or migration.

### Features:
- **Export Formats**: JSON (for re-import) or CSV (for spreadsheet editing)
- **Export Types**: Courses only, Events only, or Both
- **Advanced Filtering**:
  - By category
  - By date range
  - By status (active/inactive, displayed/hidden)
  - By specific IDs
- **Export Options**:
  - Include/exclude inactive items
  - Include/exclude hidden items
  - Include course materials
  - Include metadata (IDs, timestamps)

### Usage:
1. Navigate to **Template Management System** → **Export** tab
2. Select export type and format
3. Configure filters (optional)
4. Click **Export Templates**
5. File downloads automatically

### API Endpoint:
```http
POST /functions/v1/export-template
Authorization: Bearer YOUR_TOKEN

{
  "type": "course",
  "format": "json",
  "filters": {
    "category": "Technology",
    "is_active": true
  },
  "options": {
    "include_materials": true
  }
}
```

## 2. 🌐 URL Import

Import templates directly from external URLs without manual downloading.

### Features:
- **Auto-detection**: Automatically detects JSON or CSV format
- **Authentication Support**:
  - Bearer token
  - Basic authentication
  - API key authentication
- **Import Options**:
  - Skip duplicates
  - Update existing
  - Validate before import
  - Dry run mode
- **Security**: HTTPS-only, size limits, timeout protection

### Usage:
1. Navigate to **URL Import** tab
2. Enter the template URL
3. Configure authentication if needed
4. Set import options
5. Click **Import from URL**

### Supported Sources:
- Public JSON/CSV files
- GitHub raw files
- Google Sheets (published as CSV)
- API endpoints returning JSON
- Protected resources with authentication

### API Endpoint:
```http
POST /functions/v1/import-from-url
Authorization: Bearer YOUR_TOKEN

{
  "url": "https://example.com/templates.json",
  "type": "auto",
  "format": "json",
  "options": {
    "skip_duplicates": true,
    "validate_first": true,
    "headers": {
      "Authorization": "Bearer EXTERNAL_TOKEN"
    }
  }
}
```

## 3. 📅 Scheduled Imports

Automate template imports on a recurring schedule.

### Features:
- **Schedule Types**:
  - Once (specific date/time)
  - Daily
  - Weekly
  - Monthly
- **Source Configuration**: URL-based imports
- **Status Tracking**:
  - Last run status
  - Success/failure counts
  - Next scheduled run
- **Management**:
  - Pause/resume schedules
  - Run immediately
  - Edit configurations
  - View execution logs

### Usage:
1. Navigate to **Scheduled** tab
2. Click **Create Schedule**
3. Configure:
   - Name and description
   - Schedule frequency
   - Source URL
   - Import options
4. Activate the schedule

### Database Tables:
- `scheduled_imports` - Schedule configurations
- `scheduled_import_logs` - Execution history
- `url_import_cache` - URL response caching

## 4. 📊 CSV Support

Full support for CSV format alongside JSON.

### Features:
- **Import CSV**: Upload or import from URL
- **Export to CSV**: Export data for spreadsheet editing
- **Smart Parsing**:
  - Handles quoted values
  - Array fields with pipe separator (|)
  - Boolean field conversion
  - Number field parsing
- **Nested Object Support**: Flattened with underscore notation

### CSV Format Example:
```csv
title,description,audiences,mode,duration,price,level,start_date,features,keywords,category
"Web Development","Learn web dev","Student|Professional",Online,"8 weeks",₹15000,Beginner,2025-03-01,"Videos|Projects|Certificate","web|javascript|html",Technology
```

### Field Mappings:
- **Arrays**: Use pipe (|) separator
- **Booleans**: true/false strings
- **Numbers**: Plain numeric values
- **Nested Objects**: `parent_child` notation

## 5. 🔄 Template Versioning

Track and manage template schema versions for backward compatibility.

### Features:
- **Version Tracking**: Schema versions stored in database
- **Compatibility Checks**: Min/max version ranges
- **Breaking Changes**: Documentation of incompatible changes
- **Current Version**: v1.0.0

### Database Table:
```sql
template_versions:
- version (e.g., "1.0.0")
- schema_version (integer)
- course_schema (JSON)
- event_schema (JSON)
- is_current (boolean)
- breaking_changes (JSON array)
```

## 6. 🗄️ URL Import Cache

Intelligent caching system for URL-based imports.

### Features:
- **Automatic Caching**: Reduces external API calls
- **Cache Duration**: 1 hour default
- **Hit Tracking**: Monitor cache usage
- **Content Validation**: SHA256 hash verification

### Benefits:
- Faster re-imports from same URL
- Reduced external API rate limiting
- Network failure resilience
- Bandwidth optimization

## 7. 💾 Export Configurations

Save and reuse export configurations.

### Features:
- **Named Configurations**: Save common export settings
- **Quick Access**: One-click exports
- **Scheduled Exports**: Automate regular exports
- **Usage Tracking**: Monitor configuration usage

## 🎯 Use Cases

### 1. **Migration Scenario**
- Export all courses from old system
- Transform in spreadsheet if needed
- Import via URL or upload

### 2. **Regular Backups**
- Schedule daily exports
- Auto-save to cloud storage
- Version control templates

### 3. **Partner Integration**
- Schedule imports from partner APIs
- Automatic validation and import
- Error notifications

### 4. **Bulk Updates**
- Export to CSV
- Edit in Excel/Google Sheets
- Re-import with update option

### 5. **Template Sharing**
- Export course templates
- Share via URL
- Partners import directly

## 🔒 Security Considerations

1. **URL Imports**:
   - HTTPS required for secure URLs
   - Authentication tokens encrypted
   - Size limits (10MB max)
   - Timeout protection (30 seconds)

2. **Scheduled Imports**:
   - Admin-only access
   - Encrypted credentials storage
   - Audit trail for all operations

3. **Export Security**:
   - Role-based access control
   - Optional metadata exclusion
   - Filtered exports by permission

## 📈 Performance Optimizations

1. **Batch Processing**: Handle up to 1000 items
2. **Streaming CSV**: Memory-efficient processing
3. **URL Caching**: Reduce redundant fetches
4. **Async Processing**: Non-blocking operations
5. **Database Transactions**: Atomic operations

## 🛠️ Troubleshooting

### Common Issues:

| Issue | Solution |
|-------|----------|
| CSV import fails | Check delimiter, encoding (UTF-8) |
| URL timeout | Break into smaller files |
| Schedule not running | Check timezone, activation status |
| Export too large | Use filters, pagination |
| Authentication fails | Verify token, check expiration |

## 📝 Best Practices

1. **For Imports**:
   - Validate before importing
   - Use dry run for testing
   - Keep backup before updates
   - Monitor scheduled import logs

2. **For Exports**:
   - Use filters for large datasets
   - Choose appropriate format
   - Include metadata for auditing
   - Schedule during off-peak hours

3. **For CSV**:
   - Use UTF-8 encoding
   - Quote text with commas
   - Test with small sample first
   - Validate array separators

## 🔗 API Integration

### Example: Automated Daily Import
```javascript
// Schedule configuration
const schedule = {
  name: "Daily Course Sync",
  schedule_type: "daily",
  import_type: "course",
  source_type: "url",
  source_url: "https://api.partner.com/courses.json",
  import_options: {
    skip_duplicates: true,
    validate_first: true
  },
  auth_type: "bearer",
  auth_config: {
    token: "encrypted_token_here"
  }
};
```

### Example: Bulk Export Script
```javascript
// Export all active courses
const exportConfig = {
  type: "course",
  format: "json",
  filters: {
    is_active: true,
    display: true
  },
  options: {
    include_materials: true,
    include_metadata: false
  }
};

const response = await fetch('/functions/v1/export-template', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(exportConfig)
});

const result = await response.json();
// Save result.data to file
```

## 🚀 Future Enhancements

Planned features for next release:

1. **Excel Support**: Native .xlsx import/export
2. **Google Sheets Integration**: Direct sync
3. **Webhook Notifications**: Real-time import status
4. **Template Marketplace**: Share/sell templates
5. **AI-Powered Validation**: Smart error detection
6. **Incremental Sync**: Delta updates only
7. **Multi-tenant Support**: Organization-level templates

---

**Version**: 2.0.0
**Released**: September 2025
**Documentation Updated**: September 23, 2025