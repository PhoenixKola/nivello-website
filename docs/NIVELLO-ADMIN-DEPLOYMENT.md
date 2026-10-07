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
| Admin access code (`access_code_hash`, or `access_code`) | Hetzner only | Sign-in code for the original admin account (`francesko`) until it sets a personal code |
| `NIVELLO_CREDENTIALS_KEY` (`credentials_key`) | Hetzner only | 32-byte master key that encrypts project credentials (Projects → Access) |

The repository is public, so the access code is **not** in the code. PHP reads it from the secrets file or environment on the server, checks it there, and never sends it to the browser. Until it is set, the sign-in screen reports that access is not configured.

To store a hash rather than the plain code (recommended), generate it once and paste the output into the secrets file as `access_code_hash`:

```bash
php -r "echo password_hash('your-access-code', PASSWORD_DEFAULT), PHP_EOL;"
```

## Admin accounts

Every admin has their own account: a login identifier (username, or email if set), a personal access code (stored as a password hash), their own authenticator (TOTP) and their own failed-attempt counter. Accounts live in `<parent of public_html>/nivello-admin-data/auth/users.json` (permissions `600`). Nothing about an account is in the repository.

- **Existing admin.** On first use after this update, the single existing admin becomes **Francesko CTO** with the username `francesko`. It keeps signing in with the server access code above and keeps its authenticator (copied from `auth/mfa.json`). Setting a personal code in **Settings → Account & security** replaces the server code for this account.
- **Adding Amelio CEO (or anyone else).** Open **Settings → Team → Add admin**, enter the display name, title and username (email optional). Nivello shows a one-time setup link valid for 72 hours; send it privately. Opening the link lets the new admin choose their own access code (12+ characters) and enrol their own authenticator; the account becomes active only after that. The link is stored only as a hash and works once. **Reset sign-in** creates a new link and clears that account's code and authenticator.
- **Disable / enable.** Disabling signs the account out immediately. The last active admin cannot be disabled or reset.

Activity created after this update records which admin did it (for example *Payment recorded … by Amelio CEO*). Older activity stays unattributed.

## Authenticator two-factor authentication

Each admin has their own TOTP authenticator. It is required for accounts created from a setup link and optional for the original account until it is enrolled. It does not need SMTP, SMS, a database or an external API.

1. Sign in and open **Settings → Account & security → Two-factor authentication → Set up**.
2. Confirm the current access code.
3. Scan the locally generated QR code with any standards-based authenticator app and enter its six-digit code.
4. Download or copy the ten one-time recovery codes. They are never shown again.

Each admin's TOTP seed is written to `<parent of public_html>/nivello-admin-data/auth/users.json`, outside the served site, and the application attempts to set file permissions to `600`. Recovery codes are stored only as password hashes. Enabling MFA invalidates other admin sessions that have not verified the current MFA generation.

The phone and server calculate the same code from the shared seed and current time, so the phone works offline. The server clock must remain accurate. The QR code is rendered in the browser and is not sent to a QR service.

If the authenticator is unavailable, enter one saved recovery code at the MFA login step. Each recovery code works once. Losing both the authenticator and every recovery code requires another admin to use **Settings → Team → Reset sign-in** (or a server-side edit of `auth/users.json` for the last admin); allowing the access code alone to reset MFA would defeat the second factor.

## Credentials master key

Project credentials (Projects → Access) are encrypted with libsodium `secretbox`, or AES-256-GCM when sodium is unavailable. The 32-byte master key is read from `credentials_key` in the secrets file (or `NIVELLO_CREDENTIALS_KEY`). It is never derived from an access code, returned to the browser or logged. Generate it **once**:

```bash
php -r "echo 'base64:', base64_encode(random_bytes(32)), PHP_EOL;"
```

Paste the output as `credentials_key` in `nivello-admin-secrets.php` and keep an offline copy in your password manager. Without the key the Access tab shows a locked notice and stores nothing. With a different key, existing credentials cannot be read (Nivello reports a key mismatch); restore the original key to read them. Encrypted credentials are kept in `nivello-admin-data/vault/credentials.json`, separate from the CRM data and its CSV exports.

## Fatture (invoices) and SdI

The fiscal Italian invoice is the FatturaPA XML delivered through the Sistema di Interscambio (SdI); a PDF is only a courtesy copy. Nivello does not transmit to SdI. The workflow is:

1. Create the Fattura (from scratch, a project, or an accepted Preventivo) and finalize it. Finalizing assigns the annual number (`1/2026`, `2/2026`, …) and freezes the supplier and client details.
2. Download **XML for SdI** (format FPR12, schema `Schema_VFPR12_v1.2.3`, FatturaPA format specification 1.4, valid from 1 April 2025) and send it through the Agenzia delle Entrate portal (*Fatture e Corrispettivi*), PEC, or your accountant's channel.
3. Record the SdI outcome in Nivello: sent, delivered (ricevuta di consegna), rejected (notifica di scarto) or impossible delivery (mancata consegna).

Supported XML scenario: ordinary domestic invoice (TD01) in EUR between Italian parties, with standard VAT rates or zero-rate lines that state a Natura code and a legal reference, and optional virtual stamp duty. Other cases (foreign clients, credit notes, split payment, withholding taxes, non-EUR) block the XML export with an explanation. The bundled schema in `tests/admin/fixtures/fatturapa/` is used by the automated tests; refresh it from fatturapa.gov.it when the Agenzia publishes a new version.

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

1. **PHP requirements:** PHP **8.1+** with `curl`, `json`, `mbstring`, `session`, `dom` (Fatture XML), and `sodium` or `openssl` with AES-256-GCM (credential encryption); `iconv` recommended. Without sodium/OpenSSL the credentials vault stays locked; it never stores plaintext.
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
       'credentials_key' => 'base64:…',  // see "Credentials master key" below
   ];
   ```

   The file location can be overridden with `NIVELLO_ADMIN_SECRETS_FILE`.
4. **Callback URL:** by default it is built from the admin request host (`https://www.nivello.it/admin-api/github-callback.php`). If the site is reached through several hostnames, set `NIVELLO_ADMIN_PUBLIC_BASE_URL=https://www.nivello.it`. The callback must be HTTPS.
5. **Deploy:** only after owner approval. The normal deploy uploads `out/`, which contains `admin/` and `admin-api/`. The data directory and the secrets file sit outside `public_html` and are never touched by deploys.
6. **Check the workspace:** open `https://www.nivello.it/admin/` and sign in with the access code.
7. **Enable MFA:** sign in as `francesko`, use **Settings → Account & security → Two-factor authentication**, scan the QR code, and save the recovery codes in a password manager.
   Then add the other admins from **Settings → Team** (see *Admin accounts*), and complete **Settings → Billing** before finalizing the first Fattura.
8. **Check Settings:** "Lead discovery (GitHub Actions)" must show token and callback secret *Configured*, GitHub API *Reachable*, and the workflow found.
9. **Survive a redeploy:** create a test tag, redeploy, and confirm the tag and MFA login still work.

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
- **What is stored:** daily aggregate counters only. There are no cookies, stored IP addresses, user agents or fingerprints. Visitors with Do Not Track or Global Privacy Control are not counted, and the admin area is never tracked.
- **Sessions:** a "session" is a random id per browser tab (`sessionStorage`), not a person.
- **Countries:** the visitor's IP is looked up in memory against a local country table (`public/admin-api/_geo-ipv4.bin` / `_geo-ipv6.bin`) and only the 2-letter country code is counted; the IP is never stored or logged. When the IP gives no answer (private networks, local testing), the browser time zone is used as a rough fallback.
  - Country data: [sapics/ip-location-db](https://github.com/sapics/ip-location-db) "geo-whois-asn-country", © [NRO](https://www.nro.net), CC BY 4.0.
  - To refresh it (a few times a year is plenty), download `geo-whois-asn-country-ipv4-num.csv` and `geo-whois-asn-country-ipv6-num.csv` from that repository and run `node scripts/build-geoip.mjs <ipv4-num.csv> <ipv6-num.csv>`.
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
