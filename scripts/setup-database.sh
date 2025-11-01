#!/bin/bash
# Database setup script for uunn
# Creates and initializes the D1 database

set -e

echo "🗄️  Setting up D1 database for uunn..."
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
echo "${BLUE}Step 1: Creating D1 database...${NC}"
echo ""

# Create database
wrangler d1 create uunn-db

echo ""
echo "${YELLOW}⚠️  IMPORTANT: Copy the database_id from the output above!${NC}"
echo "${YELLOW}Update wrangler.toml with the database_id before continuing.${NC}"
echo ""
read -p "Press Enter after updating wrangler.toml..."

echo ""
echo "${BLUE}Step 2: Initializing database schema...${NC}"
echo ""

# Initialize schema
wrangler d1 execute uunn-db --file=./schema.sql

echo ""
echo "${BLUE}Step 3: Verifying database setup...${NC}"
echo ""

# Verify tables
wrangler d1 execute uunn-db --command="SELECT name FROM sqlite_master WHERE type='table';"

echo ""
echo "${GREEN}✨ Database setup complete!${NC}"
echo ""
echo "Tables created:"
echo "  - groups"
echo "  - group_members"
echo "  - invitations"
echo "  - message_metadata"
echo "  - actions"
echo "  - votes"
echo "  - sync_log"
echo "  - audit_log"
echo ""
echo "Next step: Bind database to Pages project"
echo "  wrangler pages deployment create uunn --binding DB=uunn-db"
echo ""
