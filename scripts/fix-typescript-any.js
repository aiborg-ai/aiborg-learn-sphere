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
  cyan: '\x1b[36m',
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
  '.d.ts',
  'types.ts', // Supabase generated types
];

// File extensions to process
const validExtensions = ['.ts', '.tsx'];

// Common type replacements
const typeReplacements = [
  // Error handling
  {
    pattern: /catch \(error: any\)/g,
    replacement: 'catch (error: unknown)',
    description: 'Error handling',
  },
  {
    pattern: /catch \(e: any\)/g,
    replacement: 'catch (e: unknown)',
    description: 'Error handling',
  },

  // Form data
  {
    pattern: /\(data: any\) => /g,
    replacement: '(data: Record<string, unknown>) => ',
    description: 'Form/data handlers',
  },

  // Event handlers
  {
    pattern: /onChange: \(value: any\)/g,
    replacement: 'onChange: (value: string | number)',
    description: 'onChange handlers',
  },

  // Function parameters
  {
    pattern: /onSuccess\?\: \(data: any\)/g,
    replacement: 'onSuccess?: (data: unknown)',
    description: 'Success callbacks',
  },
];

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
  let replacementDetails = [];

  // Apply automatic replacements
  typeReplacements.forEach(({ pattern, replacement, description }) => {
    const matches = content.match(pattern);
    if (matches) {
      replacementCount += matches.length;
      replacementDetails.push(`${matches.length} ${description}`);
      content = content.replace(pattern, replacement);
      fileModified = true;
    }
  });

  // Find remaining 'any' types that need manual review
  const remainingAny = content.match(/: any[^a-zA-Z]/g);
  if (remainingAny) {
    console.log(
      `${colors.yellow}⚠${colors.reset} Manual review needed: ${colors.blue}${filePath}${colors.reset}`
    );
    console.log(
      `  ${colors.cyan}${remainingAny.length} instances of 'any' require manual typing${colors.reset}`
    );

    // Extract context for each remaining 'any'
    const lines = content.split('\n');
    const anyInstances = [];
    lines.forEach((line, index) => {
      if (line.includes(': any')) {
        const lineNum = index + 1;
        const trimmedLine = line.trim();

        // Try to determine better type based on context
        let suggestedType = 'unknown';
        if (trimmedLine.includes('error') || trimmedLine.includes('catch')) {
          suggestedType = 'Error | unknown';
        } else if (trimmedLine.includes('data') || trimmedLine.includes('response')) {
          suggestedType = 'Record<string, unknown>';
        } else if (trimmedLine.includes('event')) {
          suggestedType = 'Event';
        } else if (trimmedLine.includes('children')) {
          suggestedType = 'React.ReactNode';
        } else if (trimmedLine.includes('props')) {
          suggestedType = 'Record<string, unknown>';
        }

        anyInstances.push({
          line: lineNum,
          content: trimmedLine.substring(0, 80),
          suggestion: suggestedType,
        });
      }
    });

    if (anyInstances.length > 0 && anyInstances.length <= 5) {
      anyInstances.forEach(({ line, content, suggestion }) => {
        console.log(`    Line ${line}: ${content}...`);
        console.log(`    ${colors.green}Suggested: ${suggestion}${colors.reset}`);
      });
    }
  }

  // Only write if content changed
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedFiles++;
    totalReplacements += replacementCount;
    console.log(
      `${colors.green}✓${colors.reset} Modified: ${colors.blue}${filePath}${colors.reset} (${replacementDetails.join(', ')})`
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

console.log(`${colors.yellow}Starting TypeScript 'any' type fixes...${colors.reset}\n`);

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
console.log(`${colors.green}✅ TypeScript 'any' Type Fix Complete!${colors.reset}`);
console.log('='.repeat(50));
console.log(`Total files scanned: ${colors.blue}${totalFiles}${colors.reset}`);
console.log(`Files modified: ${colors.yellow}${modifiedFiles}${colors.reset}`);
console.log(`Total automatic replacements: ${colors.green}${totalReplacements}${colors.reset}`);

if (totalReplacements === 0) {
  console.log(`\n${colors.yellow}No automatic replacements were made.${colors.reset}`);
  console.log(`Check the manual review items above for remaining 'any' types.`);
} else {
  console.log(
    `\n${colors.green}Success!${colors.reset} ${totalReplacements} 'any' types have been automatically fixed.`
  );
  console.log(`Check the manual review items above for remaining complex types.`);
}
