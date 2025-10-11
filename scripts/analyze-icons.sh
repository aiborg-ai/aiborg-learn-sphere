#!/bin/bash
# Icon Usage Analysis Script
# Analyzes Lucide React icon usage across the codebase

echo "🔍 Analyzing Lucide React icon usage..."
echo ""

# Find all unique icons
echo "📦 Extracting unique icons used..."
grep -rh "from 'lucide-react'" src --include="*.tsx" --include="*.ts" 2>/dev/null | \
  sed 's/.*import { //' | \
  sed 's/ } from.*//' | \
  tr ',' '\n' | \
  sed 's/^ *//' | \
  sed 's/ *$//' | \
  grep -v '^$' | \
  sort | uniq > icons-used.txt

ICON_COUNT=$(wc -l < icons-used.txt)
FILE_COUNT=$(grep -r "from 'lucide-react'" src --include="*.tsx" --include="*.ts" 2>/dev/null | wc -l)

echo ""
echo "📊 Results:"
echo "  • Total unique icons: $ICON_COUNT"
echo "  • Files importing lucide-react: $FILE_COUNT"
echo "  • Average icons per file: $((ICON_COUNT / FILE_COUNT)) icons"
echo ""

echo "🔝 Top 10 most imported icons:"
grep -rh "from 'lucide-react'" src --include="*.tsx" --include="*.ts" 2>/dev/null | \
  sed 's/.*import { //' | \
  sed 's/ } from.*//' | \
  tr ',' '\n' | \
  sed 's/^ *//' | \
  sed 's/ *$//' | \
  grep -v '^$' | \
  sort | uniq -c | \
  sort -rn | \
  head -10

echo ""
echo "💾 Full list saved to: icons-used.txt"
echo ""

# Calculate potential savings
LUCIDE_SIZE_MB=37
AVERAGE_ICON_SIZE_KB=5
CURRENT_SIZE_KB=$((ICON_COUNT * AVERAGE_ICON_SIZE_KB))
POTENTIAL_SAVINGS_MB=$(echo "scale=2; $LUCIDE_SIZE_MB - ($CURRENT_SIZE_KB / 1024)" | bc)

echo "💡 Optimization Potential:"
echo "  • Current lucide-react size: ${LUCIDE_SIZE_MB}MB"
echo "  • Estimated actual usage: ${CURRENT_SIZE_KB}KB"
echo "  • Potential savings: ~${POTENTIAL_SAVINGS_MB}MB"
echo ""
