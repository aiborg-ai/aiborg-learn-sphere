#!/bin/bash

# Vibe Coding Course Setup Script
# This script applies the migrations to create the course, sessions, and materials

set -e  # Exit on error

echo "=========================================="
echo "  Vibe Coding Course Setup"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "supabase/migrations" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check for required migration files
if [ ! -f "supabase/migrations/20251029_vibe_coding_course.sql" ]; then
    echo "❌ Error: Course migration file not found!"
    exit 1
fi

if [ ! -f "supabase/migrations/20251029_vibe_coding_materials.sql" ]; then
    echo "❌ Error: Materials migration file not found!"
    exit 1
fi

echo "✅ Migration files found"
echo ""

# Check if Supabase CLI is installed
if command -v supabase &> /dev/null; then
    echo "📦 Supabase CLI detected"
    echo ""
    echo "Applying migrations using Supabase CLI..."
    echo ""

    # Apply course migration
    echo "1️⃣  Creating course and sessions..."
    supabase db push --include supabase/migrations/20251029_vibe_coding_course.sql

    if [ $? -eq 0 ]; then
        echo "✅ Course and sessions created successfully!"
    else
        echo "❌ Failed to create course and sessions"
        exit 1
    fi

    echo ""
    echo "2️⃣  Creating course materials..."
    supabase db push --include supabase/migrations/20251029_vibe_coding_materials.sql

    if [ $? -eq 0 ]; then
        echo "✅ Course materials created successfully!"
    else
        echo "❌ Failed to create course materials"
        exit 1
    fi

else
    echo "⚠️  Supabase CLI not found"
    echo ""
    echo "Please apply migrations manually using one of these methods:"
    echo ""
    echo "Option 1: Install Supabase CLI"
    echo "  npm install -g supabase"
    echo "  Then run this script again"
    echo ""
    echo "Option 2: Use psql directly"
    echo "  psql \$DATABASE_URL -f supabase/migrations/20251029_vibe_coding_course.sql"
    echo "  psql \$DATABASE_URL -f supabase/migrations/20251029_vibe_coding_materials.sql"
    echo ""
    echo "Option 3: Use Supabase Dashboard"
    echo "  1. Go to your Supabase project dashboard"
    echo "  2. Navigate to SQL Editor"
    echo "  3. Copy and paste contents of each migration file"
    echo "  4. Run them in order"
    echo ""
    exit 1
fi

echo ""
echo "=========================================="
echo "  ✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Verify data was created (see verification queries in VIBE_CODING_SETUP.md)"
echo "2. Update meeting URLs for sessions"
echo "3. Upload course materials to storage"
echo "4. Test registration flow at /sessions"
echo ""
echo "📖 Full documentation: VIBE_CODING_SETUP.md"
echo ""
