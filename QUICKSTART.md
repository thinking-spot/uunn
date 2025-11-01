# Quick Start: Launch uunn on www.uunn.io

**Time to launch: ~5 minutes** (you already have Wrangler and a dev database!)

## Prerequisites

- ✅ Cloudflare account (you have this!)
- ✅ Wrangler installed and authenticated (you're logged in!)
- ✅ Existing D1 database `uunn-dev` (will be used for local development)
- Domain www.uunn.io added to Cloudflare

## Your Existing Setup

```
Account: jml1308@gmail.com
Account ID: 96b8260d5d6c241b69dd7a42d3a30272
Dev Database: uunn-dev (96d79317-8571-4514-b9e8-b004675e5c05)
```

## Step 1: Set Up Databases (2 min)

This script will:
- Initialize your existing `uunn-dev` database with tables
- Create a new `uunn-production` database for www.uunn.io
- Automatically update `wrangler.toml`

```bash
# Run from your local machine (not this environment)
cd /Users/james/uunn
./scripts/setup-database.sh
```

No manual editing needed - the script handles everything!

## Step 2: Deploy to Cloudflare Pages (2 min)

```bash
# Deploy using the automated script
./scripts/deploy.sh
```

Or manually:

```bash
npm install
npm run pages:build
wrangler pages deploy .vercel/output/static --project-name=uunn
```

## Step 3: Add Custom Domain (1 min)

```bash
# Add www.uunn.io to your Pages project
wrangler pages domain add uunn www.uunn.io
```

Or via Cloudflare Dashboard:
1. Go to **Pages** → **uunn** → **Custom domains**
2. Add `www.uunn.io`
3. SSL certificate will auto-provision (1-5 min)

## Verify Deployment

Visit:
- ✅ https://uunn.pages.dev
- ✅ https://www.uunn.io

## Optional: Set Up Auto-Deploy

1. Go to Cloudflare Dashboard → **Pages** → **uunn**
2. Click **Settings** → **Builds & deployments** → **Connect to Git**
3. Select your repository
4. Every push to `main` will auto-deploy!

## Troubleshooting

### Database not found
```bash
wrangler pages deployment create uunn --binding DB=uunn-db
```

### Custom domain not working
- Wait 1-5 min for SSL certificate
- Check DNS: `www` CNAME → `uunn.pages.dev` (proxied)
- SSL/TLS mode: **Full (strict)**

### Need to update the database schema
```bash
wrangler d1 execute uunn-db --file=./schema.sql
```

## You're Live! 🚀

Your secure worker coordination platform is now live at **www.uunn.io**!

**Next steps:**
- Test creating a group
- Generate an invite code
- Verify end-to-end encryption
- Share with workers!

---

For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)
