#!/bin/bash
# Fix and Deploy 500 Blog Articles
# This script fixes the author_id constraint and deploys all batches

set -e  # Exit on error

echo "========================================="
echo "Blog Articles - Fix and Deploy"
echo "========================================="
echo ""

# Database connection details
export PGPASSWORD='hirendra$1234ABCD'
DB_HOST="aws-0-ap-south-1.pooler.supabase.com"
DB_PORT="5432"
DB_USER="postgres.afrulkxxzcmngbrdfuzj"
DB_NAME="postgres"

echo "Database: $DB_HOST"
echo "User: $DB_USER"
echo ""

# Step 1: Fix author_id constraint
echo "Step 1: Fixing author_id constraint..."
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "00_fix_author_id.sql" --quiet

if [ $? -eq 0 ]; then
    echo "✓ Author ID constraint fixed"
else
    echo "✗ Failed to fix constraint"
    exit 1
fi

echo ""

# Step 2: Deploy all batches
echo "Step 2: Deploying blog articles..."
echo ""

for i in {01..10}; do
    filename="batch_${i}_blog_articles.sql"
    echo "Executing Batch $i: $filename"

    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$filename" --quiet

    if [ $? -eq 0 ]; then
        echo "✓ Batch $i completed successfully"
    else
        echo "✗ Batch $i failed"
        exit 1
    fi

    echo ""
done

echo "========================================="
echo "All batches completed successfully!"
echo "========================================="
echo ""

# Verify deployment
echo "Verifying deployment..."
TOTAL=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM blog_posts;")

echo "Total articles in database: $TOTAL"
echo ""

if [ "$TOTAL" -ge 500 ]; then
    echo "✅ Success! All 500+ articles deployed"
else
    echo "⚠️  Warning: Expected 500+ articles, found $TOTAL"
fi

echo ""
echo "Done! Check your admin dashboard at https://www.aiborg.ai/admin"
