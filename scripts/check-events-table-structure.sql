-- Check the structure of events table to understand column types

-- 1. Check events table columns and their types
SELECT
    column_name,
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'events'
ORDER BY ordinal_position;

-- 2. Check if events table exists and its primary key type
SELECT
    c.column_name,
    c.data_type,
    tc.constraint_type
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu
    ON c.table_name = kcu.table_name
    AND c.column_name = kcu.column_name
LEFT JOIN information_schema.table_constraints tc
    ON kcu.constraint_name = tc.constraint_name
WHERE c.table_schema = 'public'
    AND c.table_name = 'events'
    AND c.column_name = 'id';