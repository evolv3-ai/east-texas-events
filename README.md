# East Texas Events

Static Astro site publishing a curated, RV-park-centered events feed. Serves both human (HTML) and agent (JSON / OpenAPI / `llms.txt`) surfaces from a single seed file.

**Status:** MVP. Seed events carry a `seed-fixture-verify-before-public-launch` risk flag — verify each against its `source_url` before public launch.

## Stack

Astro · TypeScript · Zod · static build · hosted on shallowcreek.com

## Quickstart

```bash
git clone <repo>
cd east-texas-events
npm install
npm run dev               # http://localhost:4321/events/
npm run validate:data     # Zod-validate src/data/events.seed.json
npm run build             # astro check + validate:data + astro build
npm run preview           # preview production build
```

## Architecture

Everything flows through one seed file:

```
src/data/events.seed.json
  → src/lib/events/schema.ts   (Zod parsing — never bypassed)
  → src/lib/events/data.ts     (getApprovedEvents → getEventsFeed / getEventBySlug)
  → src/pages/*                (HTML + .json + llms.txt endpoints)
```

Public feed only includes events with `moderation.status === 'approved'`. Currency is hardcoded USD; timezone defaults to America/Chicago.

## Public surfaces

| Route | Purpose |
|---|---|
| `/events/` | Human index of all approved events |
| `/events/[slug]/` | Per-event detail page with JSON-LD |
| `/events/near-shallow-creek-rv-park/` | Events within ~15 miles of the park |
| `/events.json` | Agent-friendly JSON feed (schema `events-feed.v0.1`) |
| `/openapi.json` | OpenAPI 3.1 description of the JSON surfaces |
| `/llms.txt` | Plain-text usage guide for AI agents |

## Where to look

- `CLAUDE.md` — canonical project rules and architectural invariants (agent-facing, but readable by humans)
- `.claude/rules/workflow.md` — contribution workflow (superpowers + GitNexus)
- `docs/planning/IMPLEMENTATION_PLAN.md` — original Hermes build plan
- `docs/planning/agent-first-events-api-product-spec.md` — product spec
- `docs/planning/` — supporting research dossiers, source lists, schema drafts
