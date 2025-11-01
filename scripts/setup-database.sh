#!/bin/bash
# Database setup script for uunn
# Initializes existing dev database and creates production database

set -e

echo "🗄️  Setting up D1 databases for uunn..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "${YELLOW}⚠️  Wrangler not found. Installing...${NC}"
    npm install -g wrangler
fi

# Check if logged in
echo "Checking Wrangler authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "${YELLOW}⚠️  Not logged in. Please authenticate with Cloudflare:${NC}"
    wrangler login
fi

echo ""
echo "${CYAN}════════════════════════════════════════════${NC}"
echo "${CYAN}   EXISTING INFRASTRUCTURE DETECTED${NC}"
echo "${CYAN}════════════════════════════════════════════${NC}"
echo ""
echo "✅ Development database: uunn-dev"
echo "   ID: 96d79317-8571-4514-b9e8-b004675e5c05"
echo "   Status: Empty (will be initialized)"
echo ""

# Step 1: Initialize existing dev database
echo "${BLUE}Step 1: Initializing development database (uunn-dev)...${NC}"
echo ""

wrangler d1 execute uunn-dev --file=./schema.sql

echo ""
echo "${GREEN}✓ Development database initialized${NC}"
echo ""

# Verify dev database
echo "Verifying dev database tables..."
wrangler d1 execute uunn-dev --command="SELECT name FROM sqlite_master WHERE type='table';"

echo ""
echo "${BLUE}Step 2: Creating production database (uunn-production)...${NC}"
echo ""

# Create production database
PROD_OUTPUT=$(wrangler d1 create uunn-production 2>&1)
echo "$PROD_OUTPUT"

# Extract database ID from output
PROD_DB_ID=$(echo "$PROD_OUTPUT" | grep -o 'database_id = "[^"]*"' | cut -d'"' -f2)

echo ""
echo "${YELLOW}📋 Production Database Created:${NC}"
echo "   Name: uunn-production"
echo "   ID: $PROD_DB_ID"
echo ""

# Step 3: Initialize production database
echo "${BLUE}Step 3: Initializing production database...${NC}"
echo ""

wrangler d1 execute uunn-production --file=./schema.sql

echo ""
echo "${GREEN}✓ Production database initialized${NC}"
echo ""

# Verify production database
echo "Verifying production database tables..."
wrangler d1 execute uunn-production --command="SELECT name FROM sqlite_master WHERE type='table';"

# Step 4: Update wrangler.toml
echo ""
echo "${BLUE}Step 4: Updating wrangler.toml...${NC}"
echo ""

if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/database_id = \"CREATE_THIS_FOR_PRODUCTION\"/database_id = \"$PROD_DB_ID\"/" wrangler.toml
else
    # Linux
    sed -i "s/database_id = \"CREATE_THIS_FOR_PRODUCTION\"/database_id = \"$PROD_DB_ID\"/" wrangler.toml
fi

echo "${GREEN}✓ wrangler.toml updated with production database ID${NC}"

echo ""
echo "${CYAN}════════════════════════════════════════════${NC}"
echo "${GREEN}✨ All databases set up successfully!${NC}"
echo "${CYAN}════════════════════════════════════════════${NC}"
echo ""
echo "📊 Database Summary:"
echo ""
echo "  Development (uunn-dev):"
echo "    - Database ID: 96d79317-8571-4514-b9e8-b004675e5c05"
echo "    - Use: Local development (npm run dev)"
echo "    - Tables: 8 tables initialized"
echo ""
echo "  Production (uunn-production):"
echo "    - Database ID: $PROD_DB_ID"
echo "    - Use: www.uunn.io deployment"
echo "    - Tables: 8 tables initialized"
echo ""
echo "Tables in both databases:"
echo "  ✓ groups"
echo "  ✓ group_members"
echo "  ✓ invitations"
echo "  ✓ message_metadata"
echo "  ✓ actions"
echo "  ✓ votes"
echo "  ✓ sync_log"
echo "  ✓ audit_log"
echo ""
echo "${GREEN}Next step: Deploy to www.uunn.io${NC}"
echo "  ./scripts/deploy.sh"
echo ""
