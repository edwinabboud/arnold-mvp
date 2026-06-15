# Arnold — Spec Amendment v2.4.5

**Status:** Active. Pending merge into master.
**Sequencing:** v2.4.1 + v2.4.2 + v2.4.3 + v2.4.4 + v2.4.5 → merge to `arnold-product-spec-v2_5.md` after MVP 1.14 ships.
**Source:** Real-device testing MVP 1.13.1 + coach plan data (push/pull/push+chin weekly cycle, strength → deload transition).

---

## Change 1 — §5.4 Warm-up Interaction Model (new section)

Warm-up exercises are first-class steps in the session loop, not static prep cards. Each warm-up exercise has the same interaction affordances as a working set.

**Per-exercise affordances:**

| Affordance | Behavior |
|---|---|
| Timer | Per-exercise countdown (e.g. "Scapular Pushups — 30s"). Field: `warmupDurationSeconds` on `PlannedExercise`. Do not reuse `holdSeconds` — that field belongs to `skill-isometric` autoregulated working sets. |
| Rest between sets | 10s, fires from the existing rest-timer infrastructure (not new code). Applies when same warmup exercise has 2+ sets. |
| Skip individual | Single tap, silent. No AI pushback. |
| Skip all warm-ups | Button at top of warm-up phase. Single tap, silent. Repeated skipping across sessions is surfaced by the Progress Analyst, not the Conversation Agent. |

**Field addition:**
```ts
PlannedExercise {
  ...
  warmupDurationSeconds?: number;  // new
}
```

---

## Change 2 — §10.3 Ramp-up Shape (new subsection)

Heavy working exercises are built from three stages, not one. The generator assembles the ramp from a fixed entry weight up to the day's top — never extrapolated downward from working weight.

**Stage structure:**

| Stage | Heavy day sets | Deload day sets | Load | Rep range |
|---|---|---|---|---|
| Loaded warm-up | 1–2 | 1 | Exercise floor (see below) | 8–12 |
| Ramp | 2–4 | 1–2 | 50% → 90% of top | 1–4 |
| Working | 1–N | 1–N | 100% of top | Per program |

**Exercise floor (new concept).** Set 1 has an absolute minimum that does not scale with the day's top weight. Joint warm-up requirements do not get lighter just because the working weight got lighter. On deload weeks, the ramp compresses but the floor stays.

**Floor table (MVP scope — loaded bodyweight movements):**

| Exercise | Beginner | Intermediate | Advanced |
|---|---|---|---|
| Weighted dips | Bodyweight | +5 kg | +10 kg |
| Weighted pull-ups | Bodyweight | +5 kg | +10 kg |
| Weighted chin-ups | Bodyweight | +5 kg | +10 kg |

**Field addition:**
```ts
ExerciseDefinition {
  ...
  rampFloor: { beginner: number; intermediate: number; advanced: number };  // kg added
}
```

**Generator rule:** Build ramp from `rampFloor[tier]` → `top`, stage-by-stage. Replaces any prior "start at ~90% of benchmark" logic.

---

## Change 3 — Override to v2.4.1: Vertical Warm-up Cards

Skill Builder warm-ups render as separate vertical cards, one per exercise, matching Street Lifter and Hybrid Athlete. Visual consistency wins over theoretical cohesion.

**`subExercises` schema retained** but scope narrows:

| Use case | Render |
|---|---|
| Warm-up sequence | Vertical cards (one per exercise) |
| Accessory superset / circuit (cycled A1/A2/A3) | Grouped card with `subExercises` |
| Sequential exercises of any kind | Vertical cards |

Rule: grouped cards are only for truly cycled supersets/circuits. Sequential = vertical.

---

## Deferred (not in this amendment)

- **Plate rounding (was v2.4.2 draft).** Not shipping yet. The first-set floor handles the "unloadable weights" pain on set 1, which was the most visible offender. Full 2.5kg rounding rule remains a known item for a future amendment once §10.3 is in production.
- **Heavy/light pattern frequency.** Coach data shows push twice per microcycle at different intensities. §4.5 pattern-conflict rule may need softening to "same pattern AND same intensity zone." Holding for 2–3 more cycles of coach data before speccing.
- **Second-exposure logic.** Same primary lift, lighter touch, later in the week. Same holding pattern.

Both deferred items logged to §17.

---

## Build flags (MVP 1.14)

Two prompts, separate surface areas:

| Prompt | Scope |
|---|---|
| 1.14a — Engine | §10.3 ramp shape + `rampFloor` field + tier-based floor lookup. Replaces existing first-set weight logic in `weightProgression` / generator. |
| 1.14b — UX | §5.4 warmup interaction model (`warmupDurationSeconds`, timer, rest, skip-individual, skip-all) + vertical warm-up cards for Skill Builder. |

Builder waits for spec sign-off before writing prompts.

---

## Changelog stub (for v2.5 merge)

**v2.4.4 → v2.4.5 | May 2026**

**Added:**
- §5.4 Warm-up Interaction Model — per-exercise timer, rest, skip controls
- §10.3 Ramp-up Shape — three-stage structure with tier-based exercise floors
- `warmupDurationSeconds` field on `PlannedExercise`
- `rampFloor` field on `ExerciseDefinition`

**Changed:**
- v2.4.1 override: Skill Builder warm-ups render as vertical cards (not grouped)
- `subExercises` scope narrowed to cycled supersets/circuits only

**Deferred to §17:**
- Plate rounding rule (was v2.4.2 draft)
- Heavy/light pattern frequency (§4.5)
- Second-exposure logic (generator)
