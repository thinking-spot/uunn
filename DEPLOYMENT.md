# Deploying uunn to www.uunn.io

This guide walks you through deploying uunn to your custom domain www.uunn.io using Cloudflare Pages.

## Prerequisites

- [ ] Cloudflare account (free tier works)
- [ ] Domain www.uunn.io (you own this!)
- [ ] Node.js 18+ installed locally
- [ ] Git repository access
- [ ] Wrangler CLI installed: `npm install -g wrangler`

## Step 1: Configure Cloudflare Account

### 1.1 Login to Wrangler

```bash
wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

### 1.2 Get Your Account ID

```bash
wrangler whoami
```

Copy your Account ID - you'll need it later.

## Step 2: Create D1 Database

The database stores only encrypted metadata, never actual message content.

### 2.1 Create the Database

```bash
wrangler d1 create uunn-db
```

**Save the output!** It will look like:
```
[[d1_databases]]
binding = "DB"
database_name = "uunn-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2.2 Update wrangler.toml

Copy the `database_id` from the output above and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "uunn-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Replace with your actual ID
```

### 2.3 Initialize the Database Schema

```bash
wrangler d1 execute uunn-db --file=./schema.sql
```

Verify the tables were created:

```bash
wrangler d1 execute uunn-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

## Step 3: Set Up Cloudflare Pages

### 3.1 Create Pages Project

```bash
npm install
npm run pages:build
wrangler pages project create uunn
```

When prompted:
- Production branch: `main` (or your default branch)
- Select "Direct Upload" for deployment

### 3.2 Bind D1 Database to Pages

```bash
wrangler pages deployment create uunn --binding DB=uunn-db
```

## Step 4: Configure Custom Domain

### 4.1 Add Domain to Cloudflare (if not already)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click "Add a Site"
3. Enter `uunn.io`
4. Follow the setup wizard to configure nameservers at your domain registrar

### 4.2 Add Custom Domain to Pages

**Option A: Via Wrangler CLI**

```bash
wrangler pages domain add uunn www.uunn.io
```

**Option B: Via Dashboard**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **uunn** → **Custom domains**
3. Click **Set up a custom domain**
4. Enter `www.uunn.io`
5. Click **Continue** and **Activate domain**

The SSL certificate will be automatically provisioned (takes 1-5 minutes).

### 4.3 Configure DNS (if needed)

Cloudflare should auto-configure DNS, but verify:

1. Go to **DNS** → **Records**
2. Ensure you have a CNAME record:
   - Type: `CNAME`
   - Name: `www`
   - Target: `uunn.pages.dev` (or your Pages URL)
   - Proxy status: Proxied (orange cloud)

### 4.4 Add Apex Domain Redirect (Optional)

To redirect `uunn.io` → `www.uunn.io`:

1. Go to **Rules** → **Page Rules** (or Redirect Rules)
2. Create rule:
   - If: `uunn.io/*`
   - Then: Redirect to `https://www.uunn.io/$1`
   - Status code: 301 (Permanent)

## Step 5: Deploy the Application

### 5.1 Build and Deploy

```bash
npm run deploy
```

This will:
1. Build the Next.js app for Cloudflare Pages
2. Upload to Cloudflare Pages
3. Deploy to production

### 5.2 Verify Deployment

After deployment completes, you'll see output like:

```
✨ Deployment complete! Take a peek over at https://uunn.pages.dev
```

Visit both:
- https://uunn.pages.dev (Cloudflare Pages URL)
- https://www.uunn.io (Your custom domain)

## Step 6: Configure Production Environment

### 6.1 Set Environment Variables

In the Cloudflare Dashboard:

1. Go to **Pages** → **uunn** → **Settings** → **Environment variables**
2. Add production variables:
   - `NEXT_PUBLIC_API_URL`: `https://www.uunn.io/api`
   - `ENVIRONMENT`: `production`

### 6.2 Redeploy with Environment Variables

```bash
npm run deploy
```

## Step 7: Enable Security Features

### 7.1 Configure SSL/TLS

1. Go to **SSL/TLS** → **Overview**
2. Set mode to **Full (strict)**

### 7.2 Enable Security Headers

The app already includes security headers in `next.config.js`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera=(), microphone=(), geolocation=()

### 7.3 Configure Content Security Policy (Optional)

1. Go to **Security** → **Settings**
2. Enable **Always Use HTTPS**
3. Enable **Automatic HTTPS Rewrites**
4. Enable **Minimum TLS Version**: TLS 1.2 or higher

## Step 8: Monitor and Verify

### 8.1 Check Deployment Status

```bash
wrangler pages deployment list --project-name=uunn
```

### 8.2 View Logs

```bash
wrangler pages deployment tail --project-name=uunn
```

### 8.3 Test Core Functionality

Visit www.uunn.io and verify:
- [ ] Homepage loads
- [ ] Can create a group
- [ ] Can generate an invite code
- [ ] Can join a group
- [ ] Encryption works (check browser DevTools → IndexedDB)
- [ ] Messages are encrypted in transit

## Step 9: Set Up Continuous Deployment (Optional)

### 9.1 Connect Git Repository

1. Go to Cloudflare Dashboard → **Pages** → **uunn** → **Settings** → **Builds & deployments**
2. Click **Connect to Git**
3. Select your repository (GitHub/GitLab)
4. Configure:
   - Production branch: `main`
   - Build command: `npm run pages:build`
   - Build output directory: `.vercel/output/static`

### 9.2 Automatic Deployments

Now every push to `main` will automatically deploy to www.uunn.io!

## Troubleshooting

### Issue: Database not found

**Solution:** Ensure D1 binding is configured:

```bash
wrangler pages deployment create uunn --binding DB=uunn-db
```

### Issue: Custom domain not working

**Solution:**
1. Verify DNS records are proxied (orange cloud)
2. Wait 1-5 minutes for SSL certificate
3. Check SSL/TLS mode is **Full (strict)**

### Issue: 404 on API routes

**Solution:**
1. Ensure `@cloudflare/next-on-pages` is properly installed
2. Rebuild: `npm run pages:build`
3. Redeploy: `wrangler pages deploy .vercel/output/static`

### Issue: Environment variables not working

**Solution:**
1. Set variables in Cloudflare Dashboard (Pages → Settings → Environment variables)
2. Redeploy after changing environment variables

## Useful Commands

```bash
# View Pages projects
wrangler pages project list

# View deployments
wrangler pages deployment list --project-name=uunn

# Tail logs
wrangler pages deployment tail --project-name=uunn

# View D1 database
wrangler d1 execute uunn-db --command="SELECT * FROM groups;"

# Local development with Cloudflare runtime
npm run preview
```

## Next Steps

After deployment:

1. **Set up monitoring**: Configure Cloudflare Analytics
2. **Enable Web Analytics**: Add privacy-preserving analytics
3. **Create backups**: Set up automated D1 backups (via Wrangler)
4. **Test at scale**: Invite beta users
5. **Set up error tracking**: Configure error logging
6. **Document APIs**: Create API documentation if needed
7. **Mobile optimization**: Test on mobile devices
8. **Accessibility audit**: Run a11y tests

## Production Checklist

Before announcing the launch:

- [ ] Custom domain www.uunn.io is working
- [ ] SSL certificate is active
- [ ] Database is initialized
- [ ] Security headers are enabled
- [ ] Environment variables are set
- [ ] Create group flow works
- [ ] Join group flow works
- [ ] End-to-end encryption verified
- [ ] Invite codes generate correctly
- [ ] Message sending/receiving works
- [ ] IndexedDB storage works
- [ ] Mobile responsive design verified
- [ ] Legal pages created (Privacy Policy, Terms of Service)
- [ ] Support email configured (support@uunn.io)

## Cost Estimate

Cloudflare Free Tier includes:
- Unlimited Pages deployments
- 100,000 requests/day
- 5 GB storage (D1)
- Global CDN
- SSL certificates

**Estimated cost for initial launch: $0/month**

For scaling:
- Cloudflare Workers Paid: $5/month (10M requests)
- D1 Paid: $5/month (25M row reads)
- Total: ~$10/month for moderate usage

## Support

- **Documentation**: This file
- **Cloudflare Docs**: https://developers.cloudflare.com/pages/
- **Next.js on Cloudflare**: https://developers.cloudflare.com/pages/framework-guides/nextjs/
- **D1 Documentation**: https://developers.cloudflare.com/d1/

---

**Congratulations! You're ready to launch uunn at www.uunn.io! 🚀**
