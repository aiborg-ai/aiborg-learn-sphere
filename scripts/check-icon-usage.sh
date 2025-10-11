#!/bin/bash
# Icon Usage Analysis Script
# Helps track icon migration progress

set -e

echo "================================"
echo "🎨 Icon Usage Analysis"
echo "================================"
echo ""

# Count total files using lucide-react
TOTAL_FILES=$(grep -rl "from 'lucide-react'" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
echo "📊 Total files using lucide-react: $TOTAL_FILES"
echo ""

# Count files already using icon loader
MIGRATED_FILES=$(grep -rl "from '@/utils/iconLoader'" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l || echo "0")
echo "✅ Files using icon loader: $MIGRATED_FILES"
echo ""

# Calculate progress
if [ "$TOTAL_FILES" -gt 0 ]; then
  PERCENT=$((MIGRATED_FILES * 100 / TOTAL_FILES))
  echo "📈 Migration progress: $PERCENT%"
  echo ""
fi

# Show files with most icon imports
echo "🔝 Top 10 files by icon import count:"
echo "------------------------------------"
for file in $(grep -rl "from 'lucide-react'" src --include="*.tsx" --include="*.ts" 2>/dev/null | head -20); do
  count=$(grep -o "from 'lucide-react'" "$file" | wc -l)
  echo "  $count imports - $file"
done | sort -rn | head -10
echo ""

# Show priority files status
echo "🎯 Priority Files Status:"
echo "-------------------------"

PRIORITY_FILES=(
  "src/App.tsx"
  "src/pages/Index.tsx"
  "src/components/navigation/Navbar.tsx"
  "src/pages/Auth.tsx"
  "src/pages/DashboardRefactored.tsx"
  "src/pages/Profile.tsx"
  "src/pages/CoursePage.tsx"
  "src/pages/AIAssessment.tsx"
  "src/pages/AdminRefactored.tsx"
)

for file in "${PRIORITY_FILES[@]}"; do
  if [ -f "$file" ]; then
    if grep -q "from 'lucide-react'" "$file" 2>/dev/null; then
      echo "  ❌ $file - NOT MIGRATED"
    elif grep -q "from '@/utils/iconLoader'" "$file" 2>/dev/null; then
      echo "  ✅ $file - MIGRATED"
    else
      echo "  ⚪ $file - NO ICONS"
    fi
  else
    echo "  ⚠️  $file - FILE NOT FOUND"
  fi
done
echo ""

# Show unique icons being used
echo "📝 Unique icons being used:"
echo "---------------------------"
UNIQUE_ICONS=$(grep -roh "import {[^}]*} from 'lucide-react'" src --include="*.tsx" --include="*.ts" 2>/dev/null | \
  sed 's/import {//g' | sed 's/} from.*//g' | tr ',' '\n' | \
  sed 's/^ *//g' | sed 's/ *$//g' | sort -u | wc -l)
echo "  $UNIQUE_ICONS unique icon names"
echo ""

# Estimate bundle savings
if [ "$MIGRATED_FILES" -gt 0 ]; then
  SAVINGS_MB=$(echo "scale=1; 36 * $MIGRATED_FILES / $TOTAL_FILES" | bc 2>/dev/null || echo "~N/A")
  echo "💾 Estimated bundle savings: ${SAVINGS_MB}MB of 36MB"
  echo ""
fi

echo "================================"
echo ""
echo "💡 Next steps:"
echo "  1. Run: npm run dev"
echo "  2. Visit: http://localhost:8080/test-icons"
echo "  3. Start migrating priority files"
echo "  4. Re-run this script to track progress"
echo ""
