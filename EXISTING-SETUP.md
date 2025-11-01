# Your Existing uunn Infrastructure

This document summarizes your current Cloudflare setup and how we're using it for the www.uunn.io launch.

## Current Infrastructure

### Cloudflare Account
- **Email**: jml1308@gmail.com
- **Account ID**: `96b8260d5d6c241b69dd7a42d3a30272`
- **Status**: ✅ Authenticated and ready
- **Permissions**: Full access (Workers, D1, Pages, SSL, etc.)

### Existing D1 Database
- **Name**: `uunn-dev`
- **Database ID**: `96d79317-8571-4514-b9e8-b004675e5c05`
- **Created**: October 22, 2025
- **Current State**: Empty (0 tables)
- **New Use**: Local development database

### Pages Projects
- **Current**: None
- **Will Create**: `uunn` (for www.uunn.io)

### Workers
- **Current**: None active
- **Strategy**: Using Cloudflare Pages instead (better for Next.js)

## What We're Doing

### ✅ Reusing (No Duplicates)
1. **Your existing `uunn-dev` database**
   - Will be initialized with proper schema
   - Used for local development (`npm run dev`)
   - Already configured in `wrangler.toml`

### ➕ Creating New
1. **Production database**: `uunn-production`
   - Separate from dev for data isolation
   - Used for www.uunn.io production site
   - Auto-created by `./scripts/setup-database.sh`

2. **Pages project**: `uunn`
   - Hosts www.uunn.io
   - Created during first deployment
   - Uses `uunn-production` database

## Configuration Files Updated

### `wrangler.toml`
```toml
# Production (www.uunn.io)
[[d1_databases]]
binding = "DB"
database_name = "uunn-production"
database_id = "AUTO_FILLED_BY_SCRIPT"

# Development (localhost)
[env.development]
[[env.development.d1_databases]]
binding = "DB"
database_name = "uunn-dev"
database_id = "96d79317-8571-4514-b9e8-b004675e5c05"  # Your existing DB
```

### Result: Clean Separation
- **Development**: Uses `uunn-dev` (your existing database)
- **Production**: Uses `uunn-production` (new, separate database)
- **No conflicts**: Different databases for different environments

## What Happens When You Run setup-database.sh

The script is smart and knows about your existing setup:

```bash
./scripts/setup-database.sh
```

**It will:**

1. ✅ **Detect** your existing `uunn-dev` database
2. 📋 **Initialize** it with the proper schema (8 tables)
3. ➕ **Create** a new `uunn-production` database
4. 📋 **Initialize** the production database with the same schema
5. ⚙️ **Update** `wrangler.toml` automatically with the production DB ID
6. ✨ **Verify** both databases are set up correctly

**It will NOT:**
- ❌ Create duplicate databases
- ❌ Delete your existing database
- ❌ Require manual editing of configs

## Database Schema

Both databases get these 8 tables:
- `groups` - Encrypted group metadata
- `group_members` - Pseudonymous member info
- `invitations` - Invite code tracking
- `message_metadata` - Message sync (not content!)
- `actions` - Proposals, petitions, etc.
- `votes` - Encrypted voting
- `sync_log` - Real-time sync
- `audit_log` - Privacy audit trail

**Important**: Only encrypted metadata is stored. Actual messages, identities, and sensitive data stay client-side in IndexedDB.

## Local Development Workflow

```bash
# Use your existing dev database
npm run dev

# Or explicitly use development environment
wrangler pages dev --d1 DB=uunn-dev
```

The `uunn-dev` database is automatically used for local development.

## Production Deployment Workflow

```bash
# Deploy to www.uunn.io (uses uunn-production database)
./scripts/deploy.sh

# Or manually
npm run pages:build
wrangler pages deploy .vercel/output/static --project-name=uunn
```

The production database is automatically bound to your Pages deployment.

## Avoiding Conflicts

### Database Naming
- ✅ `uunn-dev` - Local development (existing)
- ✅ `uunn-production` - www.uunn.io (new)
- ❌ No `uunn-db` - Avoided to prevent confusion

### Project Naming
- ✅ `uunn` - Pages project name
- ✅ Matches your repository and domain

### No Worker Conflicts
- We're using **Cloudflare Pages** (not Workers)
- Pages handles routing, serverless functions, and static hosting
- No need for separate Workers
- No conflicts with previous Worker tests

## Checking Your Setup

At any time, you can verify your infrastructure:

```bash
# List all D1 databases
wrangler d1 list

# Check a specific database
wrangler d1 execute uunn-dev --command="SELECT name FROM sqlite_master WHERE type='table';"

# List Pages projects
wrangler pages project list

# View deployments
wrangler pages deployment list --project-name=uunn
```

## Cost & Limits

Everything stays on Cloudflare's free tier:

| Resource | Your Usage | Free Tier Limit | Cost |
|----------|------------|-----------------|------|
| D1 Databases | 2 | 10 | $0 |
| D1 Storage | ~1 MB | 5 GB | $0 |
| D1 Reads | Low | 5M/day | $0 |
| Pages Project | 1 | 100 | $0 |
| Pages Requests | TBD | 100K/day | $0 |
| Custom Domain | 1 | Unlimited | $0 |
| SSL Certificate | 1 | Unlimited | $0 |

**Total cost: $0/month** for initial launch and moderate usage.

## Migration from Old Testing

If you had any old test data or configurations:

### Old Workers (if any)
- Not needed - Pages replaces Workers for this use case
- Can be deleted or left inactive (no cost)

### Old D1 Databases (if more than uunn-dev)
- Can be deleted if not needed
- Or kept for future testing

### Old Pages Projects (if any)
- Can be deleted or repurposed
- No conflicts with the new `uunn` project

## Clean Up Old Resources (Optional)

If you want to clean up old test resources:

```bash
# List all resources
wrangler d1 list
wrangler pages project list

# Delete old databases (if any besides uunn-dev)
wrangler d1 delete old-database-name

# Delete old Pages projects (if any)
wrangler pages project delete old-project-name
```

**Recommendation**: Keep `uunn-dev` as it's already configured and working.

## Next Steps

1. **Run the setup script** from your local machine:
   ```bash
   cd /Users/james/uunn
   ./scripts/setup-database.sh
   ```

2. **Deploy to production**:
   ```bash
   ./scripts/deploy.sh
   ```

3. **Add your custom domain**:
   ```bash
   wrangler pages domain add uunn www.uunn.io
   ```

4. **Visit your site**:
   - https://www.uunn.io

## Support

If you encounter any issues:

1. Check database status: `wrangler d1 list`
2. View deployment logs: `wrangler pages deployment tail --project-name=uunn`
3. Verify configuration: Check `wrangler.toml` has both databases listed
4. Review this guide: All your existing resources are documented here

## Summary

**No conflicts!** Your existing infrastructure is perfectly positioned for the launch:
- ✅ Reusing `uunn-dev` for development
- ✅ Creating separate `uunn-production` for www.uunn.io
- ✅ Clean separation between environments
- ✅ No duplicate resources
- ✅ Everything automated via scripts

You're ready to launch! 🚀
