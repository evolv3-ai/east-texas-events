# Design — Cloudflare Pages deployment to events.shallowcreek.com

**Date:** 2026-06-08
**Author:** Claude (driven by user)
**Status:** Draft → Pending user review
**Closes:** Implicit "not deployed" gap (no entry in reality-check; surfaced when the user asked "is this live?"). Opportunistically closes gap #2 (hardcoded site URL in `jsonld.ts`) since the URL has to change anyway.

## Problem

The project builds correctly (`npm run build` → `dist/`) but no automation publishes the artifacts anywhere. `www.shallowcreek.com` exists (Cloudflare-fronted, returns 200) but serves a different site; `https://www.shallowcreek.com/events.json` returns 404. The README I just wrote calls the stack "hosted on shallowcreek.com" — aspirational, not factual.

Three secondary issues surfaced while probing:

1. No `src/pages/index.astro` — `events.shallowcreek.com/` would 404.
2. `src/lib/events/jsonld.ts` has two hardcoded `'https://www.shallowcreek.com'` defaults (gap #2 in the reality check). The URL has to change anyway, so refactor now.
3. No Node version pin in the repo. Cloudflare Pages defaults are reasonable but pinning prevents drift surprises later.

## Goals

- The 7 routes in CLAUDE.md serve from `https://events.shallowcreek.com` (custom domain on a Cloudflare Pages project) and a `*.pages.dev` URL automatically.
- `events.shallowcreek.com/` does not 404 — apex redirects to `/events/`.
- Every push to `main` produces a production deploy automatically. Every push to a non-main branch produces a Cloudflare-generated preview URL.
- Agent consumers can `fetch('https://events.shallowcreek.com/events.json')` from any origin without CORS gymnastics.
- JSON-LD URLs in generated HTML reflect the new origin (`events.shallowcreek.com`, not `www.shallowcreek.com`).

## Non-goals (YAGNI)

- No CSP headers (only inline `<script type="application/ld+json">`; defer until a real reason)
- No `robots.txt` or `sitemap.xml` (real follow-up — flagged in "Out of scope" below)
- No analytics, Web Vitals, or RUM beacon
- No Cloudflare Workers or Pages Functions (the site is 100% static)
- No HSTS preload list submission
- No CI test gate on PRs separate from the Cloudflare Pages build (the Pages build runs `npm run build`, which already runs `astro check && validate:data && test && astro build`)

## Decisions

| Decision | Choice | Why |
|---|---|---|
| Hosting target | `events.shallowcreek.com` (subdomain) | Approved by user. Clean separation from existing apex content. |
| `astro.config.mjs` `site` | `'https://events.shallowcreek.com'` | Drives `Astro.site`, used for canonical URLs and JSON-LD |
| `jsonld.ts` `site` param | Required (no default) | Removes duplication with `astro.config.mjs`. Caller passes `Astro.site!.toString()`. Closes reality-check gap #2. |
| Apex redirect | `public/_redirects` rule `/ /events/ 301` | Cloudflare Pages emits a real 301 at the edge (not a meta-refresh HTML page). Canonical for static Pages sites. |
| Cache TTL for machine-readable surfaces | `public, max-age=300, s-maxage=300` (5 min) | Static-built site rebuilds infrequently; 5 minutes balances freshness for agent consumers against cache effectiveness. Same value the existing inline `events.json.ts` already sets. |
| CORS policy for machine-readable surfaces | `Access-Control-Allow-Origin: *` | Agent-first product — JSON feed + llms.txt + openapi.json must be cross-origin readable from any agent runtime |
| Node version | `22` (current LTS) | Conservative pin; Cloudflare Pages supports it; local dev on 24 still works because `package.json` doesn't restrict |
| Preview deploys | Default-on (Cloudflare's default behavior) | Every PR/branch push gets a `*.pages.dev` preview URL automatically; no extra config |
| Where Cloudflare-side config lives | Cloudflare dashboard | User does it; not in repo. `_headers` and `.nvmrc` are the only in-repo Cloudflare-touched files. |

## Architecture

### Repo changes

| File | Action | Detail |
|---|---|---|
| `astro.config.mjs` | edit | `site: 'https://events.shallowcreek.com'` |
| `src/lib/events/jsonld.ts` | edit | Remove `= 'https://...'` default on both `eventToJsonLd` and `itemListJsonLd`. Make `site` required `string`. |
| `src/pages/events/index.astro` | edit | `itemListJsonLd(events, Astro.site!.toString())` |
| `src/pages/events/[slug].astro` | edit | `eventToJsonLd(event, Astro.site!.toString())` |
| `src/pages/events/near-shallow-creek-rv-park/index.astro` | edit | `itemListJsonLd(events, Astro.site!.toString())` |
| `src/lib/events/__tests__/jsonld.test.ts` | edit | Test calls become `eventToJsonLd(makeEvent({status}), 'https://test.example.com')` |
| `public/_redirects` | **new** | `/ /events/ 301` — Cloudflare Pages emits an edge-level 301 |
| `public/_headers` | **new** | CORS + Cache-Control for `/events.json`, `/openapi.json`, `/llms.txt` |
| `.nvmrc` | **new** | `22` |
| `README.md` | edit | "hosted on shallowcreek.com" → "deploys to events.shallowcreek.com via Cloudflare Pages on every push to main" |

### `public/_headers` content

Cloudflare Pages reads `_headers` from the deployment root and applies path-prefix rules. Format is documented at https://developers.cloudflare.com/pages/configuration/headers/.

```
/events.json
  Cache-Control: public, max-age=300, s-maxage=300
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS
  Access-Control-Allow-Headers: Content-Type

/openapi.json
  Cache-Control: public, max-age=300, s-maxage=300
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS

/llms.txt
  Cache-Control: public, max-age=300, s-maxage=300
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, OPTIONS
```

Pages also handles the `OPTIONS` preflight automatically when CORS headers are present on the resource.

### `public/_redirects` (new)

Single rule:

```
/ /events/ 301
```

Cloudflare Pages reads this file from the deploy root and applies real HTTP 301 redirects at the edge before any static asset is served. Documented at https://developers.cloudflare.com/pages/configuration/redirects/. No HTML file is generated for `/` in `dist/`; the redirect happens before a body is needed.

### Cloudflare dashboard work (out of repo — user does)

1. Cloudflare dashboard → Workers & Pages → Create application → Pages → Connect to Git
2. Select `evolv3-ai/east-texas-events`
3. Build configuration:
   - Framework preset: Astro (or None — both work; Astro preset sets sensible defaults)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Production branch: `main`
   - Environment variable: `NODE_VERSION=22` (alternatively, the `.nvmrc` in repo will be honored)
4. Save and Deploy → first build runs, ~1 min
5. Project becomes available at `<project-name>.pages.dev`
6. Custom domains tab → Add custom domain → `events.shallowcreek.com`
   - If shallowcreek.com is on Cloudflare DNS: wizard adds the CNAME automatically
   - If not: dashboard shows the CNAME target; add at the DNS provider
7. SSL provisions automatically via Cloudflare; usually 1-5 minutes

## Public-surface impact

| Surface | Before | After |
|---|---|---|
| `events.shallowcreek.com/` | Would 404 | 301 → `/events/` |
| `events.shallowcreek.com/events/` | (not deployed) | Renders 2 events |
| `events.shallowcreek.com/events.json` | (not deployed) | Returns 2-event feed with CORS `*` and `Cache-Control: max-age=300` |
| `events.shallowcreek.com/openapi.json` | (not deployed) | Returns OpenAPI 3.1 doc with CORS `*` |
| `events.shallowcreek.com/llms.txt` | (not deployed) | Returns agent guide with CORS `*` |
| JSON-LD `@id` and `url` on event detail pages | `https://www.shallowcreek.com/events/<slug>/` | `https://events.shallowcreek.com/events/<slug>/` |
| `www.shallowcreek.com` | Existing site (untouched) | Existing site (untouched) |
| `www.shallowcreek.com/events.json` | 404 (unchanged) | 404 (unchanged) |
| Every PR/branch | (no preview) | Gets a `*.pages.dev` preview URL |

## Risks + mitigations

| Risk | Mitigation |
|---|---|
| Cloudflare Pages build picks Node 24 (matching local) instead of 22 | Explicit `NODE_VERSION=22` env var + `.nvmrc` in repo |
| Astro `Astro.site` is `undefined` if someone removes `site:` from astro.config.mjs | TypeScript `!` non-null assertion at call sites surfaces the issue at build time, not runtime |
| `_headers` syntax error silently ignored by Cloudflare | Cloudflare dashboard shows headers status per deploy; first deploy will reveal errors. Spec defines exact known-working syntax. |
| Existing `www.shallowcreek.com` site has a 301 from `/events*` to somewhere | Not our problem; events.shallowcreek.com is a separate hostname. www.shallowcreek.com is unchanged. |
| Preview deploys leak un-published seed events to the public web | Preview URLs are publicly reachable but unindexed (Cloudflare default). For an MVP this is acceptable; revisit if seed contains anything sensitive. |
| JSON-LD URLs changing breaks existing search-engine snapshots | No existing snapshots — the site isn't yet indexed at the new origin. Old `www.shallowcreek.com/events/...` URLs were never live. No-op. |

## Out of scope (real follow-ups, logged here for future)

- **`robots.txt` + `sitemap.xml`** — proper SEO needs both. `@astrojs/sitemap` would generate one from Astro.site automatically. Separate gap.
- **CSP / security headers** — `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, etc. Standard hardening. Should go in `_headers`. Separate gap.
- **Analytics / RUM** — Cloudflare Web Analytics is free + privacy-respecting. Two lines in `BaseLayout.astro`. Separate gap.
- **PR preview URL in PR comments** — GitHub Action could comment with the preview URL. Nice ergonomics. Separate gap.
- **Branch protection** — enforce CI green before merge to main. Currently no CI; once Cloudflare Pages is the deploy mechanism, the build IS the CI. Configure on GitHub side. Separate gap.
- **Custom 404 page** — Astro 404 default is "Not Found" plain text. A small custom page would be friendlier. Separate gap.

## Acceptance

This change is done when:

1. `npm run build` exits 0 locally (full chain: astro check, validate:data, test, astro build)
2. `dist/_redirects` exists with the `/ /events/ 301` rule (no `dist/index.html` — the edge redirect handles `/`)
3. `dist/_headers` exists with the three rule blocks
4. `dist/events/great-texas-balloon-race-longview-2026/index.html` JSON-LD `url` and `@id` start with `https://events.shallowcreek.com/`
5. All 14 Vitest tests pass (one test file was modified to add the required `site` arg)
6. `gitnexus detect_changes compare base_ref=main` shows only the planned symbols touched
7. **(Out of repo, follows separately):** Cloudflare Pages project created, custom domain bound, first production deploy succeeds, `https://events.shallowcreek.com/events.json` returns 2 events with `access-control-allow-origin: *`
