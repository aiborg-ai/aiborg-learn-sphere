-- Database optimization: Add indexes for improved query performance
-- These indexes target common query patterns identified in the application

-- ============================================================================
-- COURSES TABLE INDEXES
-- ============================================================================

-- Index for filtering active courses (used in useCourses hook)
CREATE INDEX IF NOT EXISTS idx_courses_is_active
ON courses(is_active)
WHERE is_active = true;

-- Index for sorting courses by sort_order
CREATE INDEX IF NOT EXISTS idx_courses_sort_order
ON courses(sort_order);

-- Composite index for active courses with sorting
CREATE INDEX IF NOT EXISTS idx_courses_active_sort
ON courses(is_active, sort_order)
WHERE is_active = true;

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_courses_category
ON courses(category);

-- Index for level filtering
CREATE INDEX IF NOT EXISTS idx_courses_level
ON courses(level);

-- ============================================================================
-- ENROLLMENTS TABLE INDEXES
-- ============================================================================

-- Index for user-specific enrollment queries
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id
ON enrollments(user_id);

-- Index for course-specific enrollment queries
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id
ON enrollments(course_id);

-- Composite index for user enrollments with timestamp
CREATE INDEX IF NOT EXISTS idx_enrollments_user_created
ON enrollments(user_id, created_at DESC);

-- Index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_status
ON enrollments(payment_status);

-- ============================================================================
-- BLOG_POSTS TABLE INDEXES
-- ============================================================================

-- Index for status filtering (used in BlogPostManager)
CREATE INDEX IF NOT EXISTS idx_blog_posts_status
ON blog_posts(status);

-- Index for published posts with sorting
CREATE INDEX IF NOT EXISTS idx_blog_posts_published
ON blog_posts(status, published_at DESC)
WHERE status = 'published';

-- Index for author queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id
ON blog_posts(author_id);

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id
ON blog_posts(category_id);

-- Index for featured posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured
ON blog_posts(is_featured)
WHERE is_featured = true;

-- Index for slug lookups (unique already provides index, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug
ON blog_posts(slug);

-- ============================================================================
-- BLOG_COMMENTS TABLE INDEXES
-- ============================================================================

-- Index for post-specific comments
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id
ON blog_comments(post_id);

-- Index for user comments
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id
ON blog_comments(user_id);

-- Index for approved comments with sorting
CREATE INDEX IF NOT EXISTS idx_blog_comments_approved
ON blog_comments(post_id, is_approved, created_at DESC)
WHERE is_approved = true;

-- ============================================================================
-- BLOG_LIKES TABLE INDEXES
-- ============================================================================

-- Index for post likes count
CREATE INDEX IF NOT EXISTS idx_blog_likes_post_id
ON blog_likes(post_id);

-- Index for user likes
CREATE INDEX IF NOT EXISTS idx_blog_likes_user_id
ON blog_likes(user_id);

-- ============================================================================
-- USER_PROGRESS TABLE INDEXES
-- ============================================================================

-- Index for user progress queries
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id
ON user_progress(user_id);

-- Index for course progress queries
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id
ON user_progress(course_id);

-- Composite index for user progress with last accessed
CREATE INDEX IF NOT EXISTS idx_user_progress_user_accessed
ON user_progress(user_id, last_accessed DESC);

-- ============================================================================
-- USER_DASHBOARD TABLE INDEXES
-- ============================================================================

-- Index for user dashboard queries (primary key already indexed, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_user_dashboard_user_id
ON user_dashboard(user_id);

-- ============================================================================
-- ASSIGNMENTS TABLE INDEXES
-- ============================================================================

-- Index for course assignments
CREATE INDEX IF NOT EXISTS idx_assignments_course_id
ON assignments(course_id);

-- Index for due date sorting
CREATE INDEX IF NOT EXISTS idx_assignments_due_date
ON assignments(due_date);

-- Composite index for course assignments with due date
CREATE INDEX IF NOT EXISTS idx_assignments_course_due
ON assignments(course_id, due_date);

-- ============================================================================
-- ASSIGNMENT_SUBMISSIONS TABLE INDEXES
-- ============================================================================

-- Index for user submissions
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_user_id
ON assignment_submissions(user_id);

-- Index for assignment submissions
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id
ON assignment_submissions(assignment_id);

-- Index for grading status
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status
ON assignment_submissions(status);

-- ============================================================================
-- EVENTS TABLE INDEXES
-- ============================================================================

-- Index for active events
CREATE INDEX IF NOT EXISTS idx_events_is_active
ON events(is_active)
WHERE is_active = true;

-- Index for event date sorting
CREATE INDEX IF NOT EXISTS idx_events_event_date
ON events(event_date);

-- Composite index for active events with date
CREATE INDEX IF NOT EXISTS idx_events_active_date
ON events(is_active, event_date)
WHERE is_active = true;

-- ============================================================================
-- NOTIFICATIONS TABLE INDEXES
-- ============================================================================

-- Index for user notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id
ON notifications(user_id);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread
ON notifications(user_id, is_read, created_at DESC)
WHERE is_read = false;

-- ============================================================================
-- PROFILES TABLE INDEXES
-- ============================================================================

-- Index for email lookups (if not already unique)
CREATE INDEX IF NOT EXISTS idx_profiles_email
ON profiles(email);

-- Index for display name searches
CREATE INDEX IF NOT EXISTS idx_profiles_display_name
ON profiles(display_name);

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Update table statistics for query planner optimization
ANALYZE courses;
ANALYZE enrollments;
ANALYZE blog_posts;
ANALYZE blog_comments;
ANALYZE blog_likes;
ANALYZE user_progress;
ANALYZE user_dashboard;
ANALYZE assignments;
ANALYZE assignment_submissions;
ANALYZE events;
ANALYZE notifications;
ANALYZE profiles;

-- ============================================================================
-- PERFORMANCE MONITORING VIEWS
-- ============================================================================

-- Create a view to monitor slow queries (requires pg_stat_statements extension)
CREATE OR REPLACE VIEW slow_queries AS
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    stddev_exec_time,
    rows
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- queries taking more than 100ms on average
ORDER BY mean_exec_time DESC
LIMIT 50;

-- Create a view to monitor index usage
CREATE OR REPLACE VIEW index_usage AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Create a view to identify missing indexes
CREATE OR REPLACE VIEW missing_indexes AS
SELECT
    schemaname,
    tablename,
    seq_scan - idx_scan as too_many_seq_scans,
    CASE
        WHEN seq_scan - idx_scan > 0
        THEN 'Missing Index?'
        ELSE 'OK'
    END as assessment,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename::regclass)) AS table_size
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
AND schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY seq_scan - idx_scan DESC;

COMMENT ON VIEW slow_queries IS 'Monitor queries with high execution time';
COMMENT ON VIEW index_usage IS 'Track index usage statistics';
COMMENT ON VIEW missing_indexes IS 'Identify tables that might benefit from additional indexes';