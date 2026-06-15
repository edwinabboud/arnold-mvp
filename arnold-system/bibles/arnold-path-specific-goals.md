# ARNOLD -- PATH-SPECIFIC GOAL SYSTEM

## How Goals Work Per Program Path

Goals are NOT generic. Each path has its own goal types, its own onboarding questions, and its own way of using goals to drive the plan generator. A Street Lifter's goal is a number on a bar. A Skill Builder's goal is unlocking a movement. A Hybrid Athlete has both.

This document defines exactly what gets collected, stored, and used for each path.

---

## 1. STREET LIFTER GOALS

### What goals mean here
Weight targets on specific lifts. "I want to dip +80kg." "I want to pull-up with +50% bodyweight." These are the 12-week mesocycle endpoints — test week targets.

### Onboarding flow (after path selection + assessment)

Arnold asks: **"What lifts do you want to focus on?"**

Tappable options (multi-select, pick 1-3):
- Weighted Pull-ups
- Weighted Dips
- Weighted Muscle-ups
- Squats (barbell or pistol)

For each selected lift, Arnold asks: **"What's your target?"**

Tappable options:
- **Just get stronger** (no specific number — Arnold sets targets based on assessment)
- **I have a number** → free text input (e.g., "+60kg dips", "+40kg pull-ups")
- **Competition prep** → Arnold asks target date + weight class

### What gets stored

```typescript
interface StreetLifterGoals {
  targetLifts: {
    exercise: "weighted_pullup" | "weighted_dip" | "weighted_muscleup" | "squat";
    targetType: "general" | "specific" | "competition";
    targetWeight?: number;        // in kg, added weight (not total)
    targetDate?: string;          // ISO date, for competition prep
    weightClass?: number;         // kg, for competition prep
  }[];
}
```

### How goals drive the plan

- **Selected lifts** determine which exercises get the "main" role on heavy days. If user picks pull-ups + dips but not muscle-ups, muscle-ups don't appear as main lifts.
- **"Just get stronger"** — Arnold uses assessment data to set a realistic 12-week target (+10-15% of current e1RM for intermediates, +5-8% for advanced). Target auto-adjusts based on progress.
- **Specific number** — Arnold reverse-engineers the mesocycle from that target. If user is at +30kg pull-ups and wants +50kg, Arnold calculates whether that's achievable in 12 weeks or needs multiple cycles.
- **Competition prep** — Peaking phase aligns with the competition date. Arnold factors in taper (2 weeks) and schedules test week accordingly. Weight class info triggers bodyweight monitoring.

### Arnold's coaching around goals

- After test week: "You hit +45kg pull-ups. Your target was +50kg. Want to run another cycle focused on pulling strength?"
- Mid-cycle check: "You're trending toward +47kg at this rate. On track for your target."
- If unrealistic: "Getting from +30kg to +60kg in 12 weeks would need ~2.5kg/week gains. That's aggressive. I'd suggest +45kg as a first target, then we run another cycle."

---

## 2. SKILL BUILDER GOALS

### What goals mean here
Unlocking specific movements. "I want a freestanding handstand." "I want to hold a full front lever." These determine which progression trees are active and which skills get practice time.

### Onboarding flow (after path selection + assessment)

Arnold asks: **"Which skills do you want to work toward?"**

Tappable options (multi-select, pick 1-3 — max 3 to avoid spreading too thin):
- Handstand (balance)
- Planche (push strength-skill)
- Front Lever (pull strength-skill)
- Back Lever (pull strength-skill)
- Muscle-up (dynamic)
- L-sit / V-sit (compression)
- Human Flag (lateral)

For each selected skill, Arnold shows the user's **current level** (from assessment) and asks: **"Where do you want to get?"**

Example for Handstand:
- Current: Wall handstand 45s *(Level 4 of 11)*
- Target options:
  - **Freestanding 10s** (Level 7 — ~3-6 months)
  - **Freestanding 30s** (Level 8 — ~6-12 months)
  - **Just improve** (Arnold picks the next 2-3 progressions as targets)

Example for Front Lever:
- Current: Tuck hold 8s *(Level 3 of 7)*
- Target options:
  - **Advanced tuck** (Level 4 — ~2-4 months)
  - **Straddle** (Level 5 — ~6-12 months)
  - **Full front lever** (Level 7 — ~12-24+ months, Arnold flags this as multi-cycle)
  - **Just improve**

### What gets stored

```typescript
interface SkillBuilderGoals {
  targetSkills: {
    skill: "handstand" | "planche" | "front_lever" | "back_lever" | "muscle_up" | "l_sit_v_sit" | "human_flag";
    currentLevel: number;         // from assessment (1-11 depending on skill)
    targetLevel: number;          // user-selected or Arnold-suggested
    targetType: "specific" | "general";
  }[];
}
```

### How goals drive the plan

- **Selected skills** (max 3) determine which progression trees are active. Only active skills get dedicated practice blocks in sessions.
- **Skill priority** is implicit from selection order (first picked = most practice time). With 2 skills, split is roughly 60/40. With 3 skills, it's 50/30/20.
- **Target level** sets the mesocycle endpoint. Arnold schedules skill peaking (weeks 10-11) around testing the target progression.
- **"Just improve"** — Arnold advances through progressions at whatever pace the user can handle. No fixed endpoint pressure.
- **Multi-cycle targets** — If target is far (e.g., tuck to full front lever), Arnold breaks it into intermediate targets per cycle. "This cycle we're getting you to advanced tuck. Next cycle we go for straddle."
- **Supporting strength** is auto-selected based on target skills. Front lever target → pull-ups get "main" role. Planche target → dips/push-ups get "main" role.

### Arnold's coaching around goals

- Proactive: "Your pull-up strength is at +40% BW. That puts you in range for advanced tuck front lever. Want to test it this week?"
- Reality check: "Full planche from tuck planche typically takes 1-2 years of dedicated work. Let's target straddle planche for this cycle."
- Progress: "You held advanced tuck front lever for 12s today — up from 6s when we started. Two more consistent weeks and we test straddle."

---

## 3. HYBRID ATHLETE GOALS

### What goals mean here
Both weighted targets AND skill targets. The user wants heavy numbers on the bar AND to unlock movements. These goals together determine which Hybrid structure Arnold uses and how training time is allocated.

### Onboarding flow (after path selection + assessment)

**Part A — Weighted goals** (same as Street Lifter):

Arnold asks: **"Which lifts do you want to get stronger on?"**

Tappable options (multi-select):
- Weighted Pull-ups
- Weighted Dips
- Weighted Muscle-ups
- Squats

For each: "Just get stronger" / specific number / competition prep.

**Part B — Skill goals** (same as Skill Builder):

Arnold asks: **"Which skills do you want to unlock?"**

Tappable options (multi-select, 1-3):
- Handstand / Planche / Front Lever / Back Lever / Muscle-up / L-sit / Human Flag

For each: current level shown, target level selected.

**Part C — Priority (only for Structure C, 5-6 days/week):**

If user selected 5-6 training days, Arnold asks: **"Rank these by priority — what matters most?"**

User drag-ranks or tap-orders their combined goals (both weighted and skills) into:
- **Primary** (3x/week) — e.g., Weighted Dips + Planche
- **Secondary** (2x/week) — e.g., Weighted Pull-ups + Front Lever
- **Tertiary** (1x/week) — e.g., Handstand

For 3-4 day schedules (Structures A/B), priority ranking is skipped — Arnold allocates automatically.

### What gets stored

```typescript
interface HybridAthleteGoals {
  weightedGoals: {
    exercise: "weighted_pullup" | "weighted_dip" | "weighted_muscleup" | "squat";
    targetType: "general" | "specific" | "competition";
    targetWeight?: number;
    targetDate?: string;
    weightClass?: number;
  }[];
  skillGoals: {
    skill: "handstand" | "planche" | "front_lever" | "back_lever" | "muscle_up" | "l_sit_v_sit" | "human_flag";
    currentLevel: number;
    targetLevel: number;
    targetType: "specific" | "general";
  }[];
  priorityRanking?: {
    primary: string[];    // goal IDs — e.g., ["weighted_dip", "planche"]
    secondary: string[];  // e.g., ["weighted_pullup", "front_lever"]
    tertiary: string[];   // e.g., ["handstand"]
  };  // only set for Structure C (5-6 days)
}
```

### How goals drive the plan

- **Weighted goals** → determine main lift selection on weighted days (same as Street Lifter).
- **Skill goals** → determine which progression trees are active for bolt-on exercises or dedicated skill days.
- **Structure selection** uses both available days AND goal count:
  - 3-4 days → Structure A (bolt-on). Skills bolted onto weighted sessions.
  - 4-5 days → Structure B (PPL + skill day). Skills get their own day.
  - 5-6 days → Structure C (priority rotation). Priority ranking drives frequency.
  - 5 days + competition focus → Structure D (KOW hybrid). Skills as accessories only.
- **Synergy mapping** — Arnold auto-connects weighted lifts to skills: pull-ups support front lever + muscle-up. Dips support planche + HSPU. When a skill stalls, Arnold checks the corresponding weighted lift first.
- **Specialization phase** (weeks 9-10) — Arnold asks via chat: "Test week is coming. Push hardest on your weighted PRs or your skill holds?" User's answer determines which goals get peaking volume and which drop to maintenance.

### Arnold's coaching around goals

- Synergy nudge: "Your weighted pull-up is at +55% BW. The research says you might be ready for advanced tuck front lever. Want to test it?"
- Balance check: "You've been crushing weighted dips (+65kg!) but your planche hasn't moved in 3 weeks. I think your pressing strength is there — you just need more specific practice. Want me to add an extra planche session?"
- Specialization: "You have 2 weeks until test week. Do you want to peak your weighted lifts or your skill holds? I'll adjust the program."

---

## 4. ENDURANCE GOALS (SKIPPED FOR MVP)

For future reference: Endurance goals would be benchmark targets — "30 pull-ups unbroken", "100 push-ups in 5 minutes", "complete X circuit in under Y time." Not built for MVP.

---

## 5. GOAL DATA IN THE PLAN GENERATOR

### Where goals plug into the generator

| Generator Decision | What Goals Control |
|---|---|
| Which exercises get "main" role | Weighted goals → specific lifts. Skill goals → specific progression trees |
| Session ordering | Skill goals determine skill block content. Weighted goals determine heavy compound content |
| Mesocycle endpoint | Specific targets set test week expectations. "General" lets Arnold auto-target |
| Specialization phase (Hybrid) | User picks weighted OR skill emphasis — non-chosen drops to maintenance |
| Structure selection (Hybrid) | Goal count + training days + priority ranking → Structure A/B/C/D |
| Synergy tracking (Hybrid) | Weighted-to-skill mapping for plateau detection |
| Progress messaging | Arnold references goals in chat: "You're at +42kg, target is +50kg" |
| Multi-cycle planning | If target > 1 cycle, Arnold sets intermediate targets per cycle |

### Assessment data that feeds goals

| Path | Assessment Collects | Used For |
|---|---|---|
| Street Lifter | Max reps at bodyweight (PU, dips), current working weights, bodyweight | e1RM calculation, tier selection, realistic target setting |
| Skill Builder | Max reps (PU, dips), max hold times per skill, wall handstand time | Current level in each tree, tier selection, target distance calculation |
| Hybrid Athlete | All of the above | Both weighted e1RM and skill levels, synergy benchmark comparison |

---

## 6. GOAL UPDATES (Post-Onboarding)

Goals aren't locked after onboarding. Users can update them anytime via chat:

- **"I want to add front lever to my goals"** → Arnold adds the skill tree, adjusts session templates to include FL practice.
- **"I hit my +50kg pull-up target"** → Arnold congratulates, asks "Want to set a new target or shift focus?"
- **"I don't care about muscle-ups anymore"** → Arnold removes from active skills, redistributes practice time.
- **"I want to compete in 3 months"** → Arnold switches to competition prep mode, aligns peaking with the date.

These changes cascade through the mesocycle just like any other adaptation.

---

## 7. ONBOARDING FLOW SUMMARY (Updated)

| Step | What Happens |
|---|---|
| 1 | Pick program path (Street Lifter / Skill Builder / Hybrid Athlete) |
| 2 | **Set path-specific goals** (see sections 1-3 above) |
| 3 | Pick schedule (3-6 days/week, preferred days) |
| 4 | Assessment or "I know my level" self-report |
| 5 | Plan generation (goals + assessment + schedule → 12-week mesocycle) |

Goals are now Step 2, immediately after path selection, because they determine what the assessment needs to measure. If user picks Skill Builder and selects front lever + handstand, the assessment tests those specific holds. If user picks Street Lifter and selects pull-ups + dips, the assessment tests max reps and working weights on those lifts.

---

*End of Path-Specific Goal System. Add this to the project files and reference from the MVP builder chat.*
