# Autoresearch Build Promotion - 2026-W11-arpromote

## Context

Promote 1 autoresearch winners into build/weeks/2026-W11-arpromote.
Source run: 20260312060334. Mode: static.

## Constraints

- Keep the promoted release self-contained under build/weeks/<weekKey>/.
- Prune stale game folders so the release directory matches the promoted manifest.
- Do not regenerate promoted winners; copy the selected candidate artifacts as-is.

## Plan

1. Select top autoresearch candidates after scoring.
2. Copy winners into the weekly build folder.
3. Write manifest.json, plan.json, README.md, and execution-plan.md for the promoted release.

## Status

- `done`: 1 candidates promoted from autoresearch run 20260312060334
- `done`: build release folder refreshed for 2026-W11-arpromote
- `done`: build artifacts written

## Verification

- inspect `/Users/matrixy/Dev/web_games_agent/build/weeks/2026-W11-arpromote/manifest.json`
- inspect `/Users/matrixy/Dev/web_games_agent/build/weeks/2026-W11-arpromote/plan.json`
- inspect `/Users/matrixy/Dev/web_games_agent/build/weeks/2026-W11-arpromote/execution-plan.md`
