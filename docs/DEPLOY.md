# Deploying ExpansionLens to Production (DigitalOcean Droplet)

This is the complete deployment guide for launching ExpansionLens on a fresh
DigitalOcean Droplet.

## The stack

Three containers orchestrated by `docker-compose.prod.yml`:

| Container | Image | Role |
|---|---|---|
| **caddy** | `caddy:2-alpine` | TLS termination (auto Let's Encrypt), reverse proxy, HTTP/3, compression, bot filtering |
| **web** | built from `Dockerfile` | Next.js 14 standalone, Prisma migrations on start, runs as non-root |
| **postgres** | `postgres:16-alpine` | Primary database, named volume for persistence |

The `web` container loads data from these live APIs at request time:

**Universal (all industries):**
- U.S. Census Bureau ACS 5-year estimates (demographics, insurance coverage)
- Google Places API (competitor ratings and reviews)
- Walk Score API (walkability, transit)
- OpenStreetMap + Overpass (geographic mapping, POIs)
- Stripe (checkout + webhooks)
- Resend (transactional email)

**Dental-only federal data (added post-launch prep):**
- CMS NPI Registry (licensed dentist counts by specialty, growth signal)
- Census Bureau LEHD QWI (county-level daytime workforce by industry)
- Census ACS S2701 / S2703 / S2704 (payer mix at tract level)
- CHCS Medicaid Adult Dental Benefit Tracker (hardcoded lookup by state)

All four dental data sources are **free and require no API keys**. They
activate automatically when a user selects "dental" in the analysis form.

The site serves two landing pages via Next.js rewrites:
- `https://expansionlens.com/` → universal landing (dental + bars)
- `https://expansionlens.com/dental` → dental-focused landing

---

## Launch day checklist (skim version)

Before you SSH anywhere, make sure you have credentials for:

- [ ] **DigitalOcean** — account + payment method
- [ ] **Domain** — DNS registrar with access to modify A records for `expansionlens.com`
- [ ] **Stripe** — live mode API keys (`sk_live_...`)
- [ ] **Resend** — production API key, with ability to verify `expansionlens.com` domain
- [ ] **Sentry** (optional but recommended) — Next.js project + DSN + auth token
- [ ] **Google Places API** (optional) — for competitor ratings
- [ ] **Walk Score API** (optional) — for walkability data

During launch:

- [ ] Steps 1–14 in this guide, in order
- [ ] Post-deploy smoke tests (section below) all pass
- [ ] First admin account created
- [ ] Backup cron job tested and scheduled

Post-launch (first week):

- [ ] Submit `https://expansionlens.com/sitemap.xml` to Google Search Console
- [ ] Submit the same to Bing Webmaster Tools
- [ ] Verify daily backup ran overnight (check DO Spaces bucket)
- [ ] Watch Sentry for error patterns
- [ ] Stress test: run at least 5 real address analyses through the dental flow

---

## 1. Provision the Droplet

1. In the DigitalOcean console → **Create → Droplets**:
   - **Image:** Ubuntu 24.04 LTS
   - **Plan:** Basic → Regular → **2 GB RAM / 1 CPU** (~$12/mo). Do NOT pick
     the $6 tier — the Next.js build can run out of RAM.
   - **Datacenter:** closest to your target customer base
   - **Authentication:** SSH key (never password)
   - **Hostname:** `expansionlens-prod`
2. Note the Droplet's public IPv4 address.

## 2. Point DNS at the Droplet

At your DNS provider, add two A records:

```
expansionlens.com       A   <droplet-ip>
www.expansionlens.com   A   <droplet-ip>
```

Wait until `dig expansionlens.com +short` returns the new IP before
continuing. Usually under 5 minutes with most registrars, up to an hour for
some.

## 3. Initial server hardening

SSH in as `root` and run:

```bash
# Update everything
apt update && apt upgrade -y

# Create a non-root user for deploys
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

# Basic firewall
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp   # HTTP/3 for Caddy
ufw --force enable

# Disable root SSH and password auth
sed -i 's/^#*PermitRootLogin .*/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart ssh
```

From now on, SSH in as `deploy@<droplet-ip>`, not root.

## 4. Install Docker and dependencies

```bash
# Docker Engine + Compose plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
newgrp docker   # pick up the group without logging out

# AWS CLI (used by backup-postgres.sh to talk to DO Spaces)
sudo apt install -y awscli git

# Verify
docker --version
docker compose version
aws --version
```

## 5. Clone the repo

```bash
sudo mkdir -p /opt/expansionlens
sudo chown deploy:deploy /opt/expansionlens
cd /opt/expansionlens
git clone https://github.com/papertelevision/expansionlens.git .
```

## 6. Create the DO Spaces bucket for backups

In the DO dashboard:

1. **Spaces Object Storage → Create a Spaces Bucket**
2. **Region:** same region as the Droplet (e.g. `nyc3`)
3. **Name:** `expansionlens-backups`
4. **Restrict file listing:** Enable
5. Save.
6. **API → Spaces Keys → Generate New Key**
7. Copy the access key and secret — save for the `.env` file in step 10.

## 7. Verify your domain in Resend

Resend refuses to send from unverified domains, so this must happen before
users can log in (magic-link emails will fail silently otherwise).

1. Log in to Resend → **Domains → Add Domain** → `expansionlens.com`
2. Resend shows DNS records (DKIM, SPF, DMARC). Add all of them at your DNS
   provider.
3. Wait for status to flip to **Verified** — usually 5–15 minutes.
4. Under **API Keys**, create a production key if you don't already have one.

## 8. Sign up for Sentry (optional but strongly recommended)

1. Create a Sentry project of type "Next.js"
2. Copy the DSN (starts with `https://...@o...ingest.sentry.io/...`)
3. Under **Settings → Auth Tokens**, create a token with `project:releases`
   and `org:read` scopes — enables source map upload during build so stack
   traces in production are symbolicated.

## 9. Configure the Stripe webhook

**IMPORTANT:** deploy first with test mode keys, verify the full payment
flow works, THEN switch to live mode. Don't push to live until you've run a
successful test purchase end-to-end.

Once you're ready for live mode:

1. In the Stripe dashboard, switch to **Live mode** (top left toggle)
2. **Developers → Webhooks → Add endpoint**
3. **Endpoint URL:** `https://expansionlens.com/api/webhooks/stripe`
4. **Events to listen for:**
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
5. Copy the **Signing secret** (starts with `whsec_...`) — for `.env`
6. Copy the **live API key** (starts with `sk_live_...`) from
   **Developers → API keys**

## 10. Create the production `.env`

```bash
cd /opt/expansionlens
cp .env.example .env
nano .env
```

Fill in every starred row. Generate strong random strings with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

| Variable | Where it comes from |
|---|---|
| `*NODE_ENV` | `production` |
| `*DATABASE_URL` | Leave as the dev value — `docker-compose.prod.yml` overrides it |
| `*POSTGRES_PASSWORD` | Generate a new random string |
| `*SESSION_SECRET` | Generate a new random string (must be ≥ 32 chars) |
| `*STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys (live mode, `sk_live_...`) |
| `*STRIPE_WEBHOOK_SECRET` | Step 9 (`whsec_...`) |
| `*RESEND_API_KEY` | Step 7 |
| `*EMAIL_FROM` | `ExpansionLens <noreply@expansionlens.com>` (domain must be verified in step 7) |
| `*NEXT_PUBLIC_BASE_URL` | `https://expansionlens.com` |
| `SENTRY_DSN` | Step 8 (server-side) |
| `NEXT_PUBLIC_SENTRY_DSN` | Step 8 (same project, client-side) |
| `SENTRY_AUTH_TOKEN` | Step 8 |
| `SENTRY_ORG` / `SENTRY_PROJECT` | From your Sentry project URL |
| `DO_SPACES_KEY` / `DO_SPACES_SECRET` | Step 6 |
| `DO_SPACES_BUCKET` | `expansionlens-backups` |
| `DO_SPACES_REGION` | e.g. `nyc3` |
| `DO_SPACES_ENDPOINT` | e.g. `https://nyc3.digitaloceanspaces.com` |
| `WALKSCORE_API_KEY` | Optional — walkscore.com/professional/api.php |
| `GOOGLE_PLACES_API_KEY` | Optional — console.cloud.google.com |

Save (`Ctrl+O`, `Enter`, `Ctrl+X`) and lock it down:

```bash
chmod 600 .env
```

**No API keys are required for the dental-specific federal data sources**
(NPI Registry, Census ACS, LEHD QWI, CHCS Medicaid tracker). They activate
automatically when a user analyzes a dental address.

## 11. First deploy

```bash
cd /opt/expansionlens
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f web
```

First build takes 3–5 minutes. Wait for the line `Next.js ... Ready`.

In a second SSH session, watch Caddy obtain TLS certs:

```bash
docker compose -f docker-compose.prod.yml logs -f caddy
```

You'll see `certificate obtained successfully` for both
`expansionlens.com` and `www.expansionlens.com`. Both happen within ~30
seconds of the web container becoming ready.

## 12. Post-deploy smoke tests

Before declaring the deploy successful, verify **all** of these from your
laptop's browser:

### Public pages

- [ ] `https://expansionlens.com/` → universal landing page loads, spinning
      globe visible, logo crisp against the dark gradient, hero form works
- [ ] `https://expansionlens.com/dental` → dental-focused landing page loads
      (check for "The Location Intelligence Platform Built for New Dental
      Practices" headline)
- [ ] `https://www.expansionlens.com/` → redirects to apex
- [ ] `https://expansionlens.com/sample` → dental sample report renders
      ALL sections including:
  - Score + breakdown as percentages (70%, 80%, etc.)
  - Daytime Workforce (945K jobs, 0.73× ratio)
  - Payer Mix & Coverage (84.4% private, "Limited" Medicaid pill)
  - Local Dental Provider Landscape (40 providers, specialty breakdown)
  - "Why this matters" qualifier pills under each of the three new sections
- [ ] `https://expansionlens.com/sitemap.xml` → returns the sitemap XML
- [ ] `https://expansionlens.com/blog` → blog index loads with all 6 articles

### Full purchase funnel (test mode first)

1. **Homepage form** — submit a real U.S. address, select Dental
2. **Report page** — free preview loads with score + gated sections
3. **Unlock CTA** — click "Get Full Report"
4. **Email gate** — enter a real email, receive the magic link within 30s
5. **Magic link** — click it, return to the report page authenticated
6. **Checkout** — click "Get Full Report — $149", redirect to Stripe
7. **Test card** — use `4242 4242 4242 4242` with any future date and CVC
8. **Return to report** — full report unlocks automatically
9. **Verify all dental sections** render with real data:
   - Provider Landscape shows real NPI counts by specialty
   - Payer Mix shows real Census percentages and your state's Medicaid tier
   - Daytime Workforce shows real county employment
10. **Account page** — `/account` shows the purchased report in history
11. **Admin** — log in at `/admin`, see the new user + report in the analytics

### Infrastructure

- [ ] SSL cert valid (no browser warnings)
- [ ] `curl -I https://expansionlens.com/` shows security headers
      (`Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`)
- [ ] Sentry dashboard shows at least one event from the smoke test
- [ ] `docker compose -f docker-compose.prod.yml ps` shows all three
      containers running with status `healthy`

Only after all smoke tests pass should you switch Stripe from test to live
mode (step 9 above covers this — update the two env vars and restart
`web`).

## 13. Set up the first admin account

```bash
docker compose -f docker-compose.prod.yml exec web \
  node scripts/set-admin-password.js you@example.com 'a-strong-password'
```

Then log in at `https://expansionlens.com/admin`.

## 14. Wire up daily backups

Create a separate env file for the backup script (kept outside the repo
so the secrets don't leak into git):

```bash
sudo tee /etc/expansionlens-backup.env > /dev/null <<EOF
POSTGRES_PASSWORD=<same as in .env>
DO_SPACES_KEY=<from step 6>
DO_SPACES_SECRET=<from step 6>
DO_SPACES_BUCKET=expansionlens-backups
DO_SPACES_REGION=nyc3
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
PROJECT_DIR=/opt/expansionlens
EOF
sudo chmod 600 /etc/expansionlens-backup.env
```

Test the backup script manually:

```bash
sudo /opt/expansionlens/scripts/backup-postgres.sh
```

You should see a `.sql.gz` file in the `postgres/YYYY-MM-DD/` folder of
your Spaces bucket. If that works, schedule it:

```bash
sudo crontab -e
# Add this line at the bottom:
0 3 * * * /opt/expansionlens/scripts/backup-postgres.sh >> /var/log/expansionlens-backup.log 2>&1
```

The script runs at 3 AM UTC every day, uploads a timestamped `pg_dump.gz`
to DO Spaces, and keeps the last 30 days (local and remote).

## 15. Enable DigitalOcean Droplet snapshots (belt-and-suspenders)

In the DO console → Droplet → **Backups** → enable weekly backups
(~$1.20/mo for a 2GB Droplet). These are full-disk snapshots so if the
Droplet itself is destroyed you can restore the entire VM. Independent of
the pg_dump backups, which protect you against database corruption.

## 16. Submit to search engines (post-launch)

Now that the site is live at `https://expansionlens.com/`, register it
with search engines so the SEO/AEO work starts getting indexed.

1. **Google Search Console** — verify ownership via DNS TXT record,
   submit `https://expansionlens.com/sitemap.xml`
2. **Bing Webmaster Tools** — same flow, same sitemap URL
3. **Google Business Profile** — if applicable
4. **Schema.org validator** — run `https://expansionlens.com/dental`
   through https://search.google.com/test/rich-results to confirm the 7
   structured data schemas (Organization, WebSite, WebPage, Service,
   Product, BreadcrumbList, FAQPage) validate cleanly

---

## Going live: accepting real payments

Once the site is deployed, SSL is working, and smoke tests pass on test
mode, follow these steps to start accepting real money.

### 1. Switch Stripe to live mode

**In the Stripe dashboard:**

1. Toggle to **Live mode** (top-left switch)
2. **Developers → API keys** → copy the live secret key (`sk_live_...`)
3. **Developers → Webhooks → Add endpoint**
   - **Endpoint URL:** `https://expansionlens.com/api/webhooks/stripe`
   - **Events to listen for:**
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded`
     - `checkout.session.async_payment_failed`
4. Copy the **Signing secret** (`whsec_...`)

**On the droplet:**

```bash
cd /opt/expansionlens
nano .env
```

Update these values:

```
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

If you created a separate live-mode product in Stripe, update
`STRIPE_PRODUCT_ID` too. Otherwise leave it — the app falls back to
inline product data.

```bash
docker compose -f docker-compose.prod.yml restart web
```

Restart is near-instant — no rebuild needed for env-only changes.

### 2. Verify your domain in Resend and set EMAIL_FROM

Without this, magic-link emails either come from the Resend sandbox
sender (looks unprofessional and may be flagged as spam) or fail
silently in some email clients.

1. **Resend dashboard → Domains → Add Domain** → `expansionlens.com`
2. Resend shows DNS records to add (DKIM, SPF, DMARC). Add all of them
   at your DNS registrar (Bluehost) alongside the existing A records.
3. Wait for Resend to show **Verified** (usually 5–15 minutes).
4. On the droplet, update `.env`:
   ```
   EMAIL_FROM=ExpansionLens <noreply@expansionlens.com>
   ```
5. `docker compose -f docker-compose.prod.yml restart web`

### 3. Test the full purchase funnel with a real card

Walk through the entire flow yourself before telling anyone the site
is live:

1. `https://expansionlens.com/` → enter a real U.S. address, select
   Dental
2. Free preview loads with score + gated sections
3. Click "Get Full Report" → enter your real email
4. Receive the magic-link email within 30 seconds (check spam if it
   doesn't arrive — that usually means the Resend domain isn't verified)
5. Click the magic link → return to report page, authenticated
6. Click "Get Full Report — $149" → redirect to Stripe Checkout
7. Pay with a real card (you can refund yourself from the Stripe
   dashboard immediately after)
8. Report unlocks automatically → verify all dental sections render:
   - Provider Landscape (real NPI counts by specialty)
   - Payer Mix (real Census percentages + state Medicaid tier)
   - Daytime Workforce (real county employment data)
9. `https://expansionlens.com/account` → purchased report appears in
   history
10. `https://expansionlens.com/admin` → new user + report visible in
    the dashboard, revenue counter incremented

If any step fails, check the web container logs:

```bash
docker compose -f docker-compose.prod.yml logs --tail=50 web
```

### 4. Set up Sentry error tracking (optional but recommended)

The Sentry integration is already wired into the codebase
(`sentry.client.config.js`, `sentry.server.config.js`,
`sentry.edge.config.js`) — it just needs the env vars to activate.

1. Create a Sentry project of type "Next.js"
2. Copy the DSN (starts with `https://...@o...ingest.sentry.io/...`)
3. Under **Settings → Auth Tokens**, create a token with
   `project:releases` and `org:read` scopes (enables source map upload
   during build)
4. Add to `.env`:
   ```
   SENTRY_DSN=https://...@o...ingest.sentry.io/...
   NEXT_PUBLIC_SENTRY_DSN=https://...@o...ingest.sentry.io/...
   SENTRY_AUTH_TOKEN=sntrys_...
   SENTRY_ORG=your-org
   SENTRY_PROJECT=expansionlens
   ```
5. **Rebuild required** (source maps are uploaded at build time):
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build web
   ```

### Go-live summary

| Change | Command |
|---|---|
| Env-only updates (Stripe keys, EMAIL_FROM, etc.) | `restart web` |
| Sentry setup (needs source map upload) | `up -d --build web` |
| Caddyfile changes (TLS, bot filtering) | `restart caddy` |

---

## Deployment workflow (subsequent updates)

```bash
cd /opt/expansionlens
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

The `web` container's CMD runs `prisma migrate deploy` on start, so any
new migrations you committed will run automatically. Zero manual steps
for most updates.

Watch logs during a deploy:

```bash
docker compose -f docker-compose.prod.yml logs -f web
```

---

## Restoring from a backup

List available backups:

```bash
sudo /opt/expansionlens/scripts/restore-postgres.sh --list
```

Restore a specific one (destructive — asks for typed confirmation):

```bash
sudo /opt/expansionlens/scripts/restore-postgres.sh \
  postgres/2026-04-07/expansionlens-2026-04-07T03-00-00.sql.gz
```

After restore, restart the web service to reconnect:

```bash
docker compose -f docker-compose.prod.yml restart web
```

---

## Troubleshooting

**Caddy can't get a cert.** Check that DNS actually points at the Droplet
(`dig expansionlens.com +short` should return your IP) and that ports
80/443 are open in `ufw`. Caddy validates over HTTP-01 which requires port
80 to be reachable from the public internet.

**`web` container crashes on start with "Missing required environment
variable".** The env validator is doing its job — check `.env` against
the table in step 10. Common misses: `SESSION_SECRET` set to a placeholder
value, `POSTGRES_PASSWORD` missing, `STRIPE_WEBHOOK_SECRET` empty.

**Stripe webhook returns 400 "Invalid signature".** The `whsec_...` value
is specific to the exact webhook endpoint you created in the Stripe
dashboard. Test-mode and live-mode endpoints have different secrets. Copy
it exactly, no extra whitespace.

**Emails aren't sending.** Check that the Resend domain is verified
(step 7) and that `EMAIL_FROM` uses an address on the verified domain.
Resend's dashboard at https://resend.com/emails shows bounce/reject
reasons for every send attempt.

**Dental reports render but NPI/Payer Mix/Daytime Workforce sections are
missing.** Likely the address geocoded to an incomplete result (no FIPS
codes). Try a more specific street address (not just a city name). If the
problem persists, check server logs:
```bash
docker compose -f docker-compose.prod.yml logs web | grep -iE "npi|census|lehd|workforce|payer"
```
Most common cause: upstream API outage (Census ACS is occasionally
unavailable). All four dental data sources fail gracefully — the report
still generates, the missing sections just don't render.

**Out-of-memory during `docker build`.** If you picked the $6 Droplet
tier (which this guide warned against), add swap:
```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```
Better: resize the Droplet to 2 GB via the DO console.

**Rolling back a broken deploy.** Git checkout the previous commit and
rebuild:
```bash
cd /opt/expansionlens
git log --oneline -10  # find the last known good commit
git checkout <previous-sha>
docker compose -f docker-compose.prod.yml up -d --build
```
If a migration already ran and the new code depends on it, you may need
to restore from a backup first. This is why daily backups matter.

**Admin login blocked / rate-limited.** The admin login has a 5-attempts-
per-15-minutes per-IP rate limit. If you lock yourself out:
- Wait 15 minutes, or
- SSH in and restart the web container (in-memory rate limit resets):
  ```bash
  docker compose -f docker-compose.prod.yml restart web
  ```

**Resetting an admin password.** The standalone Next.js image inlines
`bcryptjs` via webpack, so `scripts/set-admin-password.js` can't run
directly inside the container. Use this two-step approach instead:

1. **On your local machine** (where `node_modules/bcryptjs` exists),
   generate the hash and write it into a temp script:
   ```bash
   cd /path/to/expansionlens
   HASH=$(node -e "console.log(require('bcryptjs').hashSync('new-password', 12))")
   cat > /tmp/fix-admin.js <<SCRIPT
   const { PrismaClient } = require("@prisma/client");
   const p = new PrismaClient();
   p.user.upsert({
     where: { email: "admin@example.com" },
     create: { email: "admin@example.com", isAdmin: true, adminPassword: "${HASH}" },
     update: { isAdmin: true, adminPassword: "${HASH}" },
   }).then(u => { console.log("Admin set:", u.email); return p.\$disconnect(); })
     .catch(e => { console.error(e); process.exit(1); });
   SCRIPT
   scp /tmp/fix-admin.js deploy@138.197.111.172:/tmp/fix-admin.js
   ```

2. **On the droplet**, copy the script into the container and run it:
   ```bash
   docker compose -f docker-compose.prod.yml cp /tmp/fix-admin.js web:/app/fix-admin.js
   docker compose -f docker-compose.prod.yml exec web node fix-admin.js
   rm /tmp/fix-admin.js
   ```

The upsert is safe to re-run — it creates the user if they don't exist
or updates the password if they do.

---

## Cost summary (monthly, approximate)

| Item | Cost |
|---|---|
| DigitalOcean Droplet (2 GB) | ~$12 |
| DigitalOcean Droplet weekly snapshots | ~$1.20 |
| DigitalOcean Spaces (backups) | ~$5 (250 GB, usually free under that) |
| Domain name | varies (~$12/yr amortized) |
| Resend (transactional email) | Free tier: 3,000 emails/mo |
| Stripe | Per-transaction fees only (2.9% + $0.30) |
| Google Places API | Free tier: 10K calls/mo (each dental report uses 1–2) |
| Walk Score API | Free tier: 5K calls/day |
| Census Bureau APIs (ACS, LEHD QWI) | Free, no limits |
| CMS NPI Registry | Free, no limits |
| Sentry (error tracking) | Free tier: 5K errors/mo |
| **Total infra** | **~$18–20/mo** before Stripe fees |

At $149/report, infra covers itself with 1 sale per month. Everything
above that is margin.
