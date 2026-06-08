# Workflow — superpowers + GitNexus integration

This project uses two layered systems. **Superpowers** governs *how* to approach work (think, plan, verify). **GitNexus** governs *what is safe to touch* (impact, scope, blast radius). Run them in series at each decision point.

## Before any code change

1. **Brainstorm** — `superpowers:brainstorming` skill. Required for any creative work, new feature, or behavior change.
2. **Plan** — `superpowers:writing-plans` skill. Required for any multi-step change.
3. **Impact** — `gitnexus impact({target: "symbolName", direction: "upstream"})` for each function/class you intend to modify. Report HIGH or CRITICAL warnings to the user before proceeding.
4. **TDD** — `superpowers:test-driven-development` skill. Write the failing test against current behavior first.

## During the change

- **Exploring unfamiliar code** — use `gitnexus query({query: "concept"})` or `gitnexus context({name: "symbol"})` instead of grep.
- **Renaming a symbol** — use `gitnexus rename`. Never find-and-replace.
- **Adding a new file or module** — re-run `node .gitnexus/run.cjs analyze` so the index sees it.

## Before commit

1. **`gitnexus detect_changes({scope: "compare", base_ref: "main"})`** — confirm the diff only touches expected symbols and execution flows.
2. **`superpowers:verification-before-completion`** — exercise the real surface (build, `npm run validate:data`, hit the endpoint), not just unit tests.
3. **`superpowers:requesting-code-review`** — optional adversarial review before merge.

## Parallel work

- **`superpowers:using-git-worktrees`** for isolated branches.
- **`superpowers:subagent-driven-development`** when a plan has independent tasks.

## Handoff

- **`dev-session`** skill for multi-session work (creates SESSION.md).
- **`/handoff`** command compacts the session for another agent.

## Project-specific gates

- Any change to `src/lib/events/schema.ts` is HIGH-impact by definition — it touches every endpoint and page via `data.ts`. Always run `gitnexus impact` and re-run `npm run validate:data` after.
- Adding a new public surface (new `src/pages/*` file) — read `CLAUDE.md` § Architecture first to confirm it should also flow through `getApprovedEvents()`.
