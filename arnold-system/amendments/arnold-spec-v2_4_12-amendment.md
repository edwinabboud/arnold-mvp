# Arnold Spec Amendment v2.4.12 — Calibration Eradication

**Date:** June 10, 2026
**Status:** Draft — pending Edwin sign-off, then binding
**Amends:** arnold-product-spec-v2_4.md (§4 onboarding, §10 weight engine, tier assignment)
**Source:** Overview brief, June 10 2026 ("MVP 1.18: Calibration Eradication")
**Builds on:** v2.4.10 (coach-data calibration layer — companion amendment)

---

## Motivation

Every user — regardless of assessed strength — currently receives `createBeginnerProgressions()`: order-0 (easiest) exercise active in every movement pattern. Intermediate/advanced users get an intermediate *plan* built on beginner *progression state*. Separately, Skill Builder intermediate programming runs Prilepin math off `estimateMaxHold()` guesses instead of assessed holds, and tier assignment has drifted from the program-bible thresholds. The result: Arnold's starting prescriptions are not calibrated to the user in front of it. This amendment eradicates synthetic calibration: every number the engine starts from must trace to an assessed input or a bible table.

**Governing rule for all changes below: where code and program bible disagree, the bible wins.**

---

## Change 1 — Benchmark-driven progression initialization

`ConversationalOnboarding.tsx:handleComplete` no longer calls `createBeginnerProgressions()` unconditionally.

**New behavior:**
- **Tier = beginner** → `createBeginnerProgressions()` (unchanged — correct for this tier).
- **Tier = intermediate or advanced** → new `initializeProgressionsFromBenchmarks(path, benchmarks, tier)` in `src/engine/benchmarkProgressions.ts`:
  - For each movement pattern, the starting "active" progression = the highest progression whose entry criteria the user's benchmarks satisfy, per the path's program bible.
  - Mapping tables derive from the existing `levelMapper.ts` benchmark→progressionId mappings, cross-checked against bible tier-prerequisite tables. Reuse `levelMapper` machinery; do not duplicate it.
  - Patterns with no relevant benchmark (e.g., core for Street Lifter) → conservative default one level above order-0 for intermediate+, per bible guidance; if the bible is silent, order-0.
- `skipToHome` (dev-only) keeps `createBeginnerProgressions()` — out of scope.

**Logging:** `[ARNOLD CALIBRATION] pattern=<p> benchmark=<values> → start=<progressionId>` per pattern at initialization.

## Change 2 — Tier assignment audit (bible compliance)

Audit `assignTier()` for all 3 paths against the bible threshold tables. Known discrepancies to resolve (bible wins):

| # | Path | Code today | Bible v1.1 | Fix |
|---|---|---|---|---|
| A | Street Lifter | Intermediate if `pullReps >= 10 OR dipReps >= 12` | Intermediate requires `>= 10 pull-ups AND >= 12 dips` | OR → AND |
| B | Street Lifter | Advanced requires `+50% BW pull AND +80% BW dip` | "Added >= 50% BW pull-up OR >= 80% BW dip" → Advanced | AND → OR |
| C | Hybrid | No handstand-time gate for intermediate | Intermediate requires `>= 8 PU AND >= 12 dips AND >= 45s wall HS` | Add wall-HS gate; use bible's 8 PU (not Street Lifter's 10) |
| D | Hybrid | Beginner boundary inherited from Street Lifter logic | Beginner if `< 8 PU OR < 12 dips OR < 30s wall HS` | Implement bible boundary |

CC must do a full line-by-line pass, not just these four — any additional discrepancy found is fixed to bible values and listed in the implementation report. "Any added working weight → intermediate" (Street Lifter "I know my weights" row) is bible-sanctioned and stays.

**Logging:** `[ARNOLD TIER] path=<p> inputs={...} → tier=<verdict> rule=<which threshold fired>` on every assignment.

## Change 3 — Tier verdict confirmation step

New onboarding step between benchmark submission and plan generation:

- Arnold states the verdict in plain language: *"Based on your numbers: **Intermediate**. You'll train with weighted progressions and periodized intensity. Sound right?"* (copy adapts per tier/path; one sentence of what the tier means).
- Two options: **"Sounds right"** → proceeds to disclaimer + plan generation (existing flow). **"Let me redo my numbers"** → returns to the benchmark input step with previous values pre-filled; on resubmit, tier is recomputed and the confirmation step shows again.
- No free-text tier override. The user changes inputs, not the verdict (verdict integrity — prevents beginners self-assigning advanced).
- Advanced verdict copy must disclose the current reality: advanced users train the intermediate program ("You're advanced — Arnold's advanced program is in development, so you'll run the intermediate program at your weights."). This closes the silent-surprise gap until an advanced generator exists.

## Change 4 — Kill `estimateMaxHold()`

- Delete `estimateMaxHold()` from `skillBuilderIntermediate.ts`. All Prilepin hold programming (`getPrilepinHoldProgramming`) runs off **assessed** hold times from `UserBenchmarks`.
- Assessment must capture a max hold (seconds) for every skill the intermediate generator programs Prilepin work for. Gap analysis against `BenchmarkInput.tsx` (currently: handstand sec, L-sit sec, FL level, planche level) — CC adds missing hold-seconds questions to the Skill Builder (and Hybrid, where applicable) question sets, same `seconds` input type, "Can't do this yet" → 0.
- **Zero/missing hold fallback:** if a programmed skill's assessed hold is 0 or absent, use a 5s conservative baseline, log `[ARNOLD CALIBRATION] <skill> hold unassessed — 5s baseline`, and include the flag in the conversation context packet so Arnold can say so in chat. No silent guessing.

## Change 5 — Delete the old-generator fallback

Remove the unreachable `else { ... generateMesocycle(...) }` branch in `handleComplete` (all three paths have dedicated generators). Remove the `generateMesocycle` import if no other call site remains in the file. `planGenerator.ts` itself is untouched.

## Change 6 — Beginner session label cleanup (cosmetic)

Rename beginner session display labels to the focus-descriptive convention, e.g. "Full Body C" → "Full Body C — Legs Focus". Names only; zero engine/logic changes. CC inventories all beginner session labels across the three beginner generators and applies consistent naming.

---

## Acceptance criteria (device-verified before merge)

1. Fresh onboarding, Street Lifter, benchmarks +20kg pull-up × 3 → tier verdict screen shows Intermediate → confirm → progressions log shows pull/push starting above order-0.
2. Fresh onboarding, "I'm new" → Beginner, order-0 progressions (unchanged behavior).
3. "Let me redo my numbers" → returns to benchmarks pre-filled → changed inputs produce a recomputed verdict.
4. Hybrid with 9 PU / 13 dips / 30s wall HS → **Beginner** (bible rule C/D — would have been intermediate under old code).
5. Skill Builder intermediate session: every Prilepin prescription traces to an assessed hold or logs the 5s-baseline flag. `estimateMaxHold` no longer exists in the codebase (grep).
6. Old-generator fallback gone; all three paths still generate.
7. TS baseline ≤ 43 (no new real errors).

## Out of scope

- Advanced generator (disclosure only, per Change 3)
- Mesocycle regeneration on benchmark change (parked item — unchanged)
- v2.4.11 session preview (separate amendment, secondary)
- Coach-data-derived load calibration (v2.4.10 — companion)

## Changelog stub (for v2.5 merge)

**v2.4.10 → v2.4.12 | June 2026** — Eradicated synthetic calibration: benchmark-driven progression initialization, tier assignment realigned to bible thresholds (bible wins), tier verdict confirmation step with redo path and advanced-tier disclosure, `estimateMaxHold` removed in favor of assessed holds with explicit 5s-baseline fallback, dead generator fallback deleted, beginner session labels renamed.
