#!/usr/bin/env node
/**
 * Bundle and Deploy Edge Function using esbuild
 * Creates a proper Deno-compatible bundle and deploys via API
 */

import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_PROJECT_REF = 'afrulkxxzcmngbrdfuzj';
const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const functionName = process.argv[2] || 'ai-chat-rag';

if (!SUPABASE_ACCESS_TOKEN) {
  console.error('❌ SUPABASE_ACCESS_TOKEN not set');
  process.exit(1);
}

const functionDir = path.join(__dirname, '..', 'supabase', 'functions', functionName);
const entryPoint = path.join(functionDir, 'index.ts');
const outFile = path.join('/tmp', `${functionName}-bundle.js`);

console.log(`\n📦 Bundling ${functionName} with esbuild...`);
console.log(`📂 Entry: ${entryPoint}\n`);

try {
  // Bundle with esbuild (Deno-compatible)
  await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    platform: 'neutral',
    format: 'esm',
    outfile: outFile,
    external: ['https://*', 'npm:*'],
    minify: false,
    sourcemap: false,
    treeShaking: true,
  });

  console.log(`✅ Bundle created: ${outFile}`);

  // Read the bundled code
  const bundledCode = fs.readFileSync(outFile, 'utf8');
  console.log(`📊 Bundle size: ${(bundledCode.length / 1024).toFixed(2)} KB\n`);

  // Deploy via API
  console.log(`🚀 Deploying to Supabase...`);

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

  await new Promise((resolve, reject) => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('\n✅ Deployment successful!');
          console.log(
            `🔗 Function URL: https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/${functionName}\n`
          );
          resolve();
        } else {
          console.error(`\n❌ Deployment failed (${res.statusCode})`);
          console.error('Response:', data);
          reject(new Error(data));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });

  // Cleanup
  fs.unlinkSync(outFile);
  console.log('✨ Deployment complete!\n');
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
