#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Track statistics
let totalFiles = 0;
let modifiedFiles = 0;
let totalReplacements = 0;

// Files to skip
const skipPatterns = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'logger.ts', // Don't modify the logger utility itself
  'fix-console-logs.js', // Don't modify this script
];

// File extensions to process
const validExtensions = ['.ts', '.tsx', '.js', '.jsx'];

function shouldSkipFile(filePath) {
  return skipPatterns.some(pattern => filePath.includes(pattern));
}

function processFile(filePath) {
  if (shouldSkipFile(filePath)) {
    return;
  }

  const ext = path.extname(filePath);
  if (!validExtensions.includes(ext)) {
    return;
  }

  totalFiles++;

  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  let fileModified = false;
  let replacementCount = 0;

  // Check if logger is already imported
  const hasLoggerImport =
    content.includes("from '@/utils/logger'") || content.includes('from "@/utils/logger"');

  // Replace console methods
  const consolePatterns = [
    { pattern: /console\.log\(/g, replacement: 'logger.log(' },
    { pattern: /console\.error\(/g, replacement: 'logger.error(' },
    { pattern: /console\.warn\(/g, replacement: 'logger.warn(' },
    { pattern: /console\.info\(/g, replacement: 'logger.info(' },
    { pattern: /console\.debug\(/g, replacement: 'logger.debug(' },
    { pattern: /console\.table\(/g, replacement: 'logger.table(' },
  ];

  // Track if we need to add import
  let needsImport = false;

  consolePatterns.forEach(({ pattern, replacement }) => {
    const matches = content.match(pattern);
    if (matches) {
      needsImport = true;
      replacementCount += matches.length;
      content = content.replace(pattern, replacement);
      fileModified = true;
    }
  });

  // Add import statement if needed and not already present
  if (needsImport && !hasLoggerImport) {
    // Find the right place to add import
    const importRegex = /^import\s+.*?from\s+['"].*?['"];?\s*$/gm;
    const imports = content.match(importRegex);

    if (imports && imports.length > 0) {
      // Add after the last import
      const lastImport = imports[imports.length - 1];
      const lastImportIndex = content.lastIndexOf(lastImport);
      const insertPosition = lastImportIndex + lastImport.length;

      content =
        content.slice(0, insertPosition) +
        "\nimport { logger } from '@/utils/logger';" +
        content.slice(insertPosition);
    } else {
      // Add at the beginning of the file (after any leading comments)
      const lines = content.split('\n');
      let insertIndex = 0;

      // Skip leading comments and empty lines
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line && !line.startsWith('//') && !line.startsWith('/*') && !line.startsWith('*')) {
          insertIndex = i;
          break;
        }
      }

      lines.splice(insertIndex, 0, "import { logger } from '@/utils/logger';", '');
      content = lines.join('\n');
    }
  }

  // Only write if content changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFiles++;
    totalReplacements += replacementCount;
    console.log(
      `${colors.green}✓${colors.reset} Modified: ${colors.blue}${filePath}${colors.reset} (${replacementCount} replacements)`
    );
  }
}

function processDirectory(dirPath) {
  if (shouldSkipFile(dirPath)) {
    return;
  }

  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else {
      processFile(fullPath);
    }
  });
}

console.log(`${colors.yellow}Starting console.log replacement...${colors.reset}\n`);

// Start processing from src directory
const srcPath = path.join(__dirname, '..', 'src');
if (fs.existsSync(srcPath)) {
  processDirectory(srcPath);
} else {
  console.error(`${colors.red}Error: src directory not found${colors.reset}`);
  process.exit(1);
}

// Print summary
console.log('\n' + '='.repeat(50));
console.log(`${colors.green}✅ Console.log Replacement Complete!${colors.reset}`);
console.log('='.repeat(50));
console.log(`Total files scanned: ${colors.blue}${totalFiles}${colors.reset}`);
console.log(`Files modified: ${colors.yellow}${modifiedFiles}${colors.reset}`);
console.log(`Total replacements: ${colors.green}${totalReplacements}${colors.reset}`);

if (totalReplacements === 0) {
  console.log(`\n${colors.yellow}No console statements found to replace.${colors.reset}`);
} else {
  console.log(
    `\n${colors.green}Success!${colors.reset} All console statements have been replaced with logger utility.`
  );
  console.log(`The logger only outputs in development mode, keeping production logs clean.`);
}
