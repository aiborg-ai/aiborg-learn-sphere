# Batch Blog Scheduler Components

This directory contains all UI components for the Batch Blog Scheduler feature.

## Overview

The Batch Blog Scheduler enables admins to create, schedule, and manage blog posts at scale using AI
assistance.

## Components

### 1. BatchCreator.tsx

Main interface for creating batches of blog posts.

**Features:**

- 3 input methods: Manual entry, Template selection, AI topic generation
- Bulk parameters: audience, tone, length, keywords, category, tags
- Auto-scheduling with smart distribution
- Campaign assignment
- Real-time progress monitoring
- Topic validation (max 50 posts per batch)

**Dependencies:**

- `BatchProgressMonitor` - Shows real-time generation progress
- `BlogTemplateService` - Loads templates
- `BlogCampaignService` - Manages campaigns
- `BatchGenerationService` - Creates batch jobs

**Usage:**

```tsx
import { BatchCreator } from '@/components/batch-blog-scheduler/BatchCreator';

<BatchCreator />;
```

### 2. PublishingCalendar.tsx

Calendar view for managing scheduled posts.

**Features:**

- Month/category/status filters
- Posts grouped by date
- Reschedule dialog
- Publish now action
- Delete posts
- Time display for scheduled posts

**Dependencies:**

- Supabase `blog_posts` table
- `date-fns` for date formatting
- shadcn/ui Calendar component

**Usage:**

```tsx
import { PublishingCalendar } from '@/components/batch-blog-scheduler/PublishingCalendar';

<PublishingCalendar />;
```

### 3. TemplateManager.tsx

CRUD interface for blog templates.

**Features:**

- Template list table
- Create/edit dialog
- Duplicate templates
- Delete templates
- Usage count tracking
- Pre-populated seed templates

**Template Fields:**

- Name, description
- Topic template (with `{topic}` placeholder)
- Audience, tone, length
- Keywords, category, default tags

**Usage:**

```tsx
import { TemplateManager } from '@/components/batch-blog-scheduler/TemplateManager';

<TemplateManager />;
```

### 4. CampaignManager.tsx

Manage blog campaigns (groups of related posts).

**Features:**

- Campaign cards grid
- Create/edit campaigns
- Progress tracking (published vs scheduled vs draft)
- Analytics modal with engagement metrics
- Add existing posts to campaigns
- Generate batch for campaign

**Campaign Fields:**

- Name, description
- Status, date range
- Target post count, actual post count
- Posts list with status

**Usage:**

```tsx
import { CampaignManager } from '@/components/batch-blog-scheduler/CampaignManager';

<CampaignManager />;
```

### 5. BatchJobsHistory.tsx

View and manage batch generation jobs.

**Features:**

- Statistics cards (total jobs, posts generated, success rate, avg posts/job)
- Jobs table with status, progress, duration
- Job details modal
- Retry failed posts
- Error log display

**Job Status:**

- Pending, Processing, Completed, Failed, Cancelled

**Usage:**

```tsx
import { BatchJobsHistory } from '@/components/batch-blog-scheduler/BatchJobsHistory';

<BatchJobsHistory />;
```

### 6. BatchProgressMonitor.tsx

Real-time progress modal during batch generation.

**Features:**

- Progress bar (completed/total)
- Current post being generated
- Success/failed post lists
- Estimated time remaining
- Cancel batch button
- Auto-polling (every 3 seconds)

**Usage:**

```tsx
import { BatchProgressMonitor } from '@/components/batch-blog-scheduler/BatchProgressMonitor';

const [jobId, setJobId] = useState<string | null>(null);

<BatchProgressMonitor
  jobId={jobId}
  isOpen={!!jobId}
  onClose={() => setJobId(null)}
  onComplete={() => {
    setJobId(null);
    // Refresh data
  }}
/>;
```

## Data Flow

```
┌─────────────────┐
│  BatchCreator   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ BatchGenerationService  │
│  - createBatchJob()     │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────┐
│ generate-batch-blogs     │ (Edge Function)
│  - Sequential processing │
│  - Calls generate-blog-  │
│    post for each topic   │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  blog_batch_jobs table   │
│  - Tracks progress       │
│  - Stores errors         │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│ BatchProgressMonitor     │
│  - Polls job status      │
│  - Shows real-time UI    │
└──────────────────────────┘
```

## Services Used

All components depend on these services:

- **BlogTemplateService** (`src/services/blog/BlogTemplateService.ts`)
  - Template CRUD operations
  - Usage count tracking

- **BlogCampaignService** (`src/services/blog/BlogCampaignService.ts`)
  - Campaign management
  - Post-campaign associations
  - Analytics aggregation

- **BatchGenerationService** (`src/services/blog/BatchGenerationService.ts`)
  - Batch job creation
  - Status polling
  - Retry logic
  - Job history

- **ScheduleOptimizerService** (`src/services/blog/ScheduleOptimizerService.ts`)
  - Auto-distribution algorithm
  - Schedule gap analysis
  - Publishing pattern analytics

## Database Tables

Components interact with these tables:

- `blog_posts` - Existing blog posts table (with `scheduled_for`, `status`)
- `blog_templates` - Reusable generation templates
- `blog_campaigns` - Campaign groups
- `blog_post_campaigns` - Post-campaign junction table
- `blog_batch_jobs` - Batch job tracking

## Edge Functions

- **publish-scheduled-blogs** - Auto-publisher (runs via cron every 15 min)
- **generate-batch-blogs** - Batch generator (called by BatchCreator)
- **check-batch-status** - Status checker (polled by BatchProgressMonitor)

## Styling

All components use:

- **shadcn/ui** components (Card, Button, Dialog, Table, etc.)
- **Tailwind CSS** for styling
- **Lucide React** for icons
- Consistent color scheme (primary, muted, destructive)

## State Management

- **React Hook Form** - Form handling
- **Zod** - Validation schemas
- **React useState** - Local component state
- **Supabase real-time** (potential future enhancement)

## Best Practices

1. **Error Handling**: All components show toast notifications on errors
2. **Loading States**: Skeleton loaders or spinners during data fetching
3. **Validation**: Form validation with clear error messages
4. **Accessibility**: Proper ARIA labels, keyboard navigation
5. **Responsive**: Mobile-friendly layouts
6. **Performance**: Lazy loading, pagination where needed

## Testing

To test components:

1. **Unit Tests**: Test service methods independently
2. **Integration Tests**: Test component + service interactions
3. **E2E Tests**: Test complete batch creation workflow

Example test (using Vitest):

```typescript
import { render, screen } from '@testing-library/react';
import { BatchCreator } from './BatchCreator';

describe('BatchCreator', () => {
  it('renders topic input methods', () => {
    render(<BatchCreator />);
    expect(screen.getByText('Manual Entry')).toBeInTheDocument();
    expect(screen.getByText('Use Template')).toBeInTheDocument();
    expect(screen.getByText('AI Generate Topics')).toBeInTheDocument();
  });
});
```

## Future Enhancements

Potential improvements:

- Real-time collaboration (multiple admins)
- A/B testing for post variations
- AI-suggested topics based on trends
- Social media auto-posting
- Content quality scoring (SEO, readability)
- Multi-language batch generation
- Recurring campaigns (auto-create monthly)

## Support

For issues or questions:

- Check component console errors
- Review Edge Function logs in Supabase
- Verify database RLS policies
- Test services independently
- Check network tab for API calls

## Related Documentation

- [Setup Guide](../../../docs/BATCH_BLOG_SCHEDULER_SETUP.md)
- [Implementation Plan](../../../.claude/plans/mellow-meandering-mccarthy.md)
- [Type Definitions](../../types/blog-scheduler.ts)
- [Services](../../services/blog/)
