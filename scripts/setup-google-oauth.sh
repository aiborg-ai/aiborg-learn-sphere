#!/bin/bash

# Google OAuth Setup Helper Script
# This script guides you through setting up Google OAuth for your application

echo "========================================="
echo "Google OAuth 2.0 Setup Helper"
echo "========================================="
echo ""
echo "This script will guide you through setting up Google Sign-In"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Step 1: Google Cloud Console Setup${NC}"
echo "----------------------------------------"
echo "1. Open: https://console.cloud.google.com/"
echo "2. Create a new project or select existing"
echo "3. Enable Google+ API"
echo ""
read -p "Press Enter when you've completed Step 1..."

echo ""
echo -e "${GREEN}Step 2: Create OAuth 2.0 Credentials${NC}"
echo "----------------------------------------"
echo "In Google Cloud Console:"
echo "1. Go to APIs & Services → Credentials"
echo "2. Click '+ CREATE CREDENTIALS' → 'OAuth client ID'"
echo "3. Configure consent screen if needed"
echo "4. Application type: Web application"
echo "5. Name: Supabase Auth"
echo ""
echo "Add these Authorized JavaScript origins:"
echo -e "${YELLOW}"
echo "https://afrulkxxzcmngbrdfuzj.supabase.co"
echo "https://aiborg-ai-web.vercel.app"
echo "http://localhost:8080"
echo "http://localhost:5173"
echo "http://localhost:3000"
echo -e "${NC}"
echo ""
echo "Add these Authorized redirect URIs:"
echo -e "${YELLOW}"
echo "https://afrulkxxzcmngbrdfuzj.supabase.co/auth/v1/callback"
echo "https://aiborg-ai-web.vercel.app/auth/callback"
echo "http://localhost:8080/auth/callback"
echo "http://localhost:5173/auth/callback"
echo "http://localhost:3000/auth/callback"
echo -e "${NC}"
echo ""
read -p "Press Enter when you've created the OAuth client..."

echo ""
echo -e "${GREEN}Step 3: Enter Your Credentials${NC}"
echo "----------------------------------------"
read -p "Enter your Google Client ID: " CLIENT_ID
read -p "Enter your Google Client Secret: " CLIENT_SECRET

echo ""
echo -e "${GREEN}Step 4: Configure Supabase${NC}"
echo "----------------------------------------"
echo "1. Go to: https://supabase.com/dashboard/project/afrulkxxzcmngbrdfuzj/auth/providers"
echo "2. Find 'Google' provider"
echo "3. Toggle it ON"
echo "4. Enter these credentials:"
echo ""
echo -e "${YELLOW}Client ID:${NC} $CLIENT_ID"
echo -e "${YELLOW}Client Secret:${NC} $CLIENT_SECRET"
echo ""
echo "5. Click 'Save'"
echo ""
read -p "Press Enter when you've configured Supabase..."

echo ""
echo -e "${GREEN}Step 5: Create Environment File${NC}"
echo "----------------------------------------"

# Create or update .env.local file
cat > .env.local << EOF
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=$CLIENT_ID

# Supabase Configuration (already in Vercel)
VITE_SUPABASE_URL=https://afrulkxxzcmngbrdfuzj.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# App URL
VITE_APP_URL=https://aiborg-ai-web.vercel.app
EOF

echo "Created .env.local file with Google Client ID"
echo ""

echo -e "${GREEN}Step 6: Add to Vercel${NC}"
echo "----------------------------------------"
echo "Add this environment variable to Vercel:"
echo ""
echo -e "${YELLOW}VITE_GOOGLE_CLIENT_ID = $CLIENT_ID${NC}"
echo ""
echo "1. Go to: https://vercel.com/hirendra-vikrams-projects/aiborg-ai-web/settings/environment-variables"
echo "2. Add the variable above"
echo "3. Redeploy for changes to take effect"
echo ""
read -p "Press Enter when you've added to Vercel..."

echo ""
echo "========================================="
echo -e "${GREEN}Setup Complete!${NC}"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Go to /auth and test 'Continue with Google'"
echo "3. Deploy and test in production"
echo ""
echo "Your credentials are saved in:"
echo "- .env.local (for local development)"
echo "- Remember to add to Vercel environment variables"
echo ""
echo -e "${YELLOW}Important Security Notes:${NC}"
echo "- Never commit .env.local to git"
echo "- Never expose Client Secret in frontend code"
echo "- Client ID is safe to use in frontend"
echo ""
echo "Documentation: GOOGLE_OAUTH_SETUP.md"
echo ""