# Arnold Product Spec — v2.4.1 Amendment
# Skill Builder Session — Slim MVP Implementation
# Patch file: apply to arnold-product-spec-v2_4.md

---

## CONTEXT

The full 6-slot Skill Builder template in §5.2 (v2.4) is the correct
long-term architecture. However, the full implementation requires new
skill-focus-specific exercise pools, a 7-drill wrist sequence protocol,
multi-skill session merging logic, and schema changes — totalling 8-12
prompts and 2-3 builder sessions.

This amendment sanctions a slim MVP implementation that ships the correct
structure with existing exercise pools from the Skill Builder Program Bible
v1.0. Full pool precision is deferred to v1.5.

---

## WHAT CHANGES

### §5.2 — Add "MVP Implementation Note" after the 6-slot template

INSERT after the Slot 6 description, before the "Full Session Examples":

---

**MVP Implementation Note (v2.4.1)**

For the MVP build, the 6-slot structure is mandatory but exercise pool
selection uses the existing Skill Builder Program Bible v1.0 pools rather
than the skill-focus-specific pools defined above. Specifically:

**What ships in MVP:**
- All 6 slots populated (non-negotiable — sessions must feel full)
- 7 cards total in the session screen (warm-up grouped into 1 card)
- Skill isometric uses `unit: "seconds"` and displays "Hold X seconds"
- Complementary lift slot populated from existing push/pull pool
- 2 accessory movements supersetted into 1 card
- Core finisher + skippable cooldown

**What is deferred to v1.5:**
- Skill-focus-specific exercise pools (planche vs. front lever vs.
  handstand specific selections)
- 7-drill canonical wrist sequence (warm-up uses existing wrist circles)
- Multi-skill session merging logic
- Skill-focus-aware warm-up pool selection

**Target session:** 45 minutes, 7 cards on screen.

---

## THE 7-CARD SESSION (Builder Reference)

This is the exact structure the generator must produce. 7 cards, no more,
no less for standard Skill Builder sessions.

| Card | Slot | Content | Target Duration |
|---|---|---|---|
| 1 | Warm-up (grouped) | Jumping jacks + high knees + wrist circles + scapular shrugs — one card, listed as sub-items | 4 min |
| 2 | Skill practice | Submaximal holds or low reps at current skill progression. Self-directed rest. Never autoregulated. | 6 min |
| 3 | Skill isometric | 5 × holds at current progression level. 3 min rest. `unit: "seconds"`. Displays "Hold X seconds." | 12 min |
| 4 | Complementary lift | 3 sets from existing push/pull pool matching the skill's movement pattern. 2–3 min rest. | 8 min |
| 5 | Accessories (grouped) | 2 movements supersetted — 1 skill-adjacent + 1 antagonist. 2–3 × 10–15. 60 s rest. | 7 min |
| 6 | Core finisher | 1 movement, 3 sets. 20–45 s holds or 8–15 reps. | 5 min |
| 7 | Cooldown | Static stretch. Skippable in one tap. | 4 min |

**Total: ~45 minutes.**

---

## BUILD FLAGS FOR MVP BUILDER

1. **Warm-up = 1 card**, not multiple. Generator outputs a grouped warm-up
   block. UI renders it as a single card with sub-items listed inside.
   Same pattern applies to accessories (card 5).

2. **`skill-isometric` role** — add to exercise schema. `unit: "seconds"`.
   Session screen renders "Hold X seconds" not "X reps" for this role.

3. **`skill-practice` role** — add to exercise schema. Never generates an
   AdaptationItem. Autoregulation skips this slot entirely.

4. **Complementary lift** — use existing exercise pools from Skill Builder
   Program Bible v1.0. Push-pattern skills (planche, handstand) → push
   pool. Pull-pattern skills (front lever, muscle-up) → pull pool.

5. **Accessories** — 2 movements from existing accessory pool, rendered as
   a single grouped card with "superset" label.

6. **Applies to both beginner and intermediate** Skill Builder generators.

---

## WHAT IS NOT CHANGING

- v2.4 §5.2 full spec remains the target architecture for v1.5
- Street Lifter and Hybrid generators unchanged
- All v2.3 / v2.3.1 decisions unchanged

---

## CHANGELOG ENTRY

**v2.4 → v2.4.1 | May 2026**

**Added:**
- §5.2 MVP Implementation Note — sanctions slim 6-slot Skill Builder
  session for MVP build. 7 cards, ~45 minutes, existing exercise pools.
  Full skill-focus-specific pools, 7-drill wrist protocol, and multi-skill
  merging deferred to v1.5.
- Warm-up grouped into 1 card. Accessories grouped into 1 card (supersetted).
- `skill-isometric` role (`unit: "seconds"`, "Hold X seconds" UI).
- `skill-practice` role (never autoregulated).

**Deferred to v1.5:**
- Skill-focus-specific exercise pools (§5.2)
- 7-drill canonical wrist sequence
- Multi-skill session merging
- Skill-focus-aware warm-up pool selection

---

*End of v2.4.1 amendment.*
*Forward to MVP Builder chat as the brief for Skill Builder generator work.*
*No pending items.*
