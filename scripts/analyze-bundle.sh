#!/bin/bash
# Bundle Size Analysis Script
# Run this after build to analyze bundle sizes

echo "==================================="
echo "Bundle Size Analysis"
echo "==================================="
echo ""

# Build the project
echo "Building project..."
npm run build > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Build failed!"
  exit 1
fi

echo "✅ Build successful!"
echo ""

# Analyze dist folder
echo "📊 Bundle Size Summary:"
echo "-----------------------------------"

# Get total size
TOTAL_SIZE=$(du -sh dist | awk '{print $1}')
echo "Total dist size: $TOTAL_SIZE"
echo ""

# Find largest chunks
echo "🔍 Top 15 Largest Chunks:"
echo "-----------------------------------"
find dist/js -name "*.js" -type f -exec du -h {} + | sort -rh | head -n 15 | awk '{printf "%-50s %10s\n", $2, $1}'
echo ""

# Count chunks
JS_COUNT=$(find dist/js -name "*.js" | wc -l)
CSS_COUNT=$(find dist/css -name "*.css" | wc -l 2>/dev/null || echo "0")

echo "📦 Chunk Statistics:"
echo "-----------------------------------"
echo "JavaScript chunks: $JS_COUNT"
echo "CSS files: $CSS_COUNT"
echo ""

# Check for chunks over 400KB (warning threshold)
LARGE_CHUNKS=$(find dist/js -name "*.js" -type f -size +400k)
LARGE_COUNT=$(echo "$LARGE_CHUNKS" | grep -c "js" || echo "0")

if [ "$LARGE_COUNT" -gt 0 ]; then
  echo "⚠️  Warning: $LARGE_COUNT chunks exceed 400 KB:"
  echo "-----------------------------------"
  echo "$LARGE_CHUNKS" | while read file; do
    SIZE=$(du -h "$file" | awk '{print $1}')
    FILENAME=$(basename "$file")
    echo "$FILENAME: $SIZE"
  done
  echo ""
fi

# Recommendations
echo "💡 Optimization Tips:"
echo "-----------------------------------"
echo "- Chunks > 400 KB should be code-split further"
echo "- Use dynamic import() for admin/analytics features"
echo "- Consider lazy-loading chart libraries"
echo "- Check for duplicate dependencies"
echo ""

echo "==================================="
echo "Analysis Complete!"
echo "==================================="
