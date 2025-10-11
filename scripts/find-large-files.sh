#!/bin/bash
# Large File Finder Script
# Identifies the largest TypeScript files in the codebase

echo "📏 Finding large TypeScript files..."
echo ""

echo "🔝 Top 20 Largest Files:"
echo "------------------------"

find src -name "*.tsx" -o -name "*.ts" 2>/dev/null | \
  xargs wc -c 2>/dev/null | \
  sort -rn | \
  head -20 | \
  awk '{
    size_kb = $1/1024;
    if (size_kb > 1000) {
      printf "%.2f MB\t%s\n", size_kb/1024, $2
    } else {
      printf "%.2f KB\t%s\n", size_kb, $2
    }
  }'

echo ""
echo "💡 Recommendation: Files over 20KB should be considered for splitting"
echo ""

# Count files by size category
SMALL=$(find src -name "*.tsx" -o -name "*.ts" 2>/dev/null | xargs wc -c 2>/dev/null | awk '$1 < 10240 {count++} END {print count}')
MEDIUM=$(find src -name "*.tsx" -o -name "*.ts" 2>/dev/null | xargs wc -c 2>/dev/null | awk '$1 >= 10240 && $1 < 20480 {count++} END {print count}')
LARGE=$(find src -name "*.tsx" -o -name "*.ts" 2>/dev/null | xargs wc -c 2>/dev/null | awk '$1 >= 20480 {count++} END {print count}')

echo "📊 File Size Distribution:"
echo "  • Small (< 10KB):     $SMALL files"
echo "  • Medium (10-20KB):   $MEDIUM files"
echo "  • Large (> 20KB):     $LARGE files"
echo ""
