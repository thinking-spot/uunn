# DNS Setup for www.uunn.io

This guide helps you configure DNS for your uunn.io domain on Cloudflare.

## Prerequisites

- Domain `uunn.io` added to Cloudflare
- Cloudflare Pages project created

## Option 1: Automatic Setup (Recommended)

When you add a custom domain via the Cloudflare Dashboard or CLI, DNS records are created automatically.

```bash
wrangler pages domain add uunn www.uunn.io
```

Cloudflare will automatically:
1. Create the necessary DNS records
2. Provision SSL certificate
3. Configure proxy settings

## Option 2: Manual DNS Configuration

If you need to manually configure DNS:

### Step 1: Log into Cloudflare Dashboard

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Select the `uunn.io` domain

### Step 2: Add DNS Records

Navigate to **DNS** → **Records** and add:

#### Primary Domain (www.uunn.io)

| Type  | Name | Target              | Proxy Status | TTL  |
|-------|------|---------------------|--------------|------|
| CNAME | www  | uunn.pages.dev      | Proxied ☁️   | Auto |

#### Apex Domain (uunn.io)

Choose one of these options:

**Option A: CNAME Flattening (Recommended)**

| Type  | Name | Target              | Proxy Status | TTL  |
|-------|------|---------------------|--------------|------|
| CNAME | @    | uunn.pages.dev      | Proxied ☁️   | Auto |

**Option B: A Record**

| Type | Name | Target           | Proxy Status | TTL  |
|------|------|------------------|--------------|------|
| A    | @    | 192.0.2.1        | Proxied ☁️   | Auto |

*Note: Replace `192.0.2.1` with Cloudflare's IP provided in Pages settings*

### Step 3: Configure Redirect (Optional)

To redirect `uunn.io` → `www.uunn.io`:

#### Using Page Rules (Legacy)

1. Go to **Rules** → **Page Rules**
2. Create rule:
   - URL: `uunn.io/*`
   - Setting: **Forwarding URL** → `301 - Permanent Redirect`
   - Destination: `https://www.uunn.io/$1`

#### Using Redirect Rules (Modern)

1. Go to **Rules** → **Redirect Rules**
2. Create rule:
   - **If**: Hostname equals `uunn.io`
   - **Then**: Dynamic redirect
   - **Expression**: `concat("https://www.uunn.io", http.request.uri.path)`
   - **Status code**: 301

### Step 4: Configure Email (Optional)

If you want to use email addresses like `support@uunn.io`:

#### Using Cloudflare Email Routing (Free)

1. Go to **Email** → **Email Routing**
2. Enable Email Routing
3. Add destination address (your personal email)
4. Create routing rules:
   - `support@uunn.io` → your-email@example.com
   - `hello@uunn.io` → your-email@example.com

Required DNS records (auto-created):

| Type | Name             | Target                                  |
|------|------------------|-----------------------------------------|
| MX   | @                | route1.mx.cloudflare.net (Priority 89)  |
| MX   | @                | route2.mx.cloudflare.net (Priority 13)  |
| MX   | @                | route3.mx.cloudflare.net (Priority 86)  |
| TXT  | @                | v=spf1 include:_spf.mx.cloudflare.net ~all |

## Verify DNS Configuration

### Check DNS Propagation

```bash
# Check CNAME record
dig www.uunn.io CNAME +short

# Check from multiple locations
dig @8.8.8.8 www.uunn.io
dig @1.1.1.1 www.uunn.io
```

Expected output:
```
www.uunn.io CNAME uunn.pages.dev
```

### Online Tools

- [DNS Checker](https://dnschecker.org/) - Check propagation globally
- [What's My DNS](https://www.whatsmydns.net/) - Verify DNS records worldwide
- [DNS Lookup](https://mxtoolbox.com/DNSLookup.aspx) - Comprehensive DNS analysis

### Test SSL Certificate

```bash
# Check SSL certificate
openssl s_client -connect www.uunn.io:443 -servername www.uunn.io < /dev/null
```

Or visit: https://www.ssllabs.com/ssltest/analyze.html?d=www.uunn.io

## Common DNS Settings

### Recommended Security Settings

1. **DNSSEC**: Enable in Cloudflare Dashboard → DNS → Settings
   - Protects against DNS spoofing

2. **CAA Records**: Control which CAs can issue certificates
   ```
   Type: CAA
   Name: @
   Tag: issue
   Value: letsencrypt.org
   ```
   ```
   Type: CAA
   Name: @
   Tag: issuewild
   Value: letsencrypt.org
   ```

3. **HSTS**: Enable in Cloudflare Dashboard → SSL/TLS → Edge Certificates
   - Enable HSTS
   - Max Age: 12 months
   - Include subdomains: Yes
   - Preload: Yes

## SSL/TLS Configuration

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode: **Full (strict)**
3. Enable features:
   - ✅ Always Use HTTPS
   - ✅ Automatic HTTPS Rewrites
   - ✅ Opportunistic Encryption
   - ✅ TLS 1.3

## Cloudflare Proxy Settings

**Recommended: Proxied (Orange Cloud)**

Benefits:
- Free SSL certificate
- DDoS protection
- Global CDN caching
- Web Application Firewall (WAF)
- Analytics

**DNS-only (Grey Cloud)**

Use only if you need:
- Direct IP exposure
- Custom SSL certificate
- Bypass Cloudflare proxy

For uunn, always use **Proxied** for security and performance.

## Troubleshooting

### Domain not resolving

1. Check nameservers point to Cloudflare:
   ```bash
   dig uunn.io NS +short
   ```
2. Expected: Cloudflare nameservers (e.g., `alice.ns.cloudflare.com`)

### SSL errors

1. Verify SSL/TLS mode is **Full (strict)**
2. Wait 1-5 minutes for certificate provisioning
3. Clear browser cache: `Ctrl+Shift+R`

### Redirect loop

1. Check SSL/TLS mode: should be **Full (strict)**, not **Flexible**
2. Disable redirect rules temporarily to isolate issue

### Email not working

1. Verify MX records are correct
2. Check SPF record is present
3. Test email routing: send test email to `support@uunn.io`

## Timeline Expectations

| Action | Time |
|--------|------|
| DNS record propagation | 1-5 minutes (with Cloudflare) |
| Global DNS propagation | Up to 48 hours (typically < 1 hour) |
| SSL certificate provisioning | 1-5 minutes |
| Email routing activation | 5-10 minutes |

## Next Steps

After DNS is configured:

1. ✅ Verify `www.uunn.io` resolves
2. ✅ Check SSL certificate is valid
3. ✅ Test redirect from `uunn.io` → `www.uunn.io`
4. ✅ Deploy application to Cloudflare Pages
5. ✅ Test full application functionality

---

**Your domain is now ready for the uunn platform! 🌐**
