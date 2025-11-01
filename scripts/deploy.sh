#!/bin/bash
# Quick deployment script for uunn.io
# This automates the deployment process to Cloudflare Pages

set -e

echo "🚀 Deploying uunn to www.uunn.io..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application for Cloudflare Pages..."
npm run pages:build

# Deploy
echo "🌐 Deploying to Cloudflare Pages..."
wrangler pages deploy .vercel/output/static --project-name=uunn

echo ""
echo "${GREEN}✨ Deployment complete!${NC}"
echo ""
echo "Your site is now live at:"
echo "  - https://uunn.pages.dev (Cloudflare Pages URL)"
echo "  - https://www.uunn.io (Custom domain, if configured)"
echo ""
echo "Next steps:"
echo "  1. Configure custom domain: wrangler pages domain add uunn www.uunn.io"
echo "  2. Set up D1 database: wrangler d1 create uunn-db"
echo "  3. Initialize schema: wrangler d1 execute uunn-db --file=./schema.sql"
echo ""
