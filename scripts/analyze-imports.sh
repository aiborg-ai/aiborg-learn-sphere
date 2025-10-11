#!/bin/bash
# Import Analysis Script
# Analyzes import patterns across the codebase

echo "📦 Analyzing import patterns..."
echo ""

# Wildcard imports
WILDCARD_COUNT=$(grep -r "import \* as" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
echo "⚠️  Wildcard Imports: $WILDCARD_COUNT"
if [ $WILDCARD_COUNT -gt 0 ]; then
  echo "    (These may prevent tree-shaking)"
  echo ""
  echo "    Files with wildcard imports:"
  grep -r "import \* as" src --include="*.tsx" --include="*.ts" 2>/dev/null | \
    cut -d: -f1 | \
    sort | uniq | \
    head -10 | \
    sed 's/^/      • /'
fi
echo ""

# Most imported libraries
echo "🔝 Most Imported Libraries:"
echo "--------------------------"
grep -rh "^import.*from" src --include="*.tsx" --include="*.ts" 2>/dev/null | \
  sed 's/.*from //' | \
  sed "s/['\"]//g" | \
  sed 's/;$//' | \
  grep -v "^@/" | \
  grep -v "^\." | \
  sort | uniq -c | \
  sort -rn | \
  head -15 | \
  awk '{printf "%4d  %s\n", $1, $2}'

echo ""

# Local imports
echo "📂 Internal Imports:"
echo "-------------------"
LOCAL_IMPORTS=$(grep -rh "^import.*from ['\"]@/" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)
RELATIVE_IMPORTS=$(grep -rh "^import.*from ['\"]\.\./" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)

echo "  • Path alias (@/) imports:     $LOCAL_IMPORTS"
echo "  • Relative (./) imports:       $RELATIVE_IMPORTS"
echo ""

# Heavy libraries
echo "🏋️  Heavy Library Usage:"
echo "----------------------"
echo "  • lucide-react:     $(grep -r "from 'lucide-react'" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l) imports"
echo "  • @radix-ui:        $(grep -r "from '@radix-ui" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l) imports"
echo "  • recharts:         $(grep -r "from 'recharts'" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l) imports"
echo "  • @supabase:        $(grep -r "from '@supabase" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l) imports"
echo "  • @tanstack:        $(grep -r "from '@tanstack" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l) imports"
echo ""

echo "💡 Tip: Focus optimization efforts on most imported libraries"
echo ""
