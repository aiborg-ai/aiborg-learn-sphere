#!/bin/bash

# Quick fixes for immediate technical debt items
# Usage: ./scripts/quick-fixes.sh

set -e

echo "🔧 Starting Quick Fixes for Technical Debt..."
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track fixes
FIXES_APPLIED=0
FIXES_FAILED=0

# Function to run a fix
run_fix() {
  local name=$1
  local command=$2

  echo -e "${YELLOW}▶${NC} $name..."

  if eval "$command" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} $name - Success"
    ((FIXES_APPLIED++))
  else
    echo -e "${RED}✗${NC} $name - Failed"
    ((FIXES_FAILED++))
  fi
  echo ""
}

# 1. Fix security vulnerabilities (non-breaking)
echo "═══════════════════════════════════════════════════"
echo "1. Security Fixes"
echo "═══════════════════════════════════════════════════"
echo ""

run_fix "Fix security vulnerabilities" "npm audit fix --no-audit"

# 2. Update safe dependencies
echo "═══════════════════════════════════════════════════"
echo "2. Update Safe Dependencies"
echo "═══════════════════════════════════════════════════"
echo ""

run_fix "Update @supabase/supabase-js" "npm update @supabase/supabase-js"
run_fix "Update lucide-react" "npm update lucide-react"
run_fix "Update marked" "npm update marked"
run_fix "Update input-otp" "npm update input-otp"
run_fix "Update lint-staged" "npm update lint-staged"
run_fix "Update lovable-tagger" "npm update lovable-tagger"

# 3. Fix linting issues (auto-fixable)
echo "═══════════════════════════════════════════════════"
echo "3. Auto-Fix ESLint Issues"
echo "═══════════════════════════════════════════════════"
echo ""

run_fix "Fix ESLint auto-fixable issues" "npm run lint:fix"

# 4. Format code
echo "═══════════════════════════════════════════════════"
echo "4. Format Code"
echo "═══════════════════════════════════════════════════"
echo ""

run_fix "Format all source files" "npm run format"

# 5. Type checking
echo "═══════════════════════════════════════════════════"
echo "5. Type Checking"
echo "═══════════════════════════════════════════════════"
echo ""

echo -e "${YELLOW}▶${NC} Running type check..."
if npm run typecheck; then
  echo -e "${GREEN}✓${NC} Type check passed"
  ((FIXES_APPLIED++))
else
  echo -e "${RED}✗${NC} Type check failed - manual review needed"
  ((FIXES_FAILED++))
fi
echo ""

# 6. Run tests
echo "═══════════════════════════════════════════════════"
echo "6. Test Suite"
echo "═══════════════════════════════════════════════════"
echo ""

echo -e "${YELLOW}▶${NC} Running tests..."
if npm test -- --run > /dev/null 2>&1; then
  echo -e "${GREEN}✓${NC} All tests passed"
  ((FIXES_APPLIED++))
else
  echo -e "${YELLOW}⚠${NC} Some tests failed - review needed"
  ((FIXES_FAILED++))
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════"
echo "Summary"
echo "═══════════════════════════════════════════════════"
echo ""
echo -e "${GREEN}✓ Fixes Applied:${NC} $FIXES_APPLIED"
echo -e "${RED}✗ Fixes Failed:${NC} $FIXES_FAILED"
echo ""

if [ $FIXES_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 All quick fixes completed successfully!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Review changes: git diff"
  echo "2. Test the app: npm run dev"
  echo "3. Commit changes: git add . && git commit -m 'fix: apply quick fixes for technical debt'"
else
  echo -e "${YELLOW}⚠️  Some fixes need manual attention${NC}"
  echo ""
  echo "Please review the failed items above and fix manually."
  echo "See docs/TECHNICAL_DEBT.md for detailed guidance."
fi
echo ""

# Create summary file
cat > .quick-fixes-report.txt << EOF
Quick Fixes Report - $(date)
================================

Fixes Applied: $FIXES_APPLIED
Fixes Failed: $FIXES_FAILED

Details:
- Security vulnerabilities fixed
- Safe dependencies updated
- ESLint auto-fixes applied
- Code formatted
- Type checking completed
- Tests executed

See docs/TECHNICAL_DEBT.md for remaining items.
EOF

echo "📄 Report saved to: .quick-fixes-report.txt"
echo ""
