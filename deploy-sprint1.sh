#!/bin/bash

# Sprint 1 Deployment Script
# Deploys team management database migrations

echo "🚀 Starting Sprint 1 Deployment..."
echo ""

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it or use the Dashboard method."
    echo "   Install: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're linked to a project
if [ ! -f ".supabase/config.toml" ]; then
    echo "❌ Not linked to a Supabase project. Run: supabase link"
    exit 1
fi

echo "✅ Supabase CLI found"
echo ""

# Run migrations in order
echo "📦 Migration 1: Team Invitations..."
supabase db push --file supabase/migrations/20251016120000_team_invitations.sql
if [ $? -ne 0 ]; then
    echo "❌ Migration 1 failed!"
    exit 1
fi
echo "✅ Migration 1 complete"
echo ""

echo "📦 Migration 2: Course Assignments..."
supabase db push --file supabase/migrations/20251016120001_team_course_assignments.sql
if [ $? -ne 0 ]; then
    echo "❌ Migration 2 failed!"
    exit 1
fi
echo "✅ Migration 2 complete"
echo ""

echo "📦 Migration 3: Analytics Views..."
supabase db push --file supabase/migrations/20251016120002_team_analytics_views.sql
if [ $? -ne 0 ]; then
    echo "❌ Migration 3 failed!"
    exit 1
fi
echo "✅ Migration 3 complete"
echo ""

echo "🎉 All migrations completed successfully!"
echo ""
echo "Next steps:"
echo "1. Run verification queries (see SPRINT_1_DEPLOYMENT_GUIDE.md)"
echo "2. Test the services with sample data"
echo "3. Start Sprint 2 UI development"
