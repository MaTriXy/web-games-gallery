# Autoresearch Build Promotion - 2026-W11-diverse

## Context

Promote 2 autoresearch winners into build/weeks/2026-W11-diverse.
Source run: 20260312090439. Mode: static.

## Constraints

- Keep the promoted release self-contained under build/weeks/<weekKey>/.
- Prune stale game folders so the release directory matches the promoted manifest.
- Do not regenerate promoted winners; copy the selected candidate artifacts as-is.

## Plan

1. Select top autoresearch candidates after scoring.
2. Copy winners into the weekly build folder.
3. Write manifest.json, plan.json, README.md, and execution-plan.md for the promoted release.

## Status

- `done`: 2 candidates promoted from autoresearch run 20260312090439
- `done`: build release folder refreshed for 2026-W11-diverse
- `done`: build artifacts written

## Verification

- inspect `/Users/matrixy/Dev/web_games_agent/build/weeks/2026-W11-diverse/manifest.json`
- inspect `/Users/matrixy/Dev/web_games_agent/build/weeks/2026-W11-diverse/plan.json`
- inspect `/Users/matrixy/Dev/web_games_agent/build/weeks/2026-W11-diverse/execution-plan.md`
