# Arnold — Spec Amendment v2.4.7

**Status:** Active. Pending merge into master.
**Sequencing:** Merges into `arnold-product-spec-v2_5.md` after MVP 1.12 ships, alongside v2.4.1, v2.4.3, v2.4.4, v2.4.5, v2.4.6.
**Trigger:** TestFlight user feedback — variable available training time across users (work, family, schedule).

**Design principle:** Minimal scope. Profile preference only. No schema changes beyond one new field. No per-session toggle. No new programming variants — same program, runtime cut rules per path.

---

## Change 1 — Session Duration Tiers

User picks a tier in Settings. Tier sets the session length target. Same program for all tiers — runtime rules cut accessories/finisher based on tier.

| Tier | Target time | Programming |
|---|---|---|
| Compact | ~40 min | Full warm-up sets for main lift (injury prevention non-negotiable) + main lift + 1 accessory |
| Standard | ~60 min | Compressed warm-up + main lift + 2 accessories |
| **Recommended** | ~90 min | Full warm-up + main lift + accessories + finisher |

**Recommended is the default for new users.** Compact and Standard are explicit opt-ins.

---

## Change 2 — Per-Path Cut Rules

What gets kept vs. dropped when generating Compact and Standard sessions. Recommended = full program, no cuts.

### Street Lifter

| Slot | Compact | Standard | Recommended |
|---|---|---|---|
| Warm-up (general) | 3 exercises | 3 exercises | 5 exercises |
| Main lift warm-up sets | Full ramp (always) | Full ramp | Full ramp |
| Main lift working sets | Keep | Keep | Keep |
| Accessory 1 | Keep | Keep | Keep |
| Accessory 2 | Drop | Keep | Keep |
| Finisher | Drop | Drop | Keep |

### Skill Builder

| Slot | Compact | Standard | Recommended |
|---|---|---|---|
| Warm-up | 3 exercises | 3 exercises | Full warm-up |
| Skill practice | Keep | Keep | Keep |
| Skill isometric | Keep | Keep | Keep |
| Complementary lift | Keep (1 set fewer) | Keep | Keep |
| Prehab accessories | Drop | Keep | Keep |
| Core finisher | Drop | Drop | Keep |

### Hybrid Athlete

| Slot | Compact | Standard | Recommended |
|---|---|---|---|
| Warm-up | 3 exercises | 3 exercises | Full warm-up |
| Main lift warm-up sets | Full ramp | Full ramp | Full ramp |
| Main lift | Keep | Keep | Keep |
| Accessory 1 | Keep | Keep | Keep |
| Accessory 2 | Drop | Keep | Keep |
| Conditioning block | Drop | Drop | Keep |

---

## Change 3 — Schema

Single new field on `profile.schedule`:

```ts
schedule {
  ...
  sessionTier: "compact" | "standard" | "recommended";  // new — default "recommended"
}
```

No new fields on `SessionLog`. No `sessionMode`. Autoregulation reads completed sets directly — no awareness of tier needed.

---

## Change 4 — UX

Settings → Training → "Session length." Three options. Tap to switch.

No per-session toggle. Users who want flexibility set their tier in Settings; switching takes one tap, immediate effect on next session.

---

## Change 5 — Mid-Mesocycle Tier Switching

Switching tier mid-mesocycle triggers existing Plan Realignment dialog (§4.5):

- Restart current phase at week 1 with new tier
- Finish current week, switch from next week
- Cancel switch

No new dialog. Reuses existing system.

---

## Deferred (logged to §17)

| Item | Trigger to revisit |
|---|---|
| Per-session toggle ("Short version today" button) | Real user demand on TestFlight |
| Coach review of cut rules | Post-launch with a professional coach |
| Refined exercise selection per tier (smarter than "drop accessory 2") | Post-launch, after observing usage data |
| Extended tier with longer rest periods + optional skill/conditioning blocks | Post-launch, after coach review |

---

## Build flags (MVP 1.16)

| Surface | Scope | Time |
|---|---|---|
| Profile schema | Add `sessionTier` to profile.schedule, default `"recommended"` | ~30 min |
| Settings UI | New row "Session length" with three options | ~1 hour |
| Generator updates — Street Lifter | Apply cut rules based on `sessionTier` | ~3 hours |
| Generator updates — Skill Builder | Apply cut rules based on `sessionTier` | ~3 hours |
| Generator updates — Hybrid Athlete | Apply cut rules based on `sessionTier` | ~3 hours |
| Plan Realignment integration | Trigger existing dialog on tier change mid-cycle | ~1 hour |
| Testing | Three tiers × three paths | ~4 hours |
| **Total** | | **~2 days** |

---

## Changelog stub (for v2.5 merge)

**v2.4.6 → v2.4.7 | May 2026**

**Added:**
- Session duration tiers (Compact / Standard / Recommended) on profile.schedule
- Settings → Training → Session length UI
- Per-path runtime cut rules

**Driver:** TestFlight user feedback on variable available training time.

**Deferred to §17:**
- Per-session "short version" toggle
- Professional coach review of cut rules
- Extended/longer tier with smarter programming
