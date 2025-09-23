# Template Import System - Admin User Guide

## Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Template Format](#template-format)
4. [Step-by-Step Import Process](#step-by-step-import-process)
5. [Import Options](#import-options)
6. [Handling Errors](#handling-errors)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

## Overview

The Template Import System allows administrators to bulk import courses and events into the AIBorg Learn Sphere platform using JSON templates. This powerful feature enables you to:

- Import multiple courses or events at once
- Validate data before importing
- Handle duplicates intelligently
- Track import history and statistics
- Download example templates

## Getting Started

### Accessing the Template Import System

1. Log in to the AIBorg admin panel
2. Navigate to `/admin`
3. Click the **"Template Import"** button in the top navigation bar
4. You'll be taken to the Template Import page with four main tabs:
   - Upload
   - Validate
   - Progress
   - History

### Required Permissions

- You must have **Admin** or **Super Admin** role
- The system will verify your permissions before allowing imports

## Template Format

### Course Template Structure

```json
{
  "courses": [
    {
      "title": "Course Title (Required)",
      "description": "Detailed course description (Required, min 10 chars)",
      "audiences": ["Student", "Professional"], // At least one required
      "mode": "Online", // Options: Online, Offline, Hybrid
      "duration": "8 weeks", // Examples: "2 hours", "4 weeks", "3 months"
      "price": "₹5000", // Use "Free" or currency format
      "level": "Beginner", // Options: Beginner, Intermediate, Advanced, All Levels
      "start_date": "2025-03-01", // YYYY-MM-DD or "Flexible"
      "features": ["Feature 1", "Feature 2"], // At least one required
      "keywords": ["keyword1", "keyword2"], // At least one required
      "category": "Technology" // Required
    }
  ]
}
```

### Event Template Structure

```json
{
  "events": [
    {
      "title": "Event Title (Required)",
      "description": "Event description (Required, min 10 chars)",
      "event_type": "workshop", // Options: workshop, webinar, seminar, conference, etc.
      "audiences": ["Professional"], // At least one required
      "date": "2025-03-15", // YYYY-MM-DD format
      "time": "2:00 PM IST", // Include timezone
      "duration": "3 hours", // Duration format
      "mode": "online", // Options: online, offline, hybrid
      "price": "Free", // Price or "Free"
      "tags": ["tag1", "tag2"] // At least one required
    }
  ]
}
```

### Optional Fields

Both courses and events support many optional fields:
- `instructor_info` / `speaker_info` - Instructor/speaker details
- `course_materials` / `agenda` - Content structure
- `max_students` / `max_attendees` - Capacity limits
- `certification_available` - Certificate availability
- `venue_details` - Location information
- `prerequisites` - Requirements for participants
- And many more...

## Step-by-Step Import Process

### Step 1: Prepare Your Template

1. Download an example template:
   - Click **"Download Course Template Example"** or **"Download Event Template Example"**
   - Modify the template with your data
   - Save as a `.json` file

2. Ensure your JSON is valid:
   - Use a JSON validator tool
   - Check required fields are present
   - Verify date formats (YYYY-MM-DD)

### Step 2: Upload Template

1. Go to the **Upload** tab
2. Select template type (Course or Event)
3. Either:
   - **Drag and drop** your JSON file into the upload area
   - **Click** the upload area to browse and select your file
4. The system will automatically detect the template type
5. Click **"Validate & Import"** to proceed

### Step 3: Review Validation Results

After upload, you'll see the validation results:

#### Success Indicators
- ✅ **Green checkmark** - All items passed validation
- Summary shows total, valid, invalid counts

#### Warning Indicators
- ⚠️ **Yellow warning** - Non-critical issues
  - Missing optional fields
  - Suggestions for improvement
  - Dependency warnings

#### Error Indicators
- ❌ **Red X** - Validation errors that must be fixed
  - Missing required fields
  - Invalid formats
  - Data type mismatches

#### Duplicate Detection
- 📋 **Duplicate items** - Shows items that already exist
  - Within the batch (same file)
  - In the database (existing records)

### Step 4: Configure Import Options

Before importing, configure these options:

| Option | Description | When to Use |
|--------|-------------|------------|
| **Skip duplicates** | Skip items that already exist | Default behavior, prevents duplicates |
| **Update existing** | Update existing items with new data | When refreshing existing content |
| **Dry run** | Preview without making changes | Testing and validation |
| **Send notifications** | Notify users about new items | For important announcements |
| **Auto-publish** | Make items immediately visible | For pre-approved content |

### Step 5: Execute Import

1. Review all settings
2. Click **"Proceed with Import"** (or "Run Dry Import" for testing)
3. Monitor the progress bar
4. View real-time results as items are processed

### Step 6: Review Results

After import completion, you'll see:

- **Summary Statistics**
  - Total items processed
  - Successfully imported
  - Updated items
  - Skipped items
  - Failed items

- **Detailed Results**
  - Individual item status
  - Success/failure messages
  - Item IDs for reference

- **Import ID**
  - Unique identifier for this import
  - Use for tracking and support

## Import Options

### Skip Duplicates (Default: ON)
- Prevents creating duplicate courses/events
- Checks for matching title + start date (courses)
- Checks for matching title + date + time (events)
- Recommended for most imports

### Update Existing (Default: OFF)
- Updates existing records with new data
- Only works if "Skip Duplicates" is OFF
- Useful for bulk updates to existing content
- Preserves enrollment data and reviews

### Dry Run (Default: OFF)
- Simulates the import without making changes
- Shows what would happen
- Useful for testing templates
- No database changes made

### Send Notifications (Default: OFF)
- Sends email notifications to users
- Only for published, active items
- Use sparingly to avoid spam
- Best for major announcements

### Auto-Publish (Default: OFF)
- Sets `display: true` and `is_active: true`
- Makes items immediately visible
- Skip manual publishing step
- Use only for pre-approved content

## Handling Errors

### Common Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| **Missing required field** | Required field not provided | Add the missing field to your template |
| **Invalid date format** | Date not in YYYY-MM-DD format | Fix date format or use "Flexible" |
| **Invalid price format** | Price format incorrect | Use "Free" or currency like "₹5000" |
| **Too many items** | Batch size exceeded | Split into smaller batches (<100 items) |
| **Invalid enum value** | Value not in allowed list | Check documentation for valid options |

### Error Recovery

1. **Download the error report** (if available)
2. **Fix errors in your template**
3. **Re-upload the corrected file**
4. **Use "Skip Duplicates"** to avoid re-importing successful items

### Validation Suggestions

The system provides helpful suggestions for each error:
- 💡 Field-specific hints
- Format examples
- Valid value ranges
- Quick fix recommendations

## Best Practices

### Before Importing

1. **Start with small batches** - Test with 5-10 items first
2. **Use dry run** - Always test before actual import
3. **Validate locally** - Check JSON syntax before upload
4. **Backup existing data** - Export current courses/events if updating

### Template Preparation

1. **Use consistent formatting**
   - Dates: YYYY-MM-DD
   - Times: Include timezone (IST, EST, etc.)
   - Prices: Consistent currency symbols

2. **Provide complete information**
   - Fill optional fields when possible
   - Include instructor/speaker details
   - Add comprehensive descriptions

3. **Organize by type**
   - Separate courses and events
   - Group similar items together
   - Use meaningful categories

### During Import

1. **Monitor progress** - Watch for errors in real-time
2. **Note the Import ID** - Keep for reference
3. **Check results** - Verify imported items in the main admin panel

### After Import

1. **Review imported items** - Check display on frontend
2. **Fix any issues** - Update individual items if needed
3. **Document the import** - Note date, file, and results

## Troubleshooting

### Import Fails Immediately
- Check your admin permissions
- Ensure you're logged in
- Verify JSON file is valid
- Check file size (<5MB)

### Validation Errors
- Review error messages carefully
- Check required fields
- Verify data formats
- Look for typos in enum values

### Duplicates Not Detected
- Check matching criteria (title + date)
- Ensure exact string matching
- Consider case sensitivity

### Import Successful but Items Not Visible
- Check `display` field (should be `true`)
- Verify `is_active` field
- Ensure proper category exists
- Check frontend filters

### Performance Issues
- Reduce batch size (<50 items)
- Import during off-peak hours
- Split large imports into chunks
- Use pagination in History view

## Import History

### Viewing Past Imports

1. Go to the **History** tab
2. View summary statistics at the top
3. Browse the import table with:
   - Date and time
   - File name
   - Status
   - Success/failure counts

### Filtering and Sorting

- Sort by date, status, or counts
- Filter by import type
- Search by file name
- Navigate with pagination

### Detailed View

Click the **eye icon** to view:
- Complete import details
- Item-by-item results
- Error messages
- Options used
- Audit trail

## Support

If you encounter issues:

1. **Check this guide** for solutions
2. **Review error messages** - They often contain the solution
3. **Try a dry run** to test without risk
4. **Check the Import ID** when reporting issues
5. **Contact support** with:
   - Import ID
   - Error messages
   - Template file (sanitized)
   - Screenshots if applicable

## Quick Reference

### Keyboard Shortcuts
- `Ctrl/Cmd + V` - Paste JSON content
- `Tab` - Navigate between fields
- `Enter` - Submit forms

### File Requirements
- Format: `.json` only
- Size: Maximum 5MB
- Encoding: UTF-8
- Structure: Valid JSON array

### Rate Limits
- Max 100 items per import
- Max 10 imports per hour
- Max 1000 items per day

### Data Validation Rules
- Titles: 1-200 characters
- Descriptions: 10-5000 characters
- Arrays: Max 20-30 items depending on field
- Dates: YYYY-MM-DD or "Flexible"/"Coming Soon"/"TBD"
- Prices: "Free" or currency format with symbol

---

*Last Updated: September 2025*
*Version: 1.0*