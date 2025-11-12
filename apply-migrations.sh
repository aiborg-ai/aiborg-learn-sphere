#!/bin/bash

# Apply Supabase Migrations Script
# This script helps apply all security hardening migrations to Supabase

set -e  # Exit on error

echo "======================================"
echo "  Supabase Migration Application"
echo "======================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project configuration
PROJECT_REF="afrulkxxzcmngbrdfuzj"
MIGRATIONS_DIR="supabase/migrations"

# Check if migrations directory exists
if [ ! -d "$MIGRATIONS_DIR" ]; then
    echo -e "${RED}Error: Migrations directory not found at $MIGRATIONS_DIR${NC}"
    exit 1
fi

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${YELLOW}Supabase CLI not found. Installing...${NC}"
    npm install -g supabase
fi

echo "Checking for Supabase access token..."

# Check for access token
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${YELLOW}SUPABASE_ACCESS_TOKEN not set.${NC}"
    echo ""
    echo "Please get your access token from:"
    echo "https://supabase.com/dashboard/account/tokens"
    echo ""
    echo "Then run:"
    echo "export SUPABASE_ACCESS_TOKEN=<your-token>"
    echo "$0"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Access token found${NC}"
echo ""

# Link to project
echo "Linking to Supabase project: $PROJECT_REF"
if ! npx supabase link --project-ref "$PROJECT_REF" 2>/dev/null; then
    echo -e "${RED}Failed to link to project. Please check your access token and project ref.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Linked to project${NC}"
echo ""

# List migrations
echo "Migrations to apply:"
echo ""
migrations=(
    "20251109000000_account_lockout_system.sql"
    "20251109000001_rls_security_audit.sql"
    "20251109000002_rate_limiting_system.sql"
    "20251109000003_pii_encryption_system.sql"
    "20251109000004_gdpr_compliance_system.sql"
    "20251109000005_api_key_rotation_system.sql"
    "20251109000006_data_retention_automation.sql"
)

for i in "${!migrations[@]}"; do
    migration="${migrations[$i]}"
    if [ -f "$MIGRATIONS_DIR/$migration" ]; then
        echo "  $((i+1)). $migration"
    else
        echo -e "  ${RED}$((i+1)). $migration (FILE NOT FOUND)${NC}"
    fi
done

echo ""
echo -e "${YELLOW}This will apply 7 security hardening migrations to your production database.${NC}"
echo -e "${YELLOW}This action cannot be easily undone.${NC}"
echo ""
read -p "Do you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "Applying migrations..."
echo ""

# Apply migrations
if npx supabase db push; then
    echo ""
    echo -e "${GREEN}======================================"
    echo -e "  ✓ All migrations applied successfully!"
    echo -e "======================================${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Set encryption key in Supabase Vault"
    echo "2. Configure magic link authentication"
    echo "3. Set up SMTP for email delivery"
    echo "4. Configure redirect URLs"
    echo ""
    echo "See SUPABASE_CONFIGURATION_GUIDE.md for detailed instructions."
else
    echo ""
    echo -e "${RED}======================================"
    echo -e "  ✗ Migration failed"
    echo -e "======================================${NC}"
    echo ""
    echo "Please check the error messages above."
    echo "You may need to apply migrations manually via the Supabase dashboard."
    exit 1
fi
