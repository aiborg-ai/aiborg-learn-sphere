# Migration Conflict Fix Guide

## Problem

You're seeing this error:

```
ERROR: 42710: policy "Admins can update all profiles" for table "profiles" already exists
```

This means some RLS policies already exist in your database from previous migrations.

## Solution: Apply Migrations Manually (Skip Existing)

Since some policies already exist, we need to apply migrations selectively. Here's how:

---

## Option 1: Apply Via SQL Editor (Recommended)

Apply each migration manually, checking for existing objects:

### Step 1: Check What Already Exists

Run this query first to see what's already in your database:

```sql
-- Check existing tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'failed_login_attempts',
    'account_lockout_status',
    'security_audit_log',
    'rate_limit_config',
    'rate_limit_tracking',
    'encrypted_pii',
    'encryption_keys',
    'pii_access_log',
    'user_consents',
    'data_export_requests',
    'data_deletion_requests',
    'api_keys',
    'api_key_usage_log',
    'data_retention_policies'
  )
ORDER BY table_name;

-- Check existing RLS policies
SELECT tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Step 2: Apply Migrations Selectively

For each migration file, apply **only the sections that create NEW objects**:

#### Migration 1: Account Lockout System

File: `supabase/migrations/20251109000000_account_lockout_system.sql`

**Check if tables exist:**

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'failed_login_attempts'
);
```

If returns `false`, apply the **entire migration**.

If returns `true`, apply **only these sections**:

1. New functions (record_failed_login_attempt, check_account_lockout, etc.)
2. Skip table creation
3. Skip existing RLS policies

#### Migration 2: RLS Security Audit

File: `supabase/migrations/20251109000001_rls_security_audit.sql`

**This migration will have conflicts** - many policies already exist.

**Solution**: Apply only NEW tables and functions:

```sql
-- 1. Create security_audit_log table (if doesn't exist)
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  resource TEXT,
  action TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create index
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created_at
  ON public.security_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id
  ON public.security_audit_log(user_id);

CREATE INDEX IF NOT EXISTS idx_security_audit_log_event_type
  ON public.security_audit_log(event_type);

-- 3. Enable RLS
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- 4. Create policy (skip if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'security_audit_log'
    AND policyname = 'Admins can view all audit logs'
  ) THEN
    CREATE POLICY "Admins can view all audit logs"
      ON public.security_audit_log FOR SELECT TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;
```

**Skip**: All existing RLS policies for profiles, courses, enrollments, etc.

#### Migration 3: Rate Limiting System

File: `supabase/migrations/20251109000002_rate_limiting_system.sql`

Check if tables exist, then apply full migration if new:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'rate_limit_config'
);
```

If `false`, apply **entire migration**.

#### Migration 4: PII Encryption System

File: `supabase/migrations/20251109000003_pii_encryption_system.sql`

Check if tables exist:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'encrypted_pii'
);
```

If `false`, apply **entire migration**.

**IMPORTANT**: This requires encryption key to be set first!

#### Migration 5: GDPR Compliance System

File: `supabase/migrations/20251109000004_gdpr_compliance_system.sql`

Check if tables exist:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'user_consents'
);
```

If `false`, apply **entire migration**.

#### Migration 6: API Key Rotation System

File: `supabase/migrations/20251109000005_api_key_rotation_system.sql`

Check if tables exist:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'api_keys'
);
```

If `false`, apply **entire migration**.

#### Migration 7: Data Retention Automation

File: `supabase/migrations/20251109000006_data_retention_automation.sql`

Check if tables exist:

```sql
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'data_retention_policies'
);
```

If `false`, apply **entire migration**.

---

## Option 2: Simplified - Apply Only Core Tables

If you want to quickly get the core features working, apply ONLY these:

### 1. Account Lockout (if not exists)

```sql
CREATE TABLE IF NOT EXISTS public.failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.account_lockout_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  locked_until TIMESTAMPTZ NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 2. Rate Limiting (if not exists)

```sql
CREATE TABLE IF NOT EXISTS public.rate_limit_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT UNIQUE NOT NULL,
  max_requests INTEGER NOT NULL,
  window_seconds INTEGER NOT NULL,
  enabled BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  window_end TIMESTAMPTZ NOT NULL
);

-- Insert default config
INSERT INTO public.rate_limit_config (endpoint, max_requests, window_seconds) VALUES
  ('/auth/login', 5, 300),
  ('/auth/signup', 3, 3600),
  ('/api/chat', 30, 60),
  ('*', 100, 60)
ON CONFLICT (endpoint) DO NOTHING;
```

### 3. PII Encryption (if not exists)

```sql
CREATE TABLE IF NOT EXISTS public.encrypted_pii (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_encrypted BYTEA,
  address_encrypted BYTEA,
  date_of_birth_encrypted BYTEA,
  national_id_encrypted BYTEA,
  encryption_key_id UUID,
  encrypted_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.encryption_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT UNIQUE NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'aes-256-gcm',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rotated_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE
);
```

### 4. GDPR Compliance (if not exists)

```sql
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  consent_version TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.data_export_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  export_format TEXT NOT NULL DEFAULT 'json',
  completed_at TIMESTAMPTZ,
  download_url TEXT,
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  approved_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMPTZ,
  data_snapshot JSONB
);
```

### 5. API Keys (if not exists)

```sql
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  key_prefix TEXT NOT NULL,
  scopes TEXT[] DEFAULT ARRAY['read'],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  rotated_to UUID REFERENCES public.api_keys(id)
);
```

---

## Verification After Manual Application

After applying the tables manually, verify:

```sql
-- Check all new tables exist
SELECT table_name,
       pg_size_pretty(pg_total_relation_size(quote_ident(table_name)::regclass)) as size
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'failed_login_attempts',
    'account_lockout_status',
    'rate_limit_config',
    'rate_limit_tracking',
    'encrypted_pii',
    'encryption_keys',
    'user_consents',
    'data_export_requests',
    'data_deletion_requests',
    'api_keys'
  )
ORDER BY table_name;
```

Expected: All tables listed

---

## Next Steps After Tables Created

1. **Set Encryption Key**: See Step 3 in READY_TO_CONFIGURE.md
2. **Apply Functions**: Open migration files and copy-paste function definitions
3. **Configure Magic Link**: See Steps 4-6 in READY_TO_CONFIGURE.md

---

## Why This Happened

Your database already has some RLS policies from previous migrations (likely from blog or course
management features). The new security hardening migrations tried to create policies that already
exist, causing conflicts.

This is **not a problem** - it just means we need to skip existing objects and add only new ones.

---

## Quick Summary

**Easiest Path:**

1. Apply Option 2 (Simplified - Core Tables) using SQL Editor
2. Skip all function creation for now (functions are optional for basic features)
3. Set encryption key
4. Configure magic link
5. Test features

**Complete Path:**

1. Check what exists using verification queries
2. Apply each migration section-by-section, skipping existing policies
3. Apply all functions from migration files
4. Set encryption key
5. Configure magic link
6. Test all features

Both paths will work - Option 2 is faster to get started!
