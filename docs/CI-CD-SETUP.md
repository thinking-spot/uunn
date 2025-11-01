# CI/CD Setup for uunn

Automate deployments to www.uunn.io using GitHub Actions.

## Overview

Every push to `main` automatically deploys to production at www.uunn.io.

## Prerequisites

- GitHub repository for uunn
- Cloudflare account with Pages project set up
- Cloudflare API token

## Step 1: Create Cloudflare API Token

### 1.1 Generate Token

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
2. Click **Create Token**
3. Use the **Edit Cloudflare Workers** template, or create custom token with:

**Permissions:**
- Account → Cloudflare Pages → Edit
- Account → D1 → Edit (optional, for database migrations)

**Account Resources:**
- Include → Your Account

**Zone Resources:**
- Include → Specific zone → `uunn.io`

4. Click **Continue to summary** → **Create Token**
5. **Copy the token** - you'll only see it once!

### 1.2 Get Account ID

```bash
wrangler whoami
```

Or find it in Cloudflare Dashboard → Overview (right sidebar)

## Step 2: Configure GitHub Secrets

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

Add these secrets:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `CLOUDFLARE_API_TOKEN` | Your API token | From Step 1.1 |
| `CLOUDFLARE_ACCOUNT_ID` | Your account ID | From Step 1.2 |

## Step 3: Verify Workflow File

The workflow file is already created at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy to www.uunn.io
    # ... (rest of workflow)
```

## Step 4: Test the Workflow

### 4.1 Push to Main

```bash
git add .
git commit -m "feat: enable CI/CD deployment"
git push origin main
```

### 4.2 Monitor Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. Watch the deployment progress

### 4.3 Verify Production

After the workflow completes (usually 2-3 minutes):
- ✅ Visit https://www.uunn.io
- ✅ Verify changes are live

## Workflow Features

### Automatic Deployments

- **Main branch**: Deploys to production (www.uunn.io)
- **Pull requests**: Creates preview deployments

### Preview Deployments

Each PR gets a unique preview URL:
```
https://abc123.uunn.pages.dev
```

Comment with preview URL is posted on the PR automatically.

### Build Caching

- Node modules are cached between runs
- Faster builds (typically < 2 minutes)

## Advanced Configuration

### Environment-Specific Deployments

Create separate workflows for staging:

**`.github/workflows/deploy-staging.yml`**

```yaml
name: Deploy to Staging

on:
  push:
    branches:
      - develop

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run pages:build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: uunn-staging
          directory: .vercel/output/static
          branch: develop
```

### Database Migrations

Add database migration step:

```yaml
- name: Run database migrations
  run: |
    wrangler d1 execute uunn-db --file=./schema.sql
  env:
    CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
    CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Build Notifications

Add Slack notifications:

```yaml
- name: Notify deployment
  if: success()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "✅ uunn deployed to production!"
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

## Troubleshooting

### Workflow fails with "API token invalid"

**Solution:**
1. Verify `CLOUDFLARE_API_TOKEN` secret is set correctly
2. Regenerate API token with correct permissions
3. Update GitHub secret

### "Project not found" error

**Solution:**
1. Ensure Cloudflare Pages project is created
2. Verify `projectName: uunn` matches your Pages project name
3. Check account ID is correct

### Build fails but works locally

**Solution:**
1. Check Node.js version matches (18+)
2. Use `npm ci` instead of `npm install` locally
3. Check for environment-specific dependencies

### Preview deployments not created for PRs

**Solution:**
1. Verify `pull_request` trigger is in workflow
2. Check GitHub Actions permissions: Settings → Actions → General → Workflow permissions
3. Enable "Read and write permissions"

## Security Best Practices

### API Token Rotation

Rotate tokens every 90 days:
1. Create new token
2. Update GitHub secret
3. Verify deployment works
4. Revoke old token

### Least Privilege

Only grant permissions needed:
- ✅ Cloudflare Pages: Edit
- ❌ Account Settings: No access
- ❌ Billing: No access

### Branch Protection

Protect the main branch:
1. Go to **Settings** → **Branches**
2. Add rule for `main`
3. Enable:
   - ✅ Require pull request reviews
   - ✅ Require status checks (Deploy to Cloudflare Pages)
   - ✅ Require branches to be up to date

## Deployment Metrics

Track deployment performance:

| Metric | Target | Actual |
|--------|--------|--------|
| Build time | < 2 min | ~1.5 min |
| Deploy time | < 1 min | ~30 sec |
| Total time | < 3 min | ~2 min |

## Manual Deployment (Fallback)

If CI/CD fails, deploy manually:

```bash
npm run deploy
```

Or using the deployment script:

```bash
./scripts/deploy.sh
```

## Monitoring Deployments

### Cloudflare Dashboard

1. Go to **Pages** → **uunn**
2. View deployment history
3. Check analytics and logs

### GitHub Actions

1. Go to **Actions** tab
2. Filter by workflow: "Deploy to Cloudflare Pages"
3. View detailed logs for each deployment

### Wrangler CLI

```bash
# List recent deployments
wrangler pages deployment list --project-name=uunn

# Tail deployment logs
wrangler pages deployment tail --project-name=uunn
```

## Next Steps

- [ ] Set up branch protection rules
- [ ] Configure deployment notifications
- [ ] Create staging environment
- [ ] Add automated tests to workflow
- [ ] Set up deployment rollback procedures

---

**Your CI/CD pipeline is ready! Every push to main now automatically deploys to www.uunn.io 🚀**
