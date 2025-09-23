# Template Processing System Documentation

## 📚 Overview

The Template Processing System enables bulk import of courses and events into the AIBorg Learn Sphere platform through JSON templates. This system provides validation, duplicate detection, error handling, and comprehensive import tracking.

## 📁 Documentation Structure

```
docs/template-system/
├── README.md                     # This file
├── ADMIN_GUIDE.md               # User guide for administrators
├── API_DOCUMENTATION.md         # Technical API reference
└── sample-templates/            # Ready-to-use JSON templates
    ├── technology-courses.json  # Tech course examples
    ├── business-courses.json    # Business course examples
    ├── workshop-events.json     # Workshop templates
    ├── webinar-events.json      # Webinar templates
    └── conference-events.json  # Conference templates
```

## 🚀 Quick Start

### For Administrators

1. **Read the Admin Guide**: [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)
2. **Download sample templates** from `sample-templates/` directory
3. **Access the system** at `/admin/template-import`
4. **Follow the workflow**: Upload → Validate → Configure → Import → Review

### For Developers

1. **Review API Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
2. **Understand the schemas** for courses and events
3. **Test with sample templates** before production use
4. **Integrate using provided SDK examples**

## 🎯 Key Features

### ✅ Validation
- **Schema validation** with Zod
- **Field-level error reporting**
- **Helpful suggestions** for fixing errors
- **Warning system** for non-critical issues

### 🔍 Duplicate Detection
- **Within-batch detection** (same file)
- **Database detection** (existing records)
- **Configurable handling** (skip/update)
- **Multiple criteria** matching

### 📊 Import Management
- **Batch processing** up to 100 items
- **Progress tracking** in real-time
- **Rollback capability** on failure
- **Dry run mode** for testing

### 📈 History & Analytics
- **Complete audit trail**
- **Import statistics**
- **Detailed error logs**
- **Performance metrics**

## 💾 Sample Templates

We provide ready-to-use templates for common scenarios:

### Course Templates
- **Technology Courses** - Web development, AI/ML, cloud computing
- **Business Courses** - Marketing, finance, project management
- **Professional Development** - Communication, leadership, soft skills

### Event Templates
- **Workshops** - Hands-on technical workshops
- **Webinars** - Online presentations and discussions
- **Conferences** - Multi-day events with multiple tracks
- **Seminars** - Educational and training sessions

## 🔧 Technical Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐
│   Frontend  │────▶│ Edge Functions│────▶│   Database    │
│  React/TS   │     │   Deno/TS    │     │  PostgreSQL   │
└─────────────┘     └──────────────┘     └───────────────┘
       │                    │                      │
       ▼                    ▼                      ▼
  [UI Components]    [Validation]          [RLS Policies]
  [File Upload]      [Import Logic]        [Audit Tables]
  [Progress Bar]     [Duplicate Check]     [Transactions]
```

### Components

1. **Frontend (React/TypeScript)**
   - Template upload component
   - Validation UI
   - Import progress tracker
   - History viewer

2. **Edge Functions (Deno)**
   - `/validate-template` - Schema validation
   - `/import-template` - Database import
   - `/import-history` - Historical data

3. **Database (PostgreSQL/Supabase)**
   - `template_imports` - Import records
   - `template_import_items` - Individual items
   - `template_import_audit` - Audit trail

## 📝 Template Format

### Minimal Course Example
```json
{
  "courses": [{
    "title": "Introduction to Programming",
    "description": "Learn programming fundamentals",
    "audiences": ["Student"],
    "mode": "Online",
    "duration": "8 weeks",
    "price": "₹5000",
    "level": "Beginner",
    "start_date": "2025-03-01",
    "features": ["Video lessons"],
    "keywords": ["programming"],
    "category": "Technology"
  }]
}
```

### Minimal Event Example
```json
{
  "events": [{
    "title": "Tech Workshop",
    "description": "Hands-on technology workshop",
    "event_type": "workshop",
    "audiences": ["Professional"],
    "date": "2025-03-15",
    "time": "2:00 PM IST",
    "duration": "3 hours",
    "mode": "online",
    "price": "Free",
    "tags": ["technology"]
  }]
}
```

## 🛠 Import Options

| Option | Description | Default |
|--------|-------------|---------|
| `skip_duplicates` | Skip items that already exist | `true` |
| `update_existing` | Update existing items | `false` |
| `dry_run` | Preview without changes | `false` |
| `send_notifications` | Notify users | `false` |
| `auto_publish` | Make visible immediately | `false` |

## 📊 Statistics & Metrics

The system tracks:
- Total imports performed
- Success/failure rates
- Items imported/updated/skipped
- Average processing time
- Error frequency by type

## 🔐 Security

- **Authentication required** via Supabase Auth
- **Admin role required** for all operations
- **Row Level Security (RLS)** enforced
- **Input validation** at multiple levels
- **SQL injection prevention** via parameterized queries
- **Rate limiting** on API endpoints

## 🐛 Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Validation fails | Invalid JSON format | Use JSON validator |
| Duplicates not detected | Case sensitivity | Check exact matching |
| Import hangs | Large batch size | Reduce to <50 items |
| Items not visible | Display flag false | Set `display: true` |

### Error Codes

- `VALIDATION_ERROR` - Fix data format
- `DUPLICATE_ERROR` - Use skip option
- `UNAUTHORIZED` - Check permissions
- `SERVER_ERROR` - Contact support

## 📈 Performance Guidelines

- **Batch Size**: 50-100 items optimal
- **File Size**: Maximum 5MB
- **Processing Time**: ~1-2 seconds per item
- **Rate Limits**: 10 imports/minute

## 🤝 Contributing

To improve the template system:
1. Test with sample data
2. Report issues with Import ID
3. Suggest template improvements
4. Contribute documentation updates

## 📞 Support

- **Documentation**: This directory
- **Admin Guide**: [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)
- **API Reference**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Issues**: Create GitHub issue with:
  - Import ID
  - Error messages
  - Template sample (sanitized)
  - Screenshots

## 🔄 Version History

### Version 1.0 (September 2025)
- Initial release
- Course and event import
- Validation and duplicate detection
- Import history and statistics
- Sample templates
- Complete documentation

### Planned Features
- CSV import support
- Template export functionality
- Scheduled imports
- Webhook notifications
- Advanced analytics dashboard
- Template versioning

---

**Created by**: AIBorg Team
**Last Updated**: September 2025
**License**: MIT