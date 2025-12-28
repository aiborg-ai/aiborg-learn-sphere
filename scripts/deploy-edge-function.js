#!/usr/bin/env node
/**
 * Manual Edge Function Deployment Script
 *
 * Deploys Supabase Edge Functions via Management API when Docker is unavailable.
 *
 * Usage:
 *   node scripts/deploy-edge-function.js ai-chat-rag
 */

import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SUPABASE_PROJECT_REF = 'afrulkxxzcmngbrdfuzj';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ Error: SUPABASE_ACCESS_TOKEN environment variable not set');
  console.error('\nTo get your access token:');
  console.error('1. Go to https://supabase.com/dashboard/account/tokens');
  console.error('2. Create a new token or use existing one');
  console.error('3. Run: export SUPABASE_ACCESS_TOKEN="your-token-here"');
  process.exit(1);
}

const functionName = process.argv[2];
if (!functionName) {
  console.error('❌ Error: Function name required');
  console.error('Usage: node scripts/deploy-edge-function.js <function-name>');
  console.error('Example: node scripts/deploy-edge-function.js ai-chat-rag');
  process.exit(1);
}

const functionDir = path.join(__dirname, '..', 'supabase', 'functions', functionName);
if (!fs.existsSync(functionDir)) {
  console.error(`❌ Error: Function directory not found: ${functionDir}`);
  process.exit(1);
}

console.log(`\n📦 Bundling function: ${functionName}`);
console.log(`📂 Source directory: ${functionDir}\n`);

/**
 * Bundle all TypeScript files into a single deployable package
 */
function bundleFunction() {
  const files = {};

  // Read all .ts files in the function directory
  const tsFiles = fs.readdirSync(functionDir).filter(f => f.endsWith('.ts'));

  tsFiles.forEach(file => {
    const filePath = path.join(functionDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    files[file] = content;
    console.log(`  ✓ Included: ${file} (${content.length} bytes)`);
  });

  if (Object.keys(files).length === 0) {
    throw new Error('No TypeScript files found');
  }

  return files;
}

/**
 * Create a single-file bundle (Deno-compatible)
 */
function createDenoBundle(files) {
  // Start with index.ts
  let bundle = files['index.ts'];

  if (!bundle) {
    throw new Error('index.ts not found');
  }

  // Replace local imports with inline code
  Object.keys(files).forEach(filename => {
    if (filename === 'index.ts') return;

    const moduleName = filename.replace('.ts', '');
    const importPattern = new RegExp(
      `import\\s+{([^}]+)}\\s+from\\s+['"]\\.\\/${moduleName}(\\.ts)?['"];?`,
      'g'
    );

    // Remove the import statement and inline the module
    bundle = bundle.replace(importPattern, (match, imports) => {
      console.log(`  → Inlining: ${filename}`);

      // Extract and preserve the imports/exports
      const moduleCode = files[filename];

      // Remove import/export keywords from the inlined module
      const cleanedCode = moduleCode
        .replace(/^import\s+.*$/gm, '') // Remove imports
        .replace(/^export\s+/gm, ''); // Remove export keywords

      return `\n// ===== Inlined from ${filename} =====\n${cleanedCode}\n// ===== End of ${filename} =====\n`;
    });
  });

  return bundle;
}

/**
 * Deploy function via Supabase Management API
 */
function deployFunction(bundledCode) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      slug: functionName,
      name: functionName,
      body: bundledCode,
      verify_jwt: false,
    });

    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${SUPABASE_PROJECT_REF}/functions/${functionName}`,
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    console.log(`\n🚀 Deploying to Supabase...`);
    console.log(`   Project: ${SUPABASE_PROJECT_REF}`);
    console.log(`   Function: ${functionName}`);
    console.log(`   Bundle size: ${(body.length / 1024).toFixed(2)} KB\n`);

    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Deployment successful!');
          console.log(
            `\n🔗 Function URL: https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/${functionName}`
          );
          resolve(JSON.parse(data));
        } else {
          console.error(`❌ Deployment failed (${res.statusCode})`);
          console.error('Response:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', error => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

/**
 * Alternative: Create function if it doesn't exist
 */
function createFunction(bundledCode) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      slug: functionName,
      name: functionName,
      body: bundledCode,
      verify_jwt: false,
    });

    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${SUPABASE_PROJECT_REF}/functions`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SUPABASE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    console.log('   Attempting to create new function...\n');

    const req = https.request(options, res => {
      let data = '';

      res.on('data', chunk => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Function created successfully!');
          resolve(JSON.parse(data));
        } else {
          console.error(`❌ Creation failed (${res.statusCode})`);
          console.error('Response:', data);
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', error => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.write(body);
    req.end();
  });
}

/**
 * Main deployment flow
 */
async function main() {
  try {
    // Step 1: Bundle files
    const files = bundleFunction();
    console.log(`\n✓ Bundled ${Object.keys(files).length} files\n`);

    // Step 2: Create Deno-compatible bundle
    console.log('📝 Creating deployment bundle...');
    const bundledCode = createDenoBundle(files);
    console.log(`   Bundle size: ${(bundledCode.length / 1024).toFixed(2)} KB`);

    // Step 3: Deploy (try PATCH first, then POST if function doesn't exist)
    try {
      await deployFunction(bundledCode);
    } catch (error) {
      if (error.message.includes('404')) {
        console.log('\n⚠️  Function not found, creating new function...');
        await createFunction(bundledCode);
      } else {
        throw error;
      }
    }

    console.log('\n✨ Deployment complete!\n');
  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
main();
