# Quick Start: Launch uunn on www.uunn.io

**Time to launch: ~10 minutes**

## Prerequisites

- Cloudflare account
- Domain www.uunn.io added to Cloudflare

## Step 1: Install & Login (2 min)

```bash
# Install Wrangler globally
npm install -g wrangler

# Login to Cloudflare
wrangler login
```

## Step 2: Set Up Database (3 min)

```bash
# Run the automated setup script
./scripts/setup-database.sh
```

**IMPORTANT:** When prompted, copy the `database_id` and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "uunn-db"
database_id = "paste-your-database-id-here"
```

## Step 3: Deploy to Cloudflare Pages (3 min)

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

## Step 4: Add Custom Domain (2 min)

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
