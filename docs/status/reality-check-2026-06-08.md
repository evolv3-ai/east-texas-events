# Reality Check — 2026-06-08

**Verdict:** Hermes built this well. All 11 vision goals working end-to-end. Zero `TODO/FIXME/stub/mock/placeholder` markers in `src/` or `scripts/`. Build artifacts (`dist/events.json`, `dist/llms.txt`, `dist/openapi.json`) are real content, not skeletons. 5 minor gaps tracked below — none block real work.

Methodology: `reality-check-for-project` skill applied at the end of brownfield onboarding (Steps 1-4: arch map, context audit, repo cleanup, reality check). Source files read: all 13 in `src/` + `scripts/validate-data.ts` (671 lines total). Build run and artifacts inspected. CLAUDE.md serves as the vision document (no README.md existed at the time of the check).

## Vision checklist

| # | Goal | Source | Status | Evidence |
|---|---|---|---|---|
| 1 | Static Astro site, both human (HTML) + agent (JSON/OpenAPI/llms.txt) surfaces | CLAUDE.md L3 | WORKING | `dist/` contains `events.json`, `openapi.json`, `llms.txt`, + 5 HTML pages |
| 2 | Single data flow: seed → schema → data → pages | CLAUDE.md L20-26 | WORKING | Every page/endpoint imports from `@/lib/events/data` which itself parses through `eventSchema` |
| 3 | Public feed only includes `moderation.status === 'approved'` | CLAUDE.md L32 | WORKING | `data.ts:7` — explicit filter; schema admits 4 moderation statuses |
| 4 | All events flow through `eventSchema` (Zod) — never bypass | CLAUDE.md L30 | WORKING | `getApprovedEvents` parses each seed entry; `getEventsFeed` re-parses assembled feed |
| 5 | Currency hardcoded USD | CLAUDE.md L31 | WORKING | `schema.ts:45` — `z.literal('USD').default('USD')` |
| 6 | Timezone defaults to America/Chicago | CLAUDE.md L31 | WORKING | `schema.ts:16` default + `data.ts:25` feed-level field |
| 7 | Routes: `/events`, `/events/[slug]`, `/events/near-shallow-creek-rv-park`, `/events.json`, `/openapi.json`, `/llms.txt` | CLAUDE.md L17 | WORKING | Build log confirms all 5 generated; routes return real content |
| 8 | Build runs `astro check` + `validate:data` + `astro build` | CLAUDE.md L11 | WORKING | `package.json` build script; gate runs 0 errors |
| 9 | `npm run validate:data` does real validation | handoff | WORKING | Checks duplicate ids/slugs, missing `source_url`/`agent_summary`, low-confidence-but-approved |
| 10 | Location-specific landing page is real | handoff | WORKING | `near-shallow-creek-rv-park/index.astro` filters by `radius_tier === 15`, has hero + JSON-LD + EventCard grid |
| 11 | Seed JSON is real, not skeleton | handoff | WORKING | 3 events, two real Longview/Kilgore venues, all schema fields populated, self-flagged `seed-fixture-verify-before-public-launch` |

## Suspect-area resolutions

The brownfield handoff flagged 4 areas as potential stubs. All 4 turned out to be real:

1. **`getApprovedEvents()` moderation filter** — Not cosmetic. Schema admits 4 statuses; filter is the architectural gate preventing a future `pending` row from leaking into the public feed.
2. **`events.seed.json`** — Real. 3 fully-fleshed events; two reference actual Longview/Kilgore venues; the third self-describes as a pipeline-validation seed.
3. **`near-shallow-creek-rv-park/index.astro`** — Real working page, not a stub.
4. **`validate-data.ts`** — Real validation: duplicate detection, missing-field checks, low-confidence-but-approved flag, proper exit codes, `--json` mode.

## Minor gaps

| Gap | Where | Severity | Suggested action |
|---|---|---|---|
| JSON-LD `eventStatus` maps only `cancelled` and `scheduled`; schema admits 5 statuses (`postponed`, `tentative`, `past` fall through to `EventScheduled`) | `src/lib/events/jsonld.ts:13` | Low | Map all 5 (`EventPostponed`, `EventScheduled` default, `EventCancelled`) — small fix, real SEO accuracy improvement |
| Hardcoded `site = 'https://www.shallowcreek.com'` in two places (`jsonld.ts:3`, `astro.config.mjs:5`) | jsonld.ts + astro.config.mjs | Low | `jsonld.ts` could read `Astro.site` instead of taking a default — only matters if site ever publishes elsewhere |
| `seed-fixture-verify-before-public-launch` risk flag is set on all 3 events but `validate-data.ts` never inspects `moderation.risk_flags` | `scripts/validate-data.ts` | Low | Add opt-in `--release` flag that fails if any approved event still carries the seed-fixture flag — turns the flag from a comment into a gate |
| No unit tests; `validate-data.ts` is the only "test" (integration check at build time) | (project-wide) | Low for now | Defensible at MVP scale. If pure functions in `data.ts`/`jsonld.ts` grow, add Vitest cases |
| No `README.md` for humans — `CLAUDE.md` is excellent for agents but human contributors land empty | (repo root) | Closed | Resolved by this commit — `README.md` added pointing at `CLAUDE.md` + `docs/planning/` |
