#!/bin/bash

# Create admin user directly via Supabase Management API
# You need your Supabase service role key for this

SUPABASE_URL="https://afrulkxxzcmngbrdfuzj.supabase.co"
SERVICE_ROLE_KEY="your-service-role-key" # Get from Supabase Dashboard > Settings > API
EMAIL="your-working-email@gmail.com"
PASSWORD="your-secure-password"

# Create user
curl -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'${EMAIL}'",
    "password": "'${PASSWORD}'",
    "email_confirm": true,
    "user_metadata": {
      "role": "admin"
    }
  }'

echo "User created. Now grant admin role in database..."

# Note: After running this, still need to run the SQL to grant admin role