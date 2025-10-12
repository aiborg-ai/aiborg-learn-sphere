#!/bin/bash

# Migration script to convert console.* calls to logger calls
# Usage: ./scripts/migrate-to-logger.sh

set -e

echo "🔍 Scanning for console.* statements in src/ directory..."
echo ""

# Find all console statements
CONSOLE_STATEMENTS=$(grep -r "console\." src/ --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude="logger.ts" \
  --exclude="*.test.ts" \
  --exclude="*.test.tsx" | wc -l)

if [ "$CONSOLE_STATEMENTS" -eq 0 ]; then
  echo "✅ No console.* statements found! Your codebase is clean."
  exit 0
fi

echo "Found $CONSOLE_STATEMENTS console.* statement(s)"
echo ""
echo "📝 Files with console statements:"
echo ""

grep -r "console\." src/ --include="*.ts" --include="*.tsx" \
  --exclude-dir=node_modules \
  --exclude="logger.ts" \
  --exclude="*.test.ts" \
  --exclude="*.test.tsx" | cut -d: -f1 | sort -u

echo ""
echo "⚠️  Manual migration recommended for proper context and log levels."
echo ""
echo "Migration guide:"
echo ""
echo "1. Import logger:"
echo "   import { logger } from '@/utils/logger';"
echo ""
echo "2. Replace console statements:"
echo "   console.log('message')          → logger.info('message')"
echo "   console.error('error', err)     → logger.error('error', err)"
echo "   console.warn('warning')         → logger.warn('warning')"
echo "   console.debug('debug')          → logger.debug('debug')"
echo "   console.table(data)             → logger.table(data)"
echo ""
echo "3. Add context (recommended):"
echo "   logger.info('User action', { userId: '123', action: 'click' })"
echo ""
echo "4. For errors with context:"
echo "   logger.error('Operation failed', error, { userId: '123' })"
echo ""
echo "📖 See docs/LOGGER_USAGE.md for complete documentation"
echo ""
