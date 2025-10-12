#!/bin/bash
# Helper script to view batch files for manual deployment
# Usage: ./view_batch.sh 01

if [ -z "$1" ]; then
    echo "Usage: ./view_batch.sh <batch_number>"
    echo "Example: ./view_batch.sh 01"
    echo ""
    echo "Available batches:"
    ls -1 batch_*.sql | sed 's/batch_/  /' | sed 's/_blog_articles.sql//'
    exit 1
fi

BATCH_FILE="batch_${1}_blog_articles.sql"

if [ ! -f "$BATCH_FILE" ]; then
    echo "Error: $BATCH_FILE not found"
    echo ""
    echo "Available batches:"
    ls -1 batch_*.sql | sed 's/batch_/  /' | sed 's/_blog_articles.sql//'
    exit 1
fi

echo "=========================================="
echo "Batch $1 - Ready to copy"
echo "=========================================="
echo "File: $BATCH_FILE"
echo "Size: $(du -h $BATCH_FILE | cut -f1)"
echo ""
echo "INSTRUCTIONS:"
echo "1. Copy the content below"
echo "2. Go to Supabase Dashboard → SQL Editor"
echo "3. Paste and click 'Run'"
echo ""
echo "=========================================="
echo ""
cat "$BATCH_FILE"
