#!/bin/bash
# Master script to insert all 500 blog articles
# Usage: ./insert_all_blog_articles.sh

set -e  # Exit on error

echo "========================================="
echo "Blog Articles Bulk Insert Script"
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

# Function to execute SQL file
execute_batch() {
    local batch_num=$1
    local filename="batch_${batch_num}_blog_articles.sql"

    echo "Executing Batch $batch_num: $filename"

    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$filename" --quiet

    if [ $? -eq 0 ]; then
        echo "✓ Batch $batch_num completed successfully"
    else
        echo "✗ Batch $batch_num failed"
        exit 1
    fi

    echo ""
}

# Execute all batches
execute_batch 01
execute_batch 02
execute_batch 03
execute_batch 04
execute_batch 05
execute_batch 06
execute_batch 07
execute_batch 08
execute_batch 09
execute_batch 10

echo "========================================="
echo "All batches completed successfully!"
echo "========================================="
echo ""
echo "Verifying insertion..."

# Count total articles
TOTAL=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM blog_posts;")

echo "Total articles in database: $TOTAL"
echo ""
echo "Done!"
