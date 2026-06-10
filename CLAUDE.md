# East Texas Events

Static Astro site publishing a curated, RV-park-centered events feed. Serves both human (HTML) and agent (JSON / OpenAPI / `llms.txt`) surfaces from a single seed file.

**Stack:** Astro · TypeScript · Zod · static build

## Commands

```bash
npm run dev               # local dev server
npm run validate:data     # Zod-validate src/data/events.seed.json
npm run build             # astro check + validate (release mode) + tests + build
npm run preview           # preview production build
```

## Architecture — single data flow

```
src/data/events.seed.json
  → src/lib/events/schema.ts   (Zod validation)
  → src/lib/events/data.ts     (getApprovedEvents → getEventsFeed / getEventBySlug)
  → src/pages/*                (HTML + .json + llms.txt endpoints)
```

**Routes:** `/events`, `/events/[slug]`, `/events/near-shallow-creek-rv-park`, `/events.json`, `/events.rss.xml`, `/events.ics`, `/openapi.json`, `/llms.txt`

## Project rules

- All events flow through `eventSchema` in `src/lib/events/schema.ts` — never bypass Zod parsing.
- Currency is hardcoded USD; timezone defaults to America/Chicago.
- Public feed only includes events with `moderation.status === 'approved'`.
- The `docs/planning/` directory holds the Hermes planning trail (IMPLEMENTATION_PLAN, source dossiers, schema drafts, etc.) — do not load by default; consult only when explicitly relevant.

## Project status

- **Phase:** MVP. Seed events carry a `seed-fixture-verify-before-public-launch` risk flag — verify each against its `source_url` before public launch.
- **Last reality check:** 2026-06-08 — 11/11 vision goals working; 5 minor gaps tracked in `docs/status/reality-check-2026-06-08.md`.

## Workflow

See `.claude/rules/workflow.md` for the superpowers + GitNexus integration (brainstorm → plan → impact → TDD → verify → detect_changes).

---

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **east-texas-events** (388 symbols, 398 relationships, 3 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "main"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/east-texas-events/context` | Codebase overview, check index freshness |
| `gitnexus://repo/east-texas-events/clusters` | All functional areas |
| `gitnexus://repo/east-texas-events/processes` | All execution flows |
| `gitnexus://repo/east-texas-events/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->