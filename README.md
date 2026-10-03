# Nivello website

Marketing site for [nivello.it](https://www.nivello.it): Next.js 16 (App Router) with React 19, Tailwind CSS 4 and Framer Motion, exported as static files (`output: "export"`) and served by Apache on Hetzner. English lives at `/`, Italian at `/it/`.

## Commands

```bash
npm ci                              # install
npm run dev                         # local dev server on http://localhost:3000
npm run lint                        # ESLint
npm run build                       # type-check + static export to ./out
npx playwright install chromium     # once, to get the test browser
npm run test:e2e                    # public smoke + admin suites against ./out (run `npm run build` first; admin suites need the PHP CLI)
npm run serve:admin                 # admin + PHP API with mock GitHub Actions and mock scraper on http://127.0.0.1:4174/admin/
```

The smoke suite (`tests/smoke.spec.ts`) serves `./out` with `scripts/serve-out.mjs` and covers both homepages, navigation, the theme toggle, the project launcher → contact prefill, a case study, and mobile overflow.

## Structure

- `app/(en)/` and `app/it/` are two root layouts so each locale renders its own `<html lang>`. Both use `components/SiteShell.tsx`. URLs are unaffected by the `(en)` group.
- `components/HomePage.tsx`, `ProcessPage.tsx`, etc. are shared across locales and take a `locale` prop; interactive sections are small client components.
- `lib/site.ts` holds routes and site config, `lib/seo.ts` page metadata, `lib/projects.ts` / `lib/services.ts` content. `app/sitemap.ts` generates `sitemap.xml` from those.
- `public/.htaccess` sets security and caching headers for Apache.

## Deployment

Pushing to `main` runs `.github/workflows/deploy.yml`: lint, build, and smoke tests, then an SFTP upload of the tested build.

The web root on the server is shared with other apps (`auto-usate/`, `casco-bene/`, `demo/`, …). Deploys therefore only manage entries a Nivello build shipped: each build writes `out/.nivello-manifest`, and `scripts/deploy-plan.sh` mirrors (with `--delete`) only inside those entries and removes only entries listed in the previous manifest that are gone. Anything not created by a Nivello deploy is never touched. To add a new protected sibling name, extend `PROTECTED_RE` in that script.

`public/sw.js` is a deliberate service-worker kill-switch for registrations left by an earlier site; see the comment in the file before removing it.

## Private admin (`/admin/`)

A lead-discovery and CRM workspace for the Nivello team: static Next.js UI (`app/admin/`, `components/admin/`, `lib/admin/`), PHP API in `public/admin-api/`, and a JSON store kept outside `public_html`. It is unlisted: not in navigation or the sitemap, and marked noindex.

Lead discovery runs on demand in GitHub Actions (`.github/workflows/nivello-lead-discovery.yml` + `scripts/lead-discovery-runner.mjs`) and reports back through signed callbacks to `admin-api/github-callback.php`. Nothing scraper-related runs on Hetzner.

The operations suite adds:

- **Analytics:** first-party and aggregate-only.
- **Contact Inbox:** the contact form still delivers through Formspree and is also captured privately.
- **Project Pipeline**
- **Proposals:** server-side totals and in-browser PDFs.
- **Site Health:** "Check now" from PHP, plus a scheduled GitHub Actions check every 6 hours in `.github/workflows/nivello-site-health.yml`.

One-time GitHub and Hetzner setup, secrets and live test steps: [docs/NIVELLO-ADMIN-DEPLOYMENT.md](docs/NIVELLO-ADMIN-DEPLOYMENT.md).
