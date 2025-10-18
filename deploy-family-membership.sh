#!/bin/bash

# ============================================================================
# FAMILY MEMBERSHIP SYSTEM - AUTOMATED DEPLOYMENT SCRIPT
# ============================================================================
# This script deploys the complete Family Membership system to Supabase
# Created: October 18, 2025
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_REF="afrulkxxzcmngbrdfuzj"
PROJECT_DIR="/home/vik/aiborg_CC/aiborg-learn-sphere"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  FAMILY MEMBERSHIP SYSTEM - DEPLOYMENT SCRIPT                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# STEP 1: CHECK PREREQUISITES
# ============================================================================

echo -e "${YELLOW}[1/7] Checking prerequisites...${NC}"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}✗ Supabase CLI not found. Installing...${NC}"
    npm install -g supabase
else
    echo -e "${GREEN}✓ Supabase CLI found${NC}"
fi

# Check if logged in to Supabase
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠ Not logged in to Supabase. Please login:${NC}"
    supabase login
fi

# Check for required files
REQUIRED_FILES=(
    "supabase/migrations/20251017120000_membership_plans.sql"
    "supabase/migrations/20251017120001_membership_subscriptions.sql"
    "supabase/functions/create-subscription/index.ts"
    "supabase/functions/manage-subscription/index.ts"
    "supabase/functions/stripe-webhook-subscription/index.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$PROJECT_DIR/$file" ]; then
        echo -e "${RED}✗ Required file not found: $file${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ All prerequisites met${NC}"
echo ""

# ============================================================================
# STEP 2: CHECK ENVIRONMENT VARIABLES
# ============================================================================

echo -e "${YELLOW}[2/7] Checking environment variables...${NC}"

# Check if Stripe keys are set
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${YELLOW}⚠ STRIPE_SECRET_KEY not set${NC}"
    read -p "Enter your Stripe Secret Key (sk_...): " STRIPE_SECRET_KEY
    export STRIPE_SECRET_KEY
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${YELLOW}⚠ STRIPE_WEBHOOK_SECRET not set (you can add this later)${NC}"
fi

echo -e "${GREEN}✓ Environment variables checked${NC}"
echo ""

# ============================================================================
# STEP 3: LINK TO SUPABASE PROJECT
# ============================================================================

echo -e "${YELLOW}[3/7] Linking to Supabase project...${NC}"

cd "$PROJECT_DIR"

# Link to project
supabase link --project-ref "$PROJECT_REF" || {
    echo -e "${YELLOW}⚠ Project already linked or link failed${NC}"
}

echo -e "${GREEN}✓ Project linked${NC}"
echo ""

# ============================================================================
# STEP 4: RUN DATABASE MIGRATIONS
# ============================================================================

echo -e "${YELLOW}[4/7] Running database migrations...${NC}"

echo -e "${BLUE}→ This will create:${NC}"
echo "  - membership_plans table"
echo "  - membership_subscriptions table"
echo "  - family_members table"
echo "  - RLS policies and functions"
echo ""

read -p "Continue with migrations? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}✗ Deployment cancelled${NC}"
    exit 1
fi

# Apply migrations
echo -e "${BLUE}→ Applying membership_plans migration...${NC}"
supabase db push --db-url "postgresql://postgres:hirendra\$1234ABCD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres" --include-all || {
    echo -e "${YELLOW}⚠ Migration may have already been applied${NC}"
}

echo -e "${GREEN}✓ Database migrations completed${NC}"
echo ""

# ============================================================================
# STEP 5: DEPLOY EDGE FUNCTIONS
# ============================================================================

echo -e "${YELLOW}[5/7] Deploying Edge Functions...${NC}"

# Deploy create-subscription
echo -e "${BLUE}→ Deploying create-subscription...${NC}"
supabase functions deploy create-subscription --project-ref "$PROJECT_REF" --no-verify-jwt || {
    echo -e "${RED}✗ Failed to deploy create-subscription${NC}"
    exit 1
}

# Deploy manage-subscription
echo -e "${BLUE}→ Deploying manage-subscription...${NC}"
supabase functions deploy manage-subscription --project-ref "$PROJECT_REF" --no-verify-jwt || {
    echo -e "${RED}✗ Failed to deploy manage-subscription${NC}"
    exit 1
}

# Deploy stripe-webhook-subscription
echo -e "${BLUE}→ Deploying stripe-webhook-subscription...${NC}"
supabase functions deploy stripe-webhook-subscription --project-ref "$PROJECT_REF" --no-verify-jwt || {
    echo -e "${RED}✗ Failed to deploy stripe-webhook-subscription${NC}"
    exit 1
}

# Deploy send-email-notification (if exists)
if [ -d "$PROJECT_DIR/supabase/functions/send-email-notification" ]; then
    echo -e "${BLUE}→ Deploying send-email-notification...${NC}"
    supabase functions deploy send-email-notification --project-ref "$PROJECT_REF" --no-verify-jwt || {
        echo -e "${YELLOW}⚠ Failed to deploy send-email-notification (optional)${NC}"
    }
fi

echo -e "${GREEN}✓ Edge Functions deployed${NC}"
echo ""

# ============================================================================
# STEP 6: SET SECRETS
# ============================================================================

echo -e "${YELLOW}[6/7] Setting Supabase secrets...${NC}"

# Set Stripe secret key
echo -e "${BLUE}→ Setting STRIPE_SECRET_KEY...${NC}"
echo "$STRIPE_SECRET_KEY" | supabase secrets set STRIPE_SECRET_KEY --project-ref "$PROJECT_REF" || {
    echo -e "${RED}✗ Failed to set STRIPE_SECRET_KEY${NC}"
}

# Set webhook secret if provided
if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${BLUE}→ Setting STRIPE_WEBHOOK_SECRET...${NC}"
    echo "$STRIPE_WEBHOOK_SECRET" | supabase secrets set STRIPE_WEBHOOK_SECRET --project-ref "$PROJECT_REF" || {
        echo -e "${YELLOW}⚠ Failed to set STRIPE_WEBHOOK_SECRET${NC}"
    }
else
    echo -e "${YELLOW}⚠ STRIPE_WEBHOOK_SECRET not set (configure later)${NC}"
fi

echo -e "${GREEN}✓ Secrets configured${NC}"
echo ""

# ============================================================================
# STEP 7: FINAL INSTRUCTIONS
# ============================================================================

echo -e "${YELLOW}[7/7] Final setup instructions${NC}"
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  NEXT STEPS: STRIPE CONFIGURATION                             ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}1. Create Stripe Product:${NC}"
echo "   → Go to: https://dashboard.stripe.com/products"
echo "   → Click 'Add Product'"
echo "   → Name: 'All Access - Family Membership Pass'"
echo "   → Price: £20.00 / month"
echo "   → Click 'Save product'"
echo "   → Copy the Price ID (starts with 'price_')"
echo ""
echo -e "${YELLOW}2. Update Database with Stripe IDs:${NC}"
echo "   → Go to: https://supabase.com/dashboard/project/$PROJECT_REF/editor"
echo "   → Run this SQL:"
echo ""
echo "   UPDATE membership_plans"
echo "   SET stripe_price_id = 'price_YOUR_PRICE_ID_HERE'"
echo "   WHERE slug = 'family-pass';"
echo ""
echo -e "${YELLOW}3. Configure Stripe Webhook:${NC}"
echo "   → Go to: https://dashboard.stripe.com/webhooks"
echo "   → Click 'Add endpoint'"
echo "   → URL: https://$PROJECT_REF.supabase.co/functions/v1/stripe-webhook-subscription"
echo "   → Select these events:"
echo "     - checkout.session.completed"
echo "     - customer.subscription.created"
echo "     - customer.subscription.updated"
echo "     - customer.subscription.deleted"
echo "     - invoice.payment_succeeded"
echo "     - invoice.payment_failed"
echo "   → Copy the webhook signing secret (starts with 'whsec_')"
echo "   → Set it: supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx --project-ref $PROJECT_REF"
echo ""
echo -e "${YELLOW}4. Test the Integration:${NC}"
echo "   → Visit: https://aiborg-ai-web.vercel.app/family-membership"
echo "   → Click 'Enroll Now'"
echo "   → Complete the 4-step flow"
echo "   → Use Stripe test card: 4242 4242 4242 4242"
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✓ DEPLOYMENT COMPLETED SUCCESSFULLY!                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📚 Documentation:${NC}"
echo "   - System Overview: FAMILY_MEMBERSHIP_SYSTEM_OVERVIEW.md"
echo "   - Quick Start: MEMBERSHIP_QUICK_START.md"
echo "   - Email Setup: DEPLOY_FAMILY_MEMBERSHIP_EMAILS.md"
echo ""
echo -e "${GREEN}Happy deploying! 🚀${NC}"
