# Manual Edge Function Deployment

This script allows you to deploy Supabase Edge Functions when Docker is unavailable.

## Prerequisites

1. **Get your Supabase Access Token**:
   - Go to https://supabase.com/dashboard/account/tokens
   - Create a new token (or use existing one)
   - Copy the token

2. **Set the environment variable**:
   ```bash
   export SUPABASE_ACCESS_TOKEN="sbp_xxxxxxxxxxxxxxxxxxxxx"
   ```

## Usage

### Deploy a function:

```bash
node scripts/deploy-edge-function.js ai-chat-rag
```

### Deploy other functions:

```bash
node scripts/deploy-edge-function.js <function-name>
```

## What it does

1. ✅ Bundles all TypeScript files from `supabase/functions/<function-name>/`
2. ✅ Inlines module imports (creates single-file Deno bundle)
3. ✅ Deploys via Supabase Management API
4. ✅ Returns deployment URL

## Example Output

```
📦 Bundling function: ai-chat-rag
📂 Source directory: /home/vik/aiborg_CC/aiborg-learn-sphere/supabase/functions/ai-chat-rag

  ✓ Included: index.ts (12540 bytes)
  ✓ Included: domain-knowledge.ts (28392 bytes)
  ✓ Included: prompts.ts (15234 bytes)
  ✓ Included: question-classifier.ts (8921 bytes)

✓ Bundled 4 files

📝 Creating deployment bundle...
  → Inlining: domain-knowledge.ts
  → Inlining: prompts.ts
  → Inlining: question-classifier.ts
   Bundle size: 63.21 KB

🚀 Deploying to Supabase...
   Project: afrulkxxzcmngbrdfuzj
   Function: ai-chat-rag
   Bundle size: 63.21 KB

✅ Deployment successful!

🔗 Function URL: https://afrulkxxzcmngbrdfuzj.supabase.co/functions/v1/ai-chat-rag

✨ Deployment complete!
```

## Troubleshooting

### Error: "SUPABASE_ACCESS_TOKEN environment variable not set"

**Solution**: Set the token as shown in Prerequisites step 2

### Error: "Function directory not found"

**Solution**: Ensure the function exists in `supabase/functions/<function-name>/`

### Error: "HTTP 401: Unauthorized"

**Solution**: Your access token may be invalid or expired. Get a new token from the dashboard.

### Error: "HTTP 404: Not Found"

**Solution**: The script will automatically try to create the function if it doesn't exist.

## Advanced Usage

### Deploy with custom token (one-time):

```bash
SUPABASE_ACCESS_TOKEN="your-token" node scripts/deploy-edge-function.js ai-chat-rag
```

### Deploy all functions (create a loop):

```bash
for func in ai-chat-rag ai-chat-with-analytics-cached; do
  node scripts/deploy-edge-function.js $func
done
```

## Alternative: Fix Docker

If you prefer to use the standard deployment method, fix Docker networking:

```bash
sudo systemctl restart docker
sudo iptables -t filter -N DOCKER-ISOLATION-STAGE-2 2>/dev/null || true
sudo systemctl restart docker

# Then use normal deployment:
npx supabase functions deploy ai-chat-rag
```
