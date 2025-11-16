# 📊 Dashboard Builder - Complete Guide

## Overview

The Dashboard Builder is a powerful, customizable dashboard creation system that allows users to create personalized learning dashboards with drag-and-drop functionality, real-time data, and sharing capabilities.

**Access**: Navigate to `/dashboard-builder` in the application.

---

## 🎯 Key Features

### 1. Widget Library (17 Widgets)
Choose from 17 pre-built widget types organized into 5 categories:

#### **Metrics Widgets** (5)
- **Stats**: Quick overview of courses, achievements, certificates, streaks
- **Achievements**: Achievement grid with icons and categories
- **Certificates**: Certificate list with download/preview
- **Streaks**: Daily streak tracker with 7-day calendar
- **Enrollment Stats**: Enrollment breakdown by status

#### **Progress Widgets** (4)
- **Course Progress**: Progress bars for enrolled courses
- **Learning Paths**: AI learning path milestones
- **Skill Chart**: Radar chart for skill development
- **Progress Summary**: Overall progress with milestones

#### **Charts Widgets** (4)
- **Performance Chart**: Line/bar chart for performance over time
- **Time Tracking**: Bar chart for time spent learning
- **Assessment Scores**: Scores with pass rate visualization
- **Learning Velocity**: Area chart measuring learning pace

#### **Activity Widgets** (5)
- **Notifications**: Real-time notifications feed
- **Assignments**: Pending assignments with deadlines
- **Upcoming Events**: Event list with dates
- **Recent Activity**: Timeline of recent activities
- **Calendar**: Mini calendar with events and deadlines

#### **Insights Widgets** (2)
- **AI Insights**: AI-generated personalized insights
- **Study Recommendations**: Personalized course recommendations

### 2. Drag-and-Drop Canvas
- **12-column responsive grid** system
- **Drag widgets** to rearrange layout
- **Resize widgets** with 8-directional handles (N, S, E, W, NE, NW, SE, SW)
- **Collision detection** prevents widget overlap
- **Grid snapping** for precise alignment
- **Auto-save** your layout

### 3. Widget Controls
Each widget has individual controls:
- **Lock**: Prevent accidental moves/resize
- **Hide**: Hide widget without removing
- **Configure**: Customize widget settings
- **Remove**: Delete widget from dashboard

### 4. Sharing System

#### **Private Link Sharing**
- Create shareable links with custom settings
- **Expiration**: 1 day, 7 days, 30 days, or never
- **Usage limits**: Set max number of uses (0 = unlimited)
- **Authentication**: Require login to view
- View link statistics (usage count, expiration)
- Copy links to clipboard
- Revoke links anytime

#### **Template Gallery**
- Publish dashboards as public templates
- Browse community templates
- **Search** by keywords
- **Filter** by category (Student, Instructor, Admin, Analytics)
- **Sort** by popular, rating, or recent
- **Rate** templates (1-5 stars)
- **Favorite** templates
- **Clone** templates with one click

### 5. Multi-View Management
- Create multiple dashboard views
- **Rename**, **duplicate**, or **delete** views
- Set **default view** to load on startup
- View widget count and last updated date
- Quick switch between views

### 6. Import/Export
- **Export** dashboard configuration as JSON
- **Import** saved configurations
- Share configurations with team members
- Backup your dashboard layouts

---

## 🚀 Getting Started

### First Time Setup

1. **Navigate** to `/dashboard-builder`
2. **Create your first view**:
   - Click "Manage Views" button
   - Click "Create New View"
   - Enter a name (e.g., "My Learning Dashboard")
   - Click create

3. **Enter Edit Mode**:
   - Click the "Edit" button in the toolbar
   - The widget palette appears on the left

4. **Add Widgets**:
   - Browse the widget library by category
   - Click any widget to add it to your dashboard
   - Widgets appear on the canvas

5. **Customize Layout**:
   - **Drag** widgets by their header to move
   - **Resize** by dragging the edges/corners
   - **Configure** by clicking the settings icon
   - **Lock** widgets to prevent changes

6. **Save**:
   - Changes are auto-saved
   - Or click "Save" button manually

---

## 📝 Common Workflows

### Creating a Student Dashboard

```
1. Add "Stats" widget for overview
2. Add "Course Progress" to track courses
3. Add "Notifications" for updates
4. Add "Assignments" for deadlines
5. Add "Calendar" for schedule
6. Arrange widgets in priority order
7. Save and switch to View mode
```

### Creating an Analytics Dashboard

```
1. Add "Performance Chart" for trends
2. Add "Assessment Scores" for results
3. Add "Time Tracking" for study time
4. Add "Learning Velocity" for pace
5. Add "Skill Chart" for skill levels
6. Arrange for easy comparison
7. Save and share with instructor
```

### Publishing a Template

```
1. Create a well-designed dashboard
2. Click the Share button
3. Switch to "Publish Template" tab
4. Enter template name and description
5. Select category
6. Add tags (comma-separated)
7. Click "Publish to Gallery"
8. Template appears in public gallery
```

---

## ⚙️ Widget Configuration

Each widget type has specific configuration options:

### Common Settings (All Widgets)
- **Title**: Custom title (defaults to widget name)
- **Show Title**: Toggle title visibility
- **Refresh Interval**: Auto-refresh in seconds (0 = disabled)

### List/Feed Widgets
- **Number of Items**: How many items to display (1-20)
- **Show Timestamps**: Display time information
- **Group by Date**: Group activities by day (Recent Activity only)
- **Sort By**: Date, Name, or Progress

### Chart Widgets
- **Chart Type**: Line, Bar, or Area (Performance Chart only)
- **Show Percentage**: Display as percentage

### Calendar Widget
- **Show Events**: Display event indicators
- **Show Deadlines**: Display deadline indicators

---

## 🎨 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo last change |
| `Ctrl/Cmd + Shift + Z` | Redo last change |
| `Ctrl/Cmd + S` | Save dashboard |
| `Escape` | Exit onboarding tour |

---

## 🔧 Technical Details

### Data Fetching
- All widgets use **TanStack Query** for data fetching
- **Automatic caching** for better performance
- **Auto-refetch** based on refresh interval
- **Disabled queries** when in edit mode (saves bandwidth)

### Responsive Design
- **Desktop**: 12-column grid
- **Tablet**: 6-column grid
- **Mobile**: 1-column grid (stacked)

### Performance
- **Lazy loading** of widget components
- **Suspense boundaries** for loading states
- **Memoized calculations** for grid positioning
- **Debounced resize** operations

### Storage
- Dashboard configurations stored in **Supabase**
- Onboarding completion stored in **localStorage**
- Share tokens securely generated server-side

---

## 🐛 Troubleshooting

### Widgets not loading?
- Check internet connection
- Verify authentication (logged in)
- Refresh the page
- Check browser console for errors

### Can't resize widget?
- Ensure widget is not locked (unlock icon)
- Check if you're in Edit mode
- Try refreshing the page

### Share link not working?
- Check if link has expired
- Verify max uses not reached
- Ensure recipient has required authentication

### Template not appearing in gallery?
- Allow a few seconds for indexing
- Check if category filter is hiding it
- Verify template was published successfully

---

## 📊 Database Schema

### Key Tables
- `custom_dashboard_views`: User dashboard configurations
- `shared_dashboard_templates`: Published templates
- `dashboard_share_links`: Private share links
- `dashboard_template_ratings`: Template ratings

### Relationships
```
User (1) ─── (M) DashboardViews
DashboardView (1) ─── (M) ShareLinks
DashboardView (1) ─── (1) PublishedTemplate
PublishedTemplate (1) ─── (M) Ratings
```

---

## 🚀 Future Enhancements

Potential future features:
- [ ] Real-time collaborative editing
- [ ] Widget marketplace (community widgets)
- [ ] Advanced filtering/sorting options
- [ ] Mobile app support
- [ ] Export to PDF/Image
- [ ] Widget versioning
- [ ] A/B testing for layouts
- [ ] Analytics on dashboard usage

---

## 📞 Support

For issues or questions:
1. Check this guide first
2. Review the in-app onboarding tour
3. Contact support with:
   - Dashboard view ID
   - Widget types affected
   - Browser and OS version
   - Screenshots if applicable

---

## 🎓 Best Practices

### Design Principles
1. **Prioritize important widgets** at the top
2. **Group related widgets** together
3. **Use consistent sizing** for visual harmony
4. **Leave whitespace** - don't overcrowd
5. **Test on different screen sizes**

### Performance Tips
1. **Limit total widgets** to 10-15 per view
2. **Use longer refresh intervals** for static data
3. **Disable auto-refresh** for infrequently changing data
4. **Create multiple views** instead of one cluttered view

### Sharing Tips
1. **Use descriptive names** for templates
2. **Add relevant tags** for discoverability
3. **Include description** explaining use case
4. **Set appropriate expiration** for share links
5. **Monitor usage** of shared dashboards

---

## 📚 Related Documentation

- [Widget Development Guide](./docs/WIDGET_DEVELOPMENT.md)
- [Database Schema](./supabase/migrations/)
- [API Documentation](./docs/API.md)
- [Accessibility Guide](./docs/ACCESSIBILITY.md)

---

**Version**: 1.0.0
**Last Updated**: November 2025
**Author**: AiBorg Learn Sphere Team

🚀 Built with Claude Code
