# INDEX — spec currency (which file is authoritative)

After any brain change, run arnold-system/PROTOCOL.md (Edwin says 'Run the protocol').

Single entry point. Read this before treating any spec file as live.

## Current / authoritative
- arnold-product-spec-v2_4.md — master
- arnold-ai-brain-strategy-v1_0.md — AI architecture
- arnold-mvp-builder-instructions-v2_2.md — builder role/conventions (LIVE)
- Amendments LIVE on main: v2.4.1, v2.4.3, v2.4.4, v2.4.5, v2.4.6, v2.4.8 (approved version), v2.4.9 Part 1, v2.4.12
- Bibles: street-lifter v1.1, hybrid-athlete v1.1, skill-builder v1.0, path-specific-goals
- Reference: saas-building-guide, app-store-metadata

## Partial / pending
- v2.4.9 — Part 1 live; Part 2 (per-path compression tables) NOT built (needs bible review)

## Superseded / historical (do NOT treat as live)
- arnold-mvp-builder-instructions-v2_1.md — SUPERSEDED by v2_2 (spec home + verification/DEV_PREFILL conventions). History only.
- v2.4.7 — superseded by v2.4.9; cut logic neutered. Keep as history only.
- v2.4.8 draft "(2)" — superseded by approved version. (Removed from this folder.)
- v2.2 / v2.3 files, cascade-and-forget memo — absorbed/rejected; not migrated.

## Drafted but not built (parked)
- v2.4.2 plate-rounding — never sent, never built. Decision open.

## Missing (should exist, don't)
- v2.4.10 — blocked on Overview decision text.
- v2.4.11 — pre-start session preview; write if/when scheduled.
- arnold-product-spec-v2_5.md — eventual merge of all amendments. Not yet created.

## Snapshot maintenance
Whenever any brain file changes (spec, amendment, bible, strategy, handoff, or INDEX), regenerate BRAIN-SNAPSHOT.md by running scripts/build-brain-snapshot.sh, commit it in the SAME commit as the change, and tell Edwin in the report: 'BRAIN-SNAPSHOT.md updated — re-download and update your Claude.ai project files.' This keeps the paste-able brain current so future chats always load the right context.
