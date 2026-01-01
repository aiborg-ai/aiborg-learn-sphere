#!/bin/bash

# Script to apply the progressive onboarding migration
# This helps you manually apply the migration if `npx supabase db push` has conflicts

echo "=========================================="
echo "Progressive Onboarding Migration Script"
echo "=========================================="
echo ""

# Check if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Missing environment variables!"
  echo ""
  echo "Please set:"
  echo "  export SUPABASE_URL='your-supabase-url'"
  echo "  export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
  echo ""
  echo "You can find these in your Supabase project settings:"
  echo "  Project Settings > API > Project URL"
  echo "  Project Settings > API > service_role secret"
  echo ""
  exit 1
fi

echo "✓ Environment variables found"
echo ""
echo "This will create:"
echo "  - user_onboarding_progress table"
echo "  - onboarding_tips table"
echo "  - RLS policies"
echo "  - Helper functions"
echo "  - 15+ predefined onboarding tips"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Cancelled."
  exit 0
fi

echo ""
echo "Applying migration..."
echo ""

# Use psql or curl to apply the migration
MIGRATION_FILE="supabase/migrations/20250101000000_progressive_onboarding.sql"

if command -v psql &> /dev/null; then
  # Use psql if available
  echo "Using psql to apply migration..."
  psql "$SUPABASE_URL" < "$MIGRATION_FILE"
else
  # Fall back to displaying SQL
  echo "⚠️  psql not found. Please apply the migration manually:"
  echo ""
  echo "Option 1: Supabase Dashboard"
  echo "  1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql"
  echo "  2. Copy and paste the contents of:"
  echo "     $MIGRATION_FILE"
  echo "  3. Click 'Run'"
  echo ""
  echo "Option 2: Use psql"
  echo "  psql \"$SUPABASE_URL\" < $MIGRATION_FILE"
  echo ""
fi

echo ""
echo "=========================================="
echo "✅ Done!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Start dev server: npm run dev"
echo "  2. Visit: http://localhost:8080/onboarding-demo"
echo "  3. Test the onboarding tooltips and progress widget"
echo ""
