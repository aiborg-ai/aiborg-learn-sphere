#!/bin/bash

# Setup Admin Access Script
# This script helps you grant admin access to a user account

echo "=================================================="
echo "  🔐 Admin Access Setup Tool"
echo "=================================================="
echo ""

# Supabase connection details
DB_HOST="aws-0-ap-south-1.pooler.supabase.com"
DB_PORT="5432"
DB_USER="postgres.afrulkxxzcmngbrdfuzj"
DB_NAME="postgres"
DB_PASSWORD="hirendra\$1234ABCD"

echo "Enter the email address of the account you want to make admin:"
read -p "Email: " USER_EMAIL

if [ -z "$USER_EMAIL" ]; then
    echo "❌ Error: Email cannot be empty"
    exit 1
fi

echo ""
echo "Checking current role for: $USER_EMAIL"
echo "=================================================="

# Check current role
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "SELECT id, email, display_name, role, created_at FROM profiles WHERE email = '$USER_EMAIL';"

echo ""
echo "Do you want to grant admin access to this account? (yes/no)"
read -p "Answer: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "❌ Cancelled. No changes made."
    exit 0
fi

echo ""
echo "Updating role to admin..."
echo "=================================================="

# Update role to admin
PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "UPDATE profiles SET role = 'admin' WHERE email = '$USER_EMAIL';"

# Verify the change
echo ""
echo "Verifying changes..."
echo "=================================================="

PGPASSWORD="$DB_PASSWORD" psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -c "SELECT id, email, display_name, role FROM profiles WHERE email = '$USER_EMAIL';"

echo ""
echo "✅ Done! Admin access granted."
echo ""
echo "📝 IMPORTANT: Next steps:"
echo "   1. Sign out of your account"
echo "   2. Sign in again"
echo "   3. Navigate to http://localhost:8080/admin"
echo ""
echo "You should now see the admin dashboard!"
echo "=================================================="
