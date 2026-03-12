# Weekly Build - 2026-W11

## Context

Build a weekly release for 2026-W11.
Selected plan mode: trending.
Generate 1 self-contained games under the build output root.

## Constraints

- Keep the weekly release self-contained under build/weeks/<weekKey>/.
- Do not rely on external templates or remote runtime dependencies.
- Write manifest and human-readable release summary artifacts for downstream integration.

## Plan

1. Resolve the requested weekly plan.
2. If mode is trending or topic, fetch and map live signals before generation.
3. Generate each selected game into its weekly build folder.
4. Write manifest.json, plan.json, README.md, and execution-plan.md for the release.

## Status

- `done`: trending plan resolved for 2026-W11
- `done`: 1 games generated
- `done`: release metadata written

## Verification

- inspect `/Users/matrixy/Dev/web_games_agent/build/weeks/2026-W11/manifest.json`
- inspect `/Users/matrixy/Dev/web_games_agent/build/weeks/2026-W11/plan.json`
- inspect `/Users/matrixy/Dev/web_games_agent/build/weeks/2026-W11/README.md`
