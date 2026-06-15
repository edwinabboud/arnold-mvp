# Arnold — Spec Amendment v2.4.9 (Part 1 — Framework)

**Status:** Active. Pending merge into master. Supersedes v2.4.7.
**Sequencing:** Merges into `arnold-product-spec-v2_5.md` after MVP ships, alongside v2.4.1, v2.4.3, v2.4.4, v2.4.5, v2.4.6, v2.4.8. **v2.4.7 is excluded from the merge.**
**Trigger:** v2.4.7 device-tested as MVP 1.18. Cut logic protected the wrong things (trimmed warm-up; crudely dropped accessory 2 / finisher). Whole mechanism needs redesigning.

**Scope:** This is Part 1 — framework, principle, levers, onboarding. Part 2 (per-path × session-type compression tables) deferred for program-bible review before drafting.

---

## 0. v2.4.7 Superseded

v2.4.7 stays in the amendments folder for history but is **superseded by this amendment**. When merged to v2.5, v2.4.7 is excluded.

**What was wrong:** Warm-up used as a time-budget lever. Crude "drop accessory 2, drop finisher" rules with no programming logic. Default-Recommended with Settings-only switching when it should be onboarding.

**What stays from v2.4.7:** The three-tier shape (Compact / Standard / Recommended), the time targets (~40 / ~60 / ~90 min), the `sessionTier` field on `profile.schedule`, the mid-mesocycle Plan Realignment hook.

**What's replaced:** The cut tables (§v2.4.7 "Per-Path Cut Rules"). Replaced by §3 of this amendment, with concrete tables landing in Part 2.

---

## 1. Governing Principle

> **Warm-up is fixed and user-skippable. Training is the time lever. Compression preserves training result by changing how the work is distributed, not by deleting it.**

| Rule | Why |
|---|---|
| Warm-up is always full (per v2.4.5) | Joint prep does not scale with available time. A real coach never cuts warm-up. |
| User can skip warm-up exercises individually or all (per v2.4.5 §5.4) | Their call, their risk. Logged. Tier mechanism does not touch warm-up. |
| Training compression is a programming decision, not a runtime trim | Different paths and session types compress differently. No universal cut rule exists. |
| Compression preserves the session's *primary adaptation* | Heavy-day strength stimulus is preserved; volume-day hypertrophy stimulus is preserved. The lever choice changes per session type. |

---

## 2. Compression Levers (Taxonomy)

The four levers a real coach uses to fit training into less time. Compression is always a *combination* of levers, never a single-lever drop.

| Lever | What it does | Preserves | Costs |
|---|---|---|---|
| **Density** | Reduce rest between sets at same volume + intensity | Total work, neural quality | Recovery quality, RPE accuracy |
| **Volume cut** | Fewer sets at same intensity | Intensity, neural quality | Hypertrophy stimulus |
| **Mesocycle stretch** | Same total work distributed over more weeks | Everything | Calendar time, motivation |
| **Secondary drop** | Cut work with lower marginal return for the session's primary adaptation | Primary adaptation | Secondary adaptations |

**Lever-selection rule (drives Part 2 tables):** Choose the lever combination that preserves the session's primary purpose movement (per v2.4.8 §1.3). On a heavy day, preserve the top set: volume cut + secondary drop. On a volume day, preserve aggregate volume: density compression. On a skill day, preserve the skill isometric/practice: secondary drop + density on the complementary lift.

---

## 3. New Compression Model (Replaces v2.4.7 Cut Tables)

Sessions are generated *for* the user's tier, not generated at Recommended and trimmed down. The generator consults a compression table per path × session type at generation time.

### 3.1 Generation Flow

```
1. Generator receives: { path, sessionType, sessionTier, week, phase }
2. Generator pulls the compression profile for { path, sessionType, sessionTier }
3. Compression profile specifies:
     - which exercises survive (with role-aware selection)
     - per-exercise set/rep modifications
     - rest period modifications (density lever)
     - whether this session uses mesocycle stretch (see §3.3)
4. Generator emits the session with full warm-up + compressed training block
```

### 3.2 What Compression Profiles Look Like (Schema)

Concrete tables land in Part 2. Schema for each profile:

```ts
interface CompressionProfile {
  path: "street-lifter" | "skill-builder" | "hybrid-athlete";
  sessionType: string;              // e.g. "heavy-push", "skill-isometric-day"
  tier: "compact" | "standard" | "recommended";
  primaryPurposeMovement: string;   // never compressed away
  levers: {
    density: number | null;         // rest reduction in seconds, null = no change
    volumeCut: Array<{ role: string; setReduction: number }>;
    secondaryDrop: string[];        // exercise roles dropped entirely
    mesocycleStretch: boolean;      // see §3.3
  };
}
```

### 3.3 Mesocycle Stretch (New Concept)

For Compact-tier users on hypertrophy- or volume-driven session types, the compression profile may invoke **mesocycle stretch**: same total volume distributed over a longer phase (e.g. 4-week phase → 6-week phase).

| Implication | Detail |
|---|---|
| Phase length is tier-dependent | Current 12-week mesocycle assumption needs revisiting for Compact users |
| Progression engine reads phase length from the compression profile | Not from a hard-coded constant |
| Mid-tier switching mid-phase | Triggers Plan Realignment (existing v2.4.7 hook, unchanged) |
| When to use stretch | Part 2 tables decide per path × session type. Default: stretch on hypertrophy phases, not on peaking or test weeks. |

**This is the ripple flag.** Mesocycle stretch is not optional cosmetic; it requires the progression engine to read phase length dynamically. Builder needs to know.

---

## 4. Onboarding (Reversed from v2.4.7)

Session length is asked during onboarding alongside path, schedule, and experience level. Not Settings-default-only.

**New onboarding step (slot between schedule and experience):**

> "How much time do you have for a typical session?"
>
> [ ~40 minutes ] [ ~60 minutes ] [ ~90 minutes ] [ Skip ]

| Option | Tier set |
|---|---|
| ~40 min | `compact` |
| ~60 min | `standard` |
| ~90 min | `recommended` |
| Skip | `standard` (changed from v2.4.7's default-Recommended) |

**Skip default changed to Standard.** Recommended is honest about being the full program — most users skipping aren't choosing the longest option, they're deferring the decision. Defaulting them to Standard is the safer assumption.

Settings still allows changing the tier later. Mid-mesocycle changes route through Plan Realignment, unchanged.

---

## 5. AI Brain Layer — Compression Rationale (Hooks for v2.4.8)

The Conversation Agent (per v2.4.8 §2 context packet) receives the user's `sessionTier` and the active `compressionProfile` for the current session. When asked about session structure ("why is this short?"), Arnold explains the lever choice in coaching language.

**Hook:** `compressionProfile` added to the context packet's `user` block (extends v2.4.8 §2.3).

```ts
user: {
  ...
  sessionTier: "compact" | "standard" | "recommended";
  compressionProfile: {
    leversApplied: string[];   // ["volumeCut", "secondaryDrop"]
    rationale: string;          // "preserving the heavy top set, cutting back-off volume"
  } | null;  // null for Recommended (no compression)
}
```

**Persona rule (extends v2.4.8 §3):** When explaining a compressed session, Arnold names the lever and the preserved adaptation. Never "I shortened your workout." Always "we're holding the heavy work and trimming the volume work today — same strength stimulus, less time."

---

## 6. Migration from v2.4.7

Users already on v2.4.7 tiers have `sessionTier` set. No data migration needed — the field stays.

**Behavioral migration:**
- v2.4.7 cut tables stop being consulted at next app open
- Until Part 2 ships, all tiers temporarily resolve to Recommended (full sessions). Compact and Standard users get a one-time chat message from Arnold: *"I'm rebuilding how I shorten sessions — for now you're getting full sessions. The shorter options come back soon with better programming."*
- Once Part 2 ships, real compression profiles kick in per user's `sessionTier`

This avoids shipping known-wrong behavior while Part 2 is drafted.

---

## 7. Deferred to Part 2

| Item | Why deferred |
|---|---|
| Street Lifter compression profiles per session type | Needs program-bible review |
| Skill Builder compression profiles per session type | Needs program-bible review + coach validation |
| Hybrid Athlete compression profiles per session type | Needs program-bible review |
| Endurance compression profiles | Path not yet generated; defer until Endurance ships |
| Default mesocycle phase length per tier | Part of per-path table work |
| Coach validation of all compression tables | Post-launch, with a real coach |

---

## 8. Build Flags (MVP 1.19)

| Surface | Scope | Time |
|---|---|---|
| Supersede v2.4.7 logic | Remove cut tables; resolve all tiers to Recommended temporarily | ~30 min |
| Onboarding step | New step: session length question between schedule and experience | ~2 hours |
| Skip-default change | Default `sessionTier` to `standard` instead of `recommended` for new users | ~15 min |
| One-time migration message | Compact/Standard existing users get the rebuild message on next open | ~1 hour |
| Schema | Add `compressionProfile` shape to context packet (empty for now, populated in Part 2) | ~1 hour |
| Testing | Onboarding flow, migration message, no regressions on Recommended sessions | ~2 hours |
| **Total Part 1** | | **~1 day** |

**Part 2 build cost (estimated):** ~5 days once compression tables are drafted and coach-reviewed. Includes generator updates per path, mesocycle stretch logic in progression engine, compressionProfile assembly.

---

## 9. Ripple Impact Summary

| Area | Impact |
|---|---|
| Generators | Will consult compression profiles at generation time (Part 2) |
| Progression engine | Phase length becomes tier-dependent (Part 2, mesocycle stretch lever) |
| Conversation Agent (v2.4.8) | New `compressionProfile` field in context packet |
| Autoregulation tables | Unchanged |
| Rules engine | Unchanged |
| Pain protocols | Unchanged |
| Warm-up (v2.4.5) | Unchanged — explicitly off-limits to compression |
| Account deletion, dev access, disclaimers, post-session review | Unchanged |

---

## 10. Changelog Stub (for v2.5 merge)

**v2.4.8 → v2.4.9 | June 2026**

**Supersedes:** v2.4.7 (excluded from v2.5 merge).

**Added (Part 1):**
- Compression principle: warm-up fixed, training is the time lever
- Lever taxonomy: density, volume cut, mesocycle stretch, secondary drop
- New compression model: sessions generated *for* tier, not trimmed
- Onboarding step for session length (replaces Settings-only)
- Skip-default changed from Recommended to Standard
- `compressionProfile` field on Conversation Agent context packet
- One-time migration message for v2.4.7 users

**Deferred (Part 2):**
- Per-path × session-type compression tables
- Mesocycle phase length per tier
- Coach validation

**Unchanged (explicit):**
- Three-tier shape (Compact / Standard / Recommended)
- `sessionTier` field on `profile.schedule`
- Mid-mesocycle tier-switch Plan Realignment hook
- v2.4.5 warm-up structure
- v2.4.8 Conversation Agent architecture
- Rules engine, autoregulation, pain protocols

**Driver:** Device-test of v2.4.7 showed cut logic protected the wrong things. Whole mechanism redesigned.

---

*End of Amendment v2.4.9 — Part 1 (Framework).*
*Part 2 (per-path compression tables) drafts when program-bible review begins.*
