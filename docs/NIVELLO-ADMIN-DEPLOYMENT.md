# Nivello Admin — deployment and one-time setup

The private workspace lives at `/admin/` (static Next.js page) with a PHP API in `/admin-api/`.
CRM data is a JSON store **outside** `public_html`. Lead discovery runs **on demand in GitHub Actions**:
there is no scraper, Docker daemon, database or VPS on Hetzner.

```text
Browser ──HTTPS──> nivello.it/admin/ ──same-origin──> /admin-api/*.php ──> ../nivello-admin-data/store.json
                                                             │
                                                             └─ GitHub REST API (workflow_dispatch / cancel)
                                                                      │
                                           GitHub Actions runner: gosom/google-maps-scraper (localhost only)
                                                  + scripts/lead-discovery-runner.mjs
                                                                      │  signed HTTPS callbacks
                                                                      v
                                                   nivello.it/admin-api/github-callback.php
```

## How discovery works

1. **Start.** "Start discovery" stores a batch and PHP dispatches `.github/workflows/nivello-lead-discovery.yml` through the GitHub REST API.
   - Only one batch runs at a time. The others wait in Nivello's own queue and are dispatched in order, so a queued batch is never replaced.
2. **Run.** The runner starts the scraper on `127.0.0.1:8080` inside the runner, asks Nivello for the remaining search plan, and runs small passes.
   - Results are sent back to `github-callback.php` in chunks.
   - PHP owns qualification, deduplication against the CRM, the counters and the target.
3. **Continue.** Each run has a 60-minute limit and a 48-minute work budget.
   - A batch that needs longer continues in a new run (segment 2, 3, …) from the server-side checkpoint.
   - It stays the same Nivello batch: counters never reset and businesses already seen are never counted again.
4. **Stop.** The batch is marked stopped first, then the exact GitHub run is cancelled. Late callbacks are refused, so no further leads are imported.
5. **No browser needed.** Closing the browser does not stop anything, because progress arrives through callbacks.
   - The admin polls only the local PHP endpoint, every ~5 seconds while a batch is open.
   - GitHub itself is contacted only for dispatch, stop, explicit Refresh, or when a run has been silent for a few minutes.

## Secrets (never commit them)

| Secret | Where | Purpose |
| --- | --- | --- |
| `NIVELLO_GITHUB_TOKEN` | Hetzner only | Fine-grained GitHub token used by PHP to dispatch/cancel the workflow |
| `NIVELLO_ADMIN_CALLBACK_SECRET` | Hetzner **and** GitHub repository secret (same value) | HMAC key for runner → Nivello callbacks |
| Admin access code (`access_code_hash`, or `access_code`) | Hetzner only | The code used to sign in to `/admin/` |

The repository is public, so the access code is **not** in the code. PHP reads it from the secrets file or environment on the server, checks it there, and never sends it to the browser. Until it is set, the sign-in screen reports that access is not configured.

To store a hash rather than the plain code (recommended), generate it once and paste the output into the secrets file as `access_code_hash`:

```bash
php -r "echo password_hash('your-access-code', PASSWORD_DEFAULT), PHP_EOL;"
```

## One-time GitHub setup

1. **Actions:** make sure GitHub Actions is enabled for `PhoenixKola/nivello-website` (Settings → Actions → General).
2. **Push the workflow:** push `.github/workflows/nivello-lead-discovery.yml` to `main`, after owner approval. `workflow_dispatch` only works once the file is on the branch named in `GITHUB_WORKFLOW_REF` (`main` by default).
3. **Create the token:** Settings → Developer settings → Fine-grained tokens.
   - Repository access: **only** `nivello-website`.
   - Repository permissions: **Actions: Read and write** (dispatch, list and cancel runs). Metadata: Read is added automatically. Nothing else.
   - Note the expiry date; when it expires discovery shows "Lead discovery unavailable", while the CRM keeps working.
4. **Generate the callback secret:** at least 32 characters, for example `openssl rand -hex 32`.
5. **Add it to GitHub:** Settings → Secrets and variables → Actions → New repository secret: `NIVELLO_ADMIN_CALLBACK_SECRET` = the value from step 4.
6. **Optional scraper pin:** add the repository variable `NIVELLO_SCRAPER_IMAGE` (e.g. `gosom/google-maps-scraper:<tag>`). By default the workflow uses `gosom/google-maps-scraper:latest`.

## One-time Hetzner setup

1. **PHP requirements:** PHP **8.1+** with `curl`, `json`, `mbstring`, `session` (and `iconv`, recommended).
2. **Data directory:** the store defaults to `<parent of public_html>/nivello-admin-data/`.
   - PHP creates it on first use if the parent is writable. Otherwise create it and make it writable by PHP (`chmod 770`).
   - To use a different path, set `NIVELLO_ADMIN_DATA_DIR`.
3. **Secrets:** use either option:
   - environment variables `NIVELLO_ADMIN_ACCESS_CODE_HASH` (or `NIVELLO_ADMIN_ACCESS_CODE`), `NIVELLO_GITHUB_TOKEN` and `NIVELLO_ADMIN_CALLBACK_SECRET`, if the hosting plan supports them; or
   - a PHP file **outside** `public_html` at `<parent of public_html>/nivello-admin-secrets.php`, permissions `600`:

   ```php
   <?php
   return [
       'access_code_hash' => '$2y$10$…',   // or 'access_code' => 'your-access-code' (min. 8 characters)
       'github_token' => 'github_pat_…',
       'callback_secret' => '…same value as the GitHub secret…',
   ];
   ```

   The file location can be overridden with `NIVELLO_ADMIN_SECRETS_FILE`.
4. **Callback URL:** by default it is built from the admin request host (`https://www.nivello.it/admin-api/github-callback.php`). If the site is reached through several hostnames, set `NIVELLO_ADMIN_PUBLIC_BASE_URL=https://www.nivello.it`. The callback must be HTTPS.
5. **Deploy:** only after owner approval. The normal deploy uploads `out/`, which contains `admin/` and `admin-api/`. The data directory and the secrets file sit outside `public_html` and are never touched by deploys.
6. **Check the workspace:** open `https://www.nivello.it/admin/` and sign in with the access code.
7. **Check Settings:** "Lead discovery (GitHub Actions)" must show token and callback secret *Configured*, GitHub API *Reachable*, and the workflow found.
8. **Survive a redeploy:** create a test tag, redeploy, and confirm the tag is still there.

## First live tests (after both setups)

1. **1-lead test:** Find leads → 1 qualified lead → Start.
   - Watch the card move through Dispatching → Starting runner → Working → Complete.
   - Open "GitHub Actions run" from the card to see the run.
2. **10-lead test:** run with two languages and confirm the counters: Imported 10; Checked = Imported + Rejected + Duplicates.
3. **Stop test:** start a large target and press Stop during Working. Check that:
   - the GitHub run shows *cancelled*;
   - the batch stays *Stopped* with its imported leads kept;
   - no further leads appear.
4. **Queue test:** start two batches and confirm the second shows *Queued*, then runs after the first.

## Operations suite (Batch 8)

The admin sidebar groups product areas: **Overview**, **Growth** (Lead Forge, Analytics), **Business** (Inbox, Projects, Proposals), **Operations** (Site Health) and **System** (Settings). Pages inside an area are local tabs.

Inbox, projects and proposals live in the main CRM store, next to leads. Records point at each other by id, so a conversion or a link is one atomic write. Analytics and Site Health use their own files in the data directory (`analytics/YYYY-MM-DD.json`, `health/state.json`). A problem in one of them never blocks the CRM.

### Analytics

- **How it counts:** `lib/analytics.ts` posts small events to `admin-api/analytics-track.php`, which is public but write-only.
- **Protections:** same-origin only, 2 KB maximum, 300 events per client per hour, and an allowlist of event names.
- **What is stored:** daily aggregate counters only. There are no cookies, IP addresses, user agents or fingerprints. Visitors with Do Not Track or Global Privacy Control are not counted, and the admin area is never tracked.
- **Sessions:** a "session" is a random id per browser tab (`sessionStorage`), not a person.
- **Setup:** none. Numbers appear after the first deploy that includes the tracker.

### Contact Inbox

- **Delivery unchanged:** the contact form still sends through Formspree exactly as before, so email delivery is preserved.
- **Second write:** after Formspree answers, the form also posts the inquiry to `admin-api/inbox-capture.php`, which is public, write-only, same-origin and limited to 20 per hour. The post includes a per-submission id and whether the email delivery succeeded.
- **Retries:** a retry with the same id updates the same record and never creates a duplicate.
- **Failed email delivery:** the inquiry is still saved and is flagged "Email not delivered" in the Inbox and on the Overview. The visitor still sees the usual error message, which includes the email address.
- **If PHP is down:** the capture fails silently. The visitor's experience is unchanged and Formspree still delivers.

### Projects and proposals

- **Money:** stored as integer cents.
- **Totals:** proposal totals, discounts, tax and milestone amounts are recalculated in PHP on every save. Client-side numbers are only a preview.
- **Numbering:** proposal numbers (`NIV-YYYY-NNN`) are allocated under the store lock and are never reused, even after a draft is deleted.
- **Locked records:** accepted, rejected and expired proposals are kept as they were. Duplicate one to revise it. Only drafts can be deleted.
- **Accepting a proposal:** it can create a project in *Approved* or update the linked project, and it marks the linked lead as won.
- **PDFs:** generated in the browser with `jspdf` + `jspdf-autotable`, loaded only when you press "PDF". There is no external service or server component. "Print" prints the same document from the preview.
- **Project links:** URLs with embedded credentials are rejected. Never store passwords in notes.

### Site Health

- **Check now:** runs the check from PHP immediately. Each redirect hop is re-validated and pinned to its resolved IP.
- **Allowed targets:** only public `http(s)` URLs on ports 80 and 443. Loopback, private, link-local, CGNAT, multicast, cloud-metadata and IPv4-mapped IPv6 addresses are refused, both when a monitor is saved and at check time.
- **Scheduled checks:** `.github/workflows/nivello-site-health.yml` runs every 6 hours (and on manual dispatch) on a standard Ubuntu runner.
  - It asks `admin-api/health-callback.php` for the enabled monitors, checks them with the same public-only rules, and posts signed results back.
  - It uses the same HMAC discipline as discovery and the same `NIVELLO_ADMIN_CALLBACK_SECRET`.
  - Replayed runs are ignored.
- **Uptime:** the share of the checks actually collected over 30 days. It is not an SLA figure.

**One-time setup for scheduled checks (after owner approval):**

1. Push `.github/workflows/nivello-site-health.yml` and `scripts/site-health-runner.mjs` to `main`.
2. In GitHub, go to Settings → Secrets and variables → Actions → **Variables**, and add `NIVELLO_ADMIN_BASE_URL` = `https://www.nivello.it`. The secret `NIVELLO_ADMIN_CALLBACK_SECRET` already exists from the discovery setup.
3. Run the workflow once manually (Actions → "Nivello site health" → Run workflow). Then check that Site Health shows "Last scheduled run …".

Until the variable and the secret are set, the workflow finishes successfully without checking anything. "Check now" works regardless.

## Operations

- **Backups:** automatic snapshots every 6 hours of activity, keeping the newest 14, in `nivello-admin-data/backups/`. "Back up now" is in Settings.
- **Corrupted store:** the damaged file is copied to `nivello-admin-data/corrupt/` and the newest valid backup is restored automatically. With no valid backup, the admin shows an error and the damaged file is left untouched.
- **Workflow logs:** GitHub → Actions → "Nivello lead discovery" / "Nivello site health". The runners log pass numbers, monitor ids and counts only: no lead data, no URLs, no secrets.
- **Rotating secrets:**
  - GitHub token: update the Hetzner secret only.
  - Callback secret: update GitHub **and** Hetzner, while no discovery is running.

## Local development

```bash
npm run build
npm run serve:admin      # mock scraper + mock GitHub API + php -S on http://127.0.0.1:4174/admin/
npx playwright test --project=admin-api --project=admin-ui
```

The local stack never contacts GitHub:
- `scripts/mock-github-actions.mjs` implements the GitHub endpoints PHP uses and runs the real `scripts/lead-discovery-runner.mjs` against `scripts/mock-google-maps-scraper.mjs`, with synthetic data.
- The test-only environment switches (`NIVELLO_GITHUB_API_BASE`, `NIVELLO_ALLOW_HTTP_CALLBACK`, `NIVELLO_ENRICH_ALLOW_PRIVATE`, `NIVELLO_TEST_TIME_SCALE`) must never be set in production.

`npm run serve:php` serves `out/` with plain `php -S` (no mocks). The data then lands in `./nivello-admin-data`, which is git-ignored.
