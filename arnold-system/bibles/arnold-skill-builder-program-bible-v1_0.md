# ARNOLD -- SKILL BUILDER PROGRAM BIBLE v1.0

## The Complete Programming Spec for Calisthenics Skill Acquisition

*Everything the plan generator needs to build Skill Builder programs. If it's not here, it doesn't get coded.*

Version 1.0 | April 2026

Sources: Overcoming Gravity (Steven Low), Beyond Bodyweight (Refael Paz), FitnessFAQs programs,
Calisthenic Movement, GMB Fitness, Berg Movement, School of Calisthenics,
Branscheidt et al. 2019 (Johns Hopkins motor learning), Czyz et al. 2024 (contextual interference meta-analysis),
r/bodyweightfitness community data, real coach programming.

---

# 1. TIER SELECTION LOGIC

## How the user lands in a tier

| Onboarding Path | Condition | Assigned Tier |
|---|---|---|
| Starting from scratch | No assessment | **Beginner** |
| Assessment | < 8 pull-ups OR < 15 dips OR < 30s wall handstand | **Beginner** |
| Assessment | >= 8 pull-ups AND >= 15 dips AND >= 60s wall handstand | **Intermediate** |
| Assessment | Can hold tuck front lever 10s + freestanding handstand 10s | **Advanced** |
| "I know my level" | Self-reports current skill progressions | **Intermediate or Advanced** (verified by assessment week) |
| Auto-promotion | Completed Beginner cycle + hits Intermediate prerequisites | -> **Intermediate** |
| Auto-promotion | Completed 2+ Intermediate cycles + hits Advanced prerequisites | -> **Advanced** |

## Tier Prerequisites

| Tier | Pull-ups | Dips | Handstand | Other | Training History |
|---|---|---|---|---|---|
| Beginner | 0-7 | 0-14 | < 30s wall hold | No skill holds | None required |
| Intermediate | 8+ | 15+ | 60s wall hold | 15s tuck L-sit, 10 skin the cats | 3+ months training |
| Advanced | 12+ | 20+ | 10s freestanding | Tuck FL 10s, tuck planche 10s, 3+ muscle-ups | 12+ months skill training |

---

# 2. SKILL PROGRESSION TREES

## The Universal Advancement Rule

From Steven Low's isometric Prilepin tables: when you can hold a progression for 3-4 sets of 15-20 seconds with perfect form across 2 consecutive sessions, test the next progression. If you can hold 10+ seconds on the next progression, move up.

For dynamic skills (muscle-ups): when you can perform 3 sets of the target rep range for 2 consecutive sessions with clean form, advance.

**Critical rule: NEVER train skills to failure.** Branscheidt et al. (2019, Johns Hopkins) showed that training under fatigue creates maladaptive motor patterns that persist for days and transfer across limbs. Stop all skill work while form is still excellent.

## 2.1 Handstand Progression

| Level | Progression | Advancement Threshold | Type |
|---|---|---|---|
| 1 | Plank + hollow body hold | 60s plank + 30s hollow | Foundation |
| 2 | Wall walks (chest-to-wall) | 3 x 3 controlled walks | Foundation |
| 3 | Chest-to-wall handstand | 3 x 60s with proper alignment | Wall |
| 4 | Wall shoulder taps | 3 x 8 taps per side | Wall |
| 5 | Back-to-wall handstand | 3 x 45s | Wall |
| 6 | Toe pulls from wall | 3 x 5 controlled pulls | Transition |
| 7 | Freestanding attempts (kick-up + hold) | 10s consistent hold | Free |
| 8 | Freestanding handstand | 30s hold | Free |
| 9 | 60-second freestanding hold | 60s hold | Free |
| 10 | Press to handstand (straddle) | 3 x 3 controlled presses | Advanced |
| 11 | One-arm handstand progression | 5s hold | Elite |

**Practice frequency:** 4-6 days/week, 15-25 min per session (balance skill = high frequency, low volume)

**Timeline:** First 5s hold in 2-4 months. 30s hold in 4-8 months. 60s hold in 6-12 months.

**Mobility requirements:** 170-180 degrees shoulder flexion, 90 degrees wrist extension

## 2.2 Planche Progression

| Level | Progression | Advancement Threshold | Type |
|---|---|---|---|
| 1 | Planche lean (hands by hips) | 3 x 30s at moderate lean | Foundation |
| 2 | Frog stand / Crow pose | 3 x 30s | Foundation |
| 3 | Tuck planche | 3 x 15s (advance at 30s hold) | Tuck |
| 4 | Advanced tuck planche | 3 x 10s | Tuck |
| 5 | One-leg tuck planche (each leg) | 3 x 8s per side | Transition |
| 6 | Straddle planche | 3 x 5s (advance at 10s) | Open |
| 7 | Half-lay planche | 3 x 5s | Open |
| 8 | Full planche | 3 x 3s | Full |

**Practice frequency:** 2-3x/week with 48-72h between sessions (strength-skill = lower frequency, higher recovery)

**Timeline:** Tuck planche in 3-6 months. Straddle in 1-3 years. Full planche in 2-5+ years.

**Critical note:** Advanced tuck to straddle is the largest difficulty gap in all calisthenics. Use one-leg variations and weighted tuck planches to bridge it.

**Mobility requirements:** 90 degrees wrist extension, full scapular protraction ability

## 2.3 Front Lever Progression

| Level | Progression | Advancement Threshold | Type |
|---|---|---|---|
| 1 | Active dead hang | 3 x 30s | Foundation |
| 2 | Tuck front lever | 4 x 15s | Tuck |
| 3 | Advanced tuck front lever | 3 x 10s | Tuck |
| 4 | One-leg front lever (each side) | 3 x 8s per side | Transition |
| 5 | Straddle front lever | 3 x 8s | Open |
| 6 | Half-lay front lever | 3 x 5s | Open |
| 7 | Full front lever | 3 x 5s | Full |

**Practice frequency:** 2-3x/week with 48-72h between sessions

**Timeline:** Tuck in 1-4 weeks (if prerequisites met). Full front lever in 6-24 months.

**Strength predictor:** Weighted pull-up with 50-80% bodyweight added strongly predicts full front lever ability.

## 2.4 Back Lever Progression

| Level | Progression | Advancement Threshold | Type |
|---|---|---|---|
| 1 | German hang | 3 x 30s comfortable | Foundation |
| 2 | Skin the cat (controlled) | 3 x 10 reps | Foundation |
| 3 | Tuck back lever | 3 x 15s | Tuck |
| 4 | Advanced tuck back lever | 3 x 10s | Tuck |
| 5 | One-leg back lever | 3 x 8s per side | Transition |
| 6 | Straddle back lever | 3 x 8s | Open |
| 7 | Full back lever | 3 x 5s | Full |

**Practice frequency:** 2-3x/week

**Timeline:** 6-12 months to full back lever

**Safety:** ALWAYS use pronated grip. Supinated grip dramatically increases biceps tendon injury risk.

## 2.5 Muscle-Up Progression

| Level | Progression | Advancement Threshold | Type |
|---|---|---|---|
| 1 | Strict pull-ups | 3 x 10-15 reps | Strength |
| 2 | Chest-to-bar pull-ups | 3 x 5-8 reps | Strength |
| 3 | High pull-ups (pull to sternum) | 3 x 5 reps | Explosive |
| 4 | Straight bar dips (from top of bar) | 3 x 10 reps | Strength |
| 5 | Negative muscle-ups (8-10s eccentric) | 3 x 3-5 reps | Eccentric |
| 6 | Band-assisted muscle-ups | 3 x 3-5 reps | Assisted |
| 7 | Kipping / momentum muscle-up | 3 x 3 reps | Dynamic |
| 8 | Strict bar muscle-up | 3 x 5 reps | Full |
| 9 | Slow muscle-up (3s transition) | 3 x 3 reps | Advanced |
| 10 | Weighted muscle-up | 3 x 3 reps | Advanced |

**Ring muscle-up variant:** Requires false grip mastery first (build to 3 x 20s false grip hang)

**Practice frequency:** 2-3x/week

**Timeline:** 3-12 months from meeting strength prerequisites

## 2.6 L-Sit / V-Sit Progression

| Level | Progression | Advancement Threshold | Type |
|---|---|---|---|
| 1 | Support hold (hands on floor or parallettes) | 3 x 30s | Foundation |
| 2 | Foot-supported L-sit (heels on floor) | 3 x 20s | Foundation |
| 3 | Tuck L-sit | Accumulate 60s per session | Tuck |
| 4 | Single-leg L-sit (alternating) | 3 x 10s per side | Transition |
| 5 | Full L-sit | 3 x 15s (advance at 30s) | Full |
| 6 | Straddle V-sit | 3 x 10s | Advanced |
| 7 | V-sit | 3 x 5s | Advanced |
| 8 | Manna | 3 x 3s | Elite |

**Note:** Hip flexor cramping during tuck L-sit is normal and resolves with training.

**Timeline:** Full L-sit in 2-4 months. V-sit in 6-12 months. Manna is a multi-year project.

## 2.7 Human Flag Progression

| Level | Progression | Advancement Threshold | Type |
|---|---|---|---|
| 1 | Side plank (each side) | 3 x 60s per side | Foundation |
| 2 | Vertical flag (body inverted, pole between arms) | 3 x 10-20s | Foundation |
| 3 | Flag negatives (lower slowly from vertical) | 3 x 3-5 reps | Eccentric |
| 4 | Tuck flag | 3 x 10s | Tuck |
| 5 | One-leg flag | 3 x 8s | Transition |
| 6 | Straddle flag | 3 x 5s | Open |
| 7 | Full human flag | 3 x 3-5s | Full |

**Practice frequency:** 2-3x/week

**Timeline:** Full flag in 6-18 months

---

# 3. BEGINNER PROGRAM (Foundation Builder)

## Philosophy

Build the proprioceptive awareness, wrist/shoulder conditioning, and base pulling/pushing strength that all skill work requires. No advanced skill practice until foundations are solid. Daily handstand practice begins from day one (wall-supported only).

## Structure Overview

- **Duration:** 8-12 weeks (repeatable until prerequisites met)
- **Frequency:** 3 days/week full body + daily 10-min wall handstand practice
- **Split:** Full Body A/B rotation
- **Periodization:** Linear progression
- **Skill focus:** Wall handstands, L-sit progressions, skin the cats

## Daily Handstand Practice (10 minutes, every day)

| Exercise | Sets x Time | Notes |
|---|---|---|
| Wrist warm-up (circles, rocks, loading) | 2 min | Non-negotiable for joint health |
| Chest-to-wall handstand | 3-4 x max hold (up to 60s) | Focus on alignment: ears between arms, ribs tucked, posterior pelvic tilt |
| Wall shoulder taps (if ready) | 3 x 5/side | Only when 45s wall hold is solid |

## Session A -- Push + Skill

| Block | Exercise | Sets x Reps | Rest | Intent |
|---|---|---|---|---|
| Warm-Up | General (5 min) + wrist circles + shoulder dislocates | -- | -- | -- |
| Skill | L-sit progression (floor or parallettes) | 3 x max hold | 90s | Moderate |
| Main | Push-up progression | 3 x 5-8 | 120s | Challenging |
| Main | Dip progression | 3 x 5-8 | 120s | Challenging |
| Volume | Pike push-ups | 3 x 8-12 | 90s | Moderate |
| Accessory | Scapular push-ups (protraction focus) | 3 x 10-15 | 60s | Easy |
| Accessory | Plank variations | 3 x 30-45s | 30s | Easy |
| Cooldown | Wrist stretch + shoulder stretch | 3 min | -- | -- |

## Session B -- Pull + Skill

| Block | Exercise | Sets x Reps | Rest | Intent |
|---|---|---|---|---|
| Warm-Up | General (5 min) + band pull-aparts + dead hang | -- | -- | -- |
| Skill | Skin the cat (controlled) | 3 x 3-5 reps | 120s | Moderate |
| Main | Pull-up progression | 3 x 5-8 | 120s | Challenging |
| Main | Row progression (ring or Australian) | 3 x 8-12 | 90s | Moderate |
| Volume | Dead hang (active shoulders) | 3 x 30-45s | 60s | Moderate |
| Accessory | Hollow body hold | 3 x 20-30s | 60s | Easy |
| Accessory | Face pulls with band | 3 x 15 | 60s | Easy |
| Cooldown | Lat stretch + thoracic mobility | 3 min | -- | -- |

## Session C -- Full Body + Legs

| Block | Exercise | Sets x Reps | Rest | Intent |
|---|---|---|---|---|
| Warm-Up | General (5 min) + hip circles + ankle mobility | -- | -- | -- |
| Skill | L-sit progression | 3 x max hold | 90s | Moderate |
| Main | Squat progression | 3 x 5-8 | 120s | Challenging |
| Main | Pull-ups | 3 x 5-8 | 120s | Challenging |
| Main | Push-ups | 3 x 5-8 | 90s | Moderate |
| Accessory | Lunges | 3 x 10/leg | 60s | Easy |
| Accessory | Dead bugs | 3 x 10/side | 60s | Easy |
| Cooldown | Full body stretch | 5 min | -- | -- |

## Beginner Progression Rules

- Double progression: start at bottom of rep range, add reps until top, advance to next variation
- Wall handstand: add 5-10s per session until 3 x 60s
- L-sit: accumulate total hold time per session (target: 60s total), not per set
- Skin the cat: start with partial ROM, gradually increase until full rotation
- Transition to Intermediate when: 8+ pull-ups, 15+ dips, 60s wall HS, 15s tuck L-sit, 10 skin the cats

---

# 4. INTERMEDIATE PROGRAM (Skill Acquisition)

## Philosophy

Dedicated skill practice begins. Skills are trained FIRST in every session when the CNS is fresh. Supporting strength work follows. Based on the Paz 1:2 periodization model: 1 hypertrophy block for every 2 strength blocks.

## Structure Overview

- **Duration:** 12-week mesocycle
- **Frequency:** 4-5 days/week (including 2-3 dedicated skill days and 2 strength days)
- **Split:** Skill+Push / Skill+Pull / Pure Skill / Strength Upper / Strength Lower
- **Periodization:** Block (Hypertrophy -> Strength -> Skill Peak -> Test)

## Phase Structure (12-Week Mesocycle)

| Weeks | Phase | Skill Practice | Strength Work | Volume Level |
|---|---|---|---|---|
| 1-3 | Hypertrophy | 15 min/session, focus on holds | 3-4 x 8-12 reps, controlled tempo | High |
| 4 | Deload | 10 min/session, easy progressions | 2 x 8 @RPE 5 | Low |
| 5-8 | Strength | 20 min/session, harder progressions | 4-5 x 3-5 reps, explosive concentric | Moderate |
| 9 | Deload | 10 min/session | 2 x 5 @RPE 5 | Low |
| 10-11 | Skill Peak | 25 min/session, max attempts | Drop supplementary exercises | Low strength / High skill |
| 12 | Test | PR attempts on all target skills | Light maintenance only | Minimal |

## Target Skill Selection (Intermediate)

The user selects 2-3 target skills during onboarding. Arnold programs skill practice around these targets.

**Compatible skill pairs (train same session):**
- Handstand + L-sit (different shoulder positions, no interference)
- Front lever + Planche lean (push/pull balance)
- Muscle-up drills + Back lever (both pulling patterns but different demands)

**Incompatible pairs (never same session):**
- Planche + Handstand push-ups (both heavy overhead pushing, shoulder fatigue)
- Front lever + Heavy pull-up work (both maximal pulling)

## Session Templates -- 4 Day Split

### Day 1 -- Skill + Push

| Block | Exercise | Sets x Reps/Time | Rest | Intent |
|---|---|---|---|---|
| Warm-Up | Wrist prep (3 min) + shoulder mobility (3 min) + hollow body 3x15s | -- | -- | -- |
| Skill A | Handstand practice (wall or free, per progression) | 15-20 min total | 60-180s | Moderate -- NEVER to failure |
| Skill B | L-sit progression | 3-4 x max hold | 90s | Moderate |
| Strength | Pseudo planche push-ups (or planche lean) | 3-5 x 3-8 | 180s | Challenging |
| Strength | Pike push-up progression (toward HSPU) | 3 x 5-8 | 120s | Challenging |
| Accessory | Dips (bodyweight) | 3 x 8-12 | 90s | Moderate |
| Accessory | Scapular protraction push-ups | 2 x 12-15 | 60s | Easy |
| Cooldown | Wrist stretch + chest stretch + pike stretch | 5 min | -- | -- |

### Day 2 -- Skill + Pull

| Block | Exercise | Sets x Reps/Time | Rest | Intent |
|---|---|---|---|---|
| Warm-Up | Band pull-aparts + scap pulls + active hang 30s | -- | -- | -- |
| Skill A | Front lever progression (per tree) | 4-6 x 60-70% of max hold | 180-300s | Challenging -- full CNS recovery |
| Skill B | Back lever progression (if in targets) | 3-4 x 60-70% of max hold | 180s | Moderate |
| Strength | Pull-ups (add weight when 3x12 is easy) | 3-5 x 5-8 | 180s | Challenging |
| Strength | Front lever rows (at easier progression) | 3-4 x 4-8 | 120s | Challenging |
| Accessory | Straight-arm pulldowns (band or cable) | 3 x 10-12 | 60s | Moderate |
| Accessory | Bicep curls | 2 x 12-15 | 60s | Easy |
| Cooldown | Dead hang 60s + lat stretch + thoracic extension | 5 min | -- | -- |

### Day 3 -- Strength (Upper Body)

| Block | Exercise | Sets x Reps | Rest | Intent |
|---|---|---|---|---|
| Warm-Up | General + scap activation | -- | -- | -- |
| Main A | Weighted pull-ups (or hardest pull-up variation) | 4 x 5-8 | 180-240s | Challenging |
| Main B | Weighted dips (or ring dips) | 4 x 5-8 | 180-240s | Challenging |
| Volume | Rows (ring or barbell) | 3 x 8-12 | 90s | Moderate |
| Volume | Push-up variation (diamond, archer, ring) | 3 x 8-12 | 90s | Moderate |
| Accessory | Face pulls | 3 x 15 | 60s | Easy |
| Accessory | Dragon flags (or progression) | 3 x 5-8 | 90s | Moderate |
| Accessory | Band external rotations | 2 x 15/arm | 45s | Easy |

### Day 4 -- Legs + Core Skills

| Block | Exercise | Sets x Reps | Rest | Intent |
|---|---|---|---|---|
| Warm-Up | Hip circles + leg swings + BW squats | -- | -- | -- |
| Skill | L-sit / V-sit progression | 3-4 x max hold | 90s | Moderate |
| Main | Squat progression (pistol work or barbell) | 4 x 5-8 | 120-180s | Challenging |
| Volume | Bulgarian split squats | 3 x 8-10/leg | 90s | Moderate |
| Accessory | Nordic curl progression | 3 x 5-8 | 90s | Moderate |
| Accessory | Calf raises | 2 x 15-20 | 45s | Easy |
| Accessory | Hollow body hold (weighted if possible) | 3 x 30-45s | 60s | Moderate |

### Optional Day 5 -- Pure Skill (no strength)

| Block | Exercise | Time | Rest | Notes |
|---|---|---|---|---|
| Warm-Up | Full joint mobility circuit | 10 min | -- | Wrists, shoulders, thoracic, hips |
| Skill A | Handstand practice | 15-20 min | 60-180s | Kick-ups, hold attempts, wall drills |
| Skill B | Planche leans + tuck planche attempts | 10-15 min | 180-300s | Never to failure |
| Skill C | Muscle-up drills (if in targets) | 10 min | 120-180s | Transition work, negatives |
| Flexibility | Deep pike stretch + pancake + shoulder stretches | 15 min | -- | Active + passive holds |

## Intermediate Progression Rules

### Isometric Holds (Prilepin Table for Bodyweight)

| Max Hold Time | Working Sets | Working Hold Time | Total Hold Time per Session |
|---|---|---|---|
| 5-10s | 6 sets | 3-5s (60-70% max) | 18-30s |
| 10-20s | 5 sets | 6-12s | 30-60s |
| 20-30s | 4 sets | 12-20s | 48-80s |
| 30s+ | 3-4 sets | 18-25s | 54-100s |

### Dynamic Skills (Muscle-ups, Handstand Push-ups)

- Work at a rep count where you could do 2 more (RPE 7-8)
- When you can do 3 x [target reps] for 2 sessions, advance progression
- Explosive/plyometric drills: keep sets of 3-5, rest 2-3 min

### When to Advance Progressions

| Signal | Action |
|---|---|
| Hold 3x15-20s with perfect form for 2 sessions | Test next progression |
| Next progression hold > 10s | Move up, work new progression |
| Next progression hold 5-10s | Split training: 50% new + 50% current |
| Next progression hold < 5s | Stay at current, build more time |

## Intermediate Deload Protocol (Weeks 4, 9)

- Skill practice: reduce to 10 min, use easier progressions (2 levels below current)
- Strength: 50% volume reduction, RPE 5-6
- Focus on mobility, wrist conditioning, flexibility
- Maintain handstand practice daily (but easier drills only)
- Duration: 1 week

---

# 5. ADVANCED PROGRAM (Skill Refinement)

## Philosophy

Training becomes highly specific. General exercises are dropped. Peak blocks (high intensity, low volume) are where skill breakthroughs happen. Joint health management is critical -- chronic elbow and shoulder tendon issues are the most common career-limiter.

## Structure Overview

- **Duration:** 12-week mesocycle
- **Frequency:** 5-6 days/week
- **Split:** Push skills / Pull skills / Strength / Push skills / Pull skills / Flexibility (or rest)
- **Periodization:** Block (Hypertrophy -> Strength -> Strength -> Peak -> Test)

## Phase Structure (12-Week Mesocycle)

| Weeks | Phase | Skill Volume | Strength Volume | Focus |
|---|---|---|---|---|
| 1-3 | Hypertrophy | 15 min skill + 6-12 rep strength | High volume, controlled tempo | Build supporting muscle tissue |
| 4 | Deload | 10 min easy skills | 2 x 8 light | Recovery |
| 5-7 | Strength A | 20 min skill + 3-5 rep strength | Moderate volume, heavier loads | Convert muscle to force |
| 8 | Deload | 10 min easy skills | Light | Recovery |
| 9-10 | Strength B / Skill Emphasis | 25 min skill, max attempts | Drop supplementary exercises | Apply force to target skills |
| 11 | Peak | Max skill attempts only | Maintenance only (2 x 3) | Skill breakthroughs |
| 12 | Test | PR attempts: hold times, clean reps | None | Measure and celebrate |

## Session Templates -- 5 Day Split

### Day 1 -- Push Skills

| Block | Exercise | Sets x Reps/Time | Rest | Intent |
|---|---|---|---|---|
| Warm-Up | Full wrist protocol + shoulder CARs + hollow body | 10 min | -- | -- |
| Skill A | Handstand (free): holds, press work, or HSPU progression | 20 min | 120-300s | Moderate-Challenging |
| Skill B | Planche progression (per tree) | 5-6 x 60-70% max hold | 240-300s | Challenging |
| Strength | Planche push-ups (at easier progression) | 3-4 x 3-5 | 180s | Challenging |
| Strength | Weighted dips | 3 x 5-8 | 180s | Moderate |
| Prehab | Wrist loading progression | 2 min | -- | Injury prevention |

### Day 2 -- Pull Skills

| Block | Exercise | Sets x Reps/Time | Rest | Intent |
|---|---|---|---|---|
| Warm-Up | Scap pulls + band work + active hang | 8 min | -- | -- |
| Skill A | Front lever progression | 5-6 x 60-70% max hold | 240-300s | Challenging |
| Skill B | Muscle-up work (strict, slow, or weighted) | 4-5 x 2-5 reps | 180-240s | Challenging |
| Strength | Weighted pull-ups | 4 x 3-5 | 240s | Challenging |
| Strength | Front lever rows | 3-4 x 4-6 | 120s | Moderate |
| Prehab | Elbow flexor conditioning (light curls, eccentrics) | 2 x 15 | 60s | Injury prevention |

### Day 3 -- Strength

| Block | Exercise | Sets x Reps | Rest | Intent |
|---|---|---|---|---|
| Warm-Up | General + activation | -- | -- | -- |
| Main A | Weighted pull-ups (heavy) | 4-5 x 3-5 | 240-300s | Challenging |
| Main B | Weighted dips (heavy) | 4-5 x 3-5 | 240-300s | Challenging |
| Volume | Ring rows or seal rows | 3 x 8-10 | 90s | Moderate |
| Volume | Ring push-ups or archer push-ups | 3 x 8-10 | 90s | Moderate |
| Accessory | Dragon flags | 3 x 5-8 | 90s | Moderate |
| Accessory | Face pulls + lateral raises | 2 x 15 each | 60s | Easy |

### Day 4 -- Push Skills (repeat with variation)

| Block | Exercise | Sets x Reps/Time | Rest | Intent |
|---|---|---|---|---|
| Warm-Up | Wrist prep + shoulder mobility | 8 min | -- | -- |
| Skill A | Handstand: different focus than Day 1 (endurance vs balance vs press) | 15-20 min | 60-180s | Moderate |
| Skill B | Planche progression or L-sit/V-sit | 4-5 x 60-70% max hold | 180-300s | Challenging |
| Strength | Pike HSPU progression | 3-4 x 5-8 | 120s | Moderate |
| Strength | Pseudo planche push-ups (heavy lean) | 3 x 5-8 | 120s | Moderate |
| Prehab | Shoulder stability circuit | 5 min | -- | -- |

### Day 5 -- Pull Skills (repeat with variation)

| Block | Exercise | Sets x Reps/Time | Rest | Intent |
|---|---|---|---|---|
| Warm-Up | Hang + scap work | 8 min | -- | -- |
| Skill A | Back lever progression | 4-5 x 60-70% max hold | 180-240s | Moderate-Challenging |
| Skill B | Human flag progression (if in targets) | 4-5 x 60-70% max hold | 180-240s | Moderate-Challenging |
| Strength | Pull-ups (moderate weight or volume) | 3 x 6-10 | 120s | Moderate |
| Strength | Straight-arm pulldowns | 3 x 8-12 | 90s | Moderate |
| Flexibility | Deep stretch session: pike, pancake, shoulder extension, bridge | 15-20 min | -- | -- |

## Advanced Deload Protocol (Weeks 4, 8)
- Skill practice: 10 min, use progression 2 levels below current
- Strength: 50% volume, RPE 5
- NO max attempts on any skill
- Focus on joint health: wrists, elbows, shoulders
- Full flexibility session every deload day
- Duration: 1 week

---

# 6. SKILL PRACTICE RULES (All Tiers)

## The 5 Non-Negotiable Rules

1. **Skills FIRST in every session**, after warm-up, when CNS is fresh
2. **NEVER train skills to failure** -- stop while form is still excellent
3. **1-2 skills per session maximum** -- spreading across too many kills progress on all
4. **Frequency > Volume** -- 5 x 15 min beats 1 x 75 min for neural adaptation
5. **Rest fully between skill attempts** -- 1-3 min for balance skills, 3-5 min for strength-skills

## Skill Practice Duration by Tier

| Tier | Skill Practice per Session | Total Skill Time per Week |
|---|---|---|
| Beginner | 10 min (daily HS) + 5-10 min (session skill) | 90-120 min |
| Intermediate | 15-25 min per session | 100-150 min |
| Advanced | 20-30 min per session | 120-180 min |

## How to Structure a Skill Practice Block

**For balance skills (handstand):**
- Perform 10-20 quality attempts per session
- Each attempt: kick up, hold as long as possible with good form, bail safely
- When form breaks: stop the attempt, rest, reset
- Track: best hold time, number of attempts, consistency

**For strength-skills (planche, front lever, back lever):**
- Use Prilepin table: 3-6 sets at 60-70% of max hold
- Full rest between sets (3-5 min)
- One working progression + one supplementary dynamic exercise
- Track: total hold time per session, max single hold

**For dynamic skills (muscle-ups):**
- Keep sets of 3-5 reps maximum
- Stop when rep quality degrades
- Rest 2-3 min between sets
- Track: total clean reps, rep quality

---

# 7. SUPPORTING STRENGTH EXERCISES BY SKILL

## Handstand Supporting Exercises

| Exercise | Purpose | Sets x Reps | When |
|---|---|---|---|
| Pike push-ups (elevated feet) | Overhead pressing strength | 3-4 x 5-8 | All tiers |
| Wall handstand push-ups | Direct HSPU strength | 3-4 x 3-8 | Intermediate+ |
| Deficit HSPU (on parallettes) | Extended ROM pressing | 3 x 3-5 | Advanced |
| Overhead press (DB or barbell) | General pressing power | 3 x 8-12 | All tiers |
| YTW raises (band or light weight) | Shoulder stability | 2 x 10-12 | All tiers |

## Planche Supporting Exercises

| Exercise | Purpose | Sets x Reps | When |
|---|---|---|---|
| Pseudo planche push-ups | Straight-arm pushing strength | 3-5 x 3-8 | All tiers |
| Planche leans (on floor or parallettes) | Shoulder loading in planche position | 3-5 x 10-30s | All tiers |
| Scapular protraction push-ups | Protraction strength (critical for planche) | 3 x 10-15 | All tiers |
| Weighted dips | General pushing power | 3-4 x 5-8 | Intermediate+ |
| Ring turned-out support hold | Ring stability for ring planche | 3 x 15-30s | Advanced |

## Front Lever Supporting Exercises

| Exercise | Purpose | Sets x Reps | When |
|---|---|---|---|
| Weighted pull-ups | Raw pulling strength (strongest predictor) | 4 x 3-8 | Intermediate+ |
| Front lever rows (at easier progression) | Dynamic front lever strength | 3-4 x 4-8 | Intermediate+ |
| Straight-arm pulldowns | Straight-arm lat engagement | 3 x 10-12 | All tiers |
| Dragon flags | Core anti-extension (mimics FL demands) | 3 x 5-8 | Intermediate+ |
| Active dead hang + scap retraction | Scapular positioning for lever | 3 x 10-15 | All tiers |

## Back Lever Supporting Exercises

| Exercise | Purpose | Sets x Reps | When |
|---|---|---|---|
| Skin the cats (controlled) | Shoulder extension conditioning | 3 x 5-10 | All tiers |
| German hang holds | Shoulder extension flexibility | 3 x 20-30s | All tiers |
| Weighted pull-ups | General pulling strength | 3-4 x 5-8 | Intermediate+ |
| Ring rows (supinated) | Horizontal pulling endurance | 3 x 8-12 | All tiers |
| Preacher curls (light) | Biceps tendon conditioning | 2 x 12-15 | Intermediate+ |

## Muscle-Up Supporting Exercises

| Exercise | Purpose | Sets x Reps | When |
|---|---|---|---|
| Chest-to-bar pull-ups | Pulling height (most critical) | 3-5 x 5-8 | Intermediate+ |
| Straight bar dips | Pressing phase of muscle-up | 3-4 x 8-12 | All tiers |
| High pull-ups (explosive) | Explosive pulling power | 3-4 x 3-5 | Intermediate+ |
| Russian push-ups (elbow-to-hand transitions) | Transition speed | 3 x 5-8 | Intermediate+ |
| False grip hang | Grip for ring muscle-ups | 3 x 15-30s | Ring MU prep |

## Human Flag Supporting Exercises

| Exercise | Purpose | Sets x Reps | When |
|---|---|---|---|
| Side plank (each side) | Lateral core strength | 3 x 30-60s | All tiers |
| Archer pull-ups | Asymmetric pulling | 3 x 5-8/side | Intermediate+ |
| Single-arm hang | Grip + oblique engagement | 3 x 15-30s/side | Intermediate+ |
| Dragon flags | Anti-rotation core strength | 3 x 5-8 | Intermediate+ |
| Lateral raises (heavy) | Lateral deltoid strength | 3 x 8-12 | All tiers |

---

# 8. WARM-UP PROTOCOL

## General Warm-Up (every session, 5 min)
Light cardio 60-90s -> arm circles 15/direction -> hip circles 10/direction -> leg swings 10/leg -> jumping jacks or jump rope 30s

## Skill-Specific Warm-Up (5-10 min, depends on session)

### Push Skill Day (Handstand, Planche, L-sit)
1. Wrist circles: 15/direction
2. Wrist rocks forward/backward: 10 reps + 10s hold each
3. Wrist loading on floor (weight on hands, lean gently): 30s
4. Shoulder dislocates with band: 10-15 reps
5. Scapular push-ups: 10-15 reps (protraction + retraction)
6. Cat-cow: 10 reps
7. Hollow body hold: 3 x 15s
8. If Extended warm-up: + shoulder CARs (5/direction), chest doorway stretch (30s/side), thoracic spine rotation (10/side)

### Pull Skill Day (Front Lever, Back Lever, Muscle-Up)
1. Band pull-aparts: 2 x 15
2. Active hang: 30-45s
3. Scapular pulls (dead hang -> retract scaps): 2 x 8-10
4. Cat-cow: 10 reps
5. Arch body hold: 3 x 15s
6. Skin the cat (partial ROM as warm-up): 3-5 reps
7. If Extended warm-up: + lat stretch 30s/side, thoracic extension on foam roller 60s, wrist flexor stretch 30s

## Wrist Conditioning Protocol (non-negotiable for all skill athletes)

Perform before every session that involves hands on the floor.

| Exercise | Duration | Purpose |
|---|---|---|
| Wrist circles (both directions) | 30s total | Joint lubrication |
| Wrist rocks forward (fingers forward) | 10 reps + 10s hold | Wrist extension flexibility |
| Wrist rocks backward (fingers toward you) | 10 reps + 10s hold | Wrist flexion flexibility |
| Fist rotations on floor | 10 reps | Wrist capsule mobility |
| Weight bearing on palms (graduated lean) | 20-30s | Progressive loading |

---

# 9. COOLDOWN PROTOCOL

Arnold automatically programs the right cooldown for the day's skill focus:

| After Push Skill Day | After Pull Skill Day |
|---|---|
| Wrist flexor stretch 30s/side | Dead hang 60-90s |
| Wrist extensor stretch 30s/side | Lat stretch 30s/side |
| Chest doorway stretch 30s/side | Bicep wall stretch 30s/side |
| Tricep stretch 30s/side | Forearm stretch 30s |
| Full wrist flexibility routine (3 min) | Active hang + scap CARs (2 min) |
| Pike stretch progression (2 min) | Thoracic foam roll (2 min) |
| Shoulder CARs 5/direction | German hang (if comfortable) 30-60s |
| Bridge progression holds (60-90s) | Pike stretch progression (2 min) |

---

# 10. REST PERIOD REFERENCE

| Context | Rest Period | Reasoning |
|---|---|---|
| Balance skill attempts (handstand) | 60-180s (1-3 min) | Neural, not muscular -- shorter rest OK |
| Strength-skill holds (planche, front lever) | 180-300s (3-5 min) | Full CNS recovery for maximal efforts |
| Dynamic skill reps (muscle-ups) | 120-180s (2-3 min) | Explosive power recovery |
| Supporting strength (3-5 reps heavy) | 180-240s (3-4 min) | Strength-focused rest |
| Supporting strength (8-12 reps hypertrophy) | 60-120s (1-2 min) | Hypertrophy-focused rest |
| Accessory / prehab exercises | 45-90s | Low demand, short rest |
| Between different skill types | 120-180s | Mental + physical transition |

---

# 11. KEY NUMBERS FOR THE PLAN GENERATOR

## Weekly Volume Targets (Sets Per Movement Pattern)

| Tier | Push (vertical + horizontal) | Pull (vertical + horizontal) | Core / Compression | Skill Practice Sessions |
|---|---|---|---|---|
| Beginner | 9-12 | 9-12 | 6-9 | 7 (daily HS) + 3 (session skills) |
| Intermediate -- Hypertrophy | 14-18 | 14-18 | 6-9 | 4-5 skill sessions |
| Intermediate -- Strength | 10-14 | 10-14 | 6-9 | 4-5 skill sessions |
| Advanced -- Hypertrophy | 16-20 | 16-20 | 6-9 | 5-6 skill sessions |
| Advanced -- Strength | 12-16 | 12-16 | 6-9 | 5-6 skill sessions |
| Advanced -- Peak | 6-10 | 6-10 | 4-6 | 5-6 skill sessions (max attempts) |
| Deload (all) | 6-8 | 6-8 | 3-4 | Daily HS only, easy progressions |

## Exercise Count Per Session (excluding warm-up/cooldown)

| Tier | Skill Exercises | Strength Exercises | Accessories | Total |
|---|---|---|---|---|
| Beginner | 1-2 | 2-3 | 2 | 5-7 |
| Intermediate | 2 | 2-3 | 2-3 | 6-8 |
| Advanced | 2-3 | 2 | 1-2 | 5-7 |

## Session Duration Estimates

| Tier | Session Duration (including warm-up/cooldown) |
|---|---|
| Beginner | 40-50 min (session) + 10 min (daily HS) |
| Intermediate | 60-75 min |
| Advanced | 70-90 min |

---

# 12. PLAN GENERATOR RULES

## Non-negotiable rules for Skill Builder programs

1. Skills ALWAYS come first in the session, after warm-up -- never after heavy strength work
2. Maximum 2 skills per session (3 only on dedicated skill days for Advanced)
3. Never program skill practice to failure -- working sets at 60-70% of max hold time
4. Wrist warm-up is mandatory before any session involving hands on the floor
5. Balance skills (handstand) can be practiced daily; strength-skills need 48-72h between sessions
6. Deload weeks at prescribed positions -- never skipped
7. Incompatible skill pairs never in the same session (planche + HSPU, front lever + heavy pulls)
8. Every strength exercise must support a target skill -- no "general fitness" exercises in Intermediate/Advanced
9. Minimum 3 sets per exercise (except prehab = 2)
10. Rest periods for strength-skills are 3-5 minutes -- never shorter

## Generator Inputs

- Tier (Beginner / Intermediate / Advanced)
- Assessment data (max hold times per progression, pull-up/dip max reps)
- Target skills (2-3 selected during onboarding from: handstand, planche, front lever, back lever, muscle-up, L-sit/V-sit, human flag)
- Schedule (3/4/5 days, preferred days)
- (Warm-up and cooldown are auto-generated per session type — no user input needed)

## Generator Outputs (per session)

- Warm-up exercises (from Section 8, session-type-specific)
- Skill practice block (1-2 skills with sets x hold time, from progression trees)
- Strength exercises (supporting the target skills, from Section 7)
- Accessory / prehab exercises
- Cooldown exercises (from Section 9)
- All exercises tagged with difficulty intent
- Skill holds tagged with target hold time (from Prilepin table)

---

# APPENDIX: EXPECTED SKILL TIMELINES

| Skill | Beginner to First Hold | First Hold to Solid (10s+) | Solid to Advanced | Notes |
|---|---|---|---|---|
| Freestanding handstand | 2-4 months | 4-8 months to 30s | 6-12 months to 60s | Daily practice required |
| Tuck planche | 1-3 months | 3-6 months to 15s | 6-12 months to adv. tuck | Wrist prep critical |
| Straddle planche | -- | -- | 1-3 years from tuck | Largest gap in calisthenics |
| Tuck front lever | 1-4 weeks | 1-3 months to 15s | 3-6 months to adv. tuck | Weighted pulls accelerate this |
| Full front lever | -- | -- | 6-24 months from tuck | 50-80% BW added pull-up predicts this |
| Full back lever | 2-4 months from skin the cat | 4-8 months | 6-12 months | Easier than front lever |
| First strict muscle-up | 3-6 months from prerequisites | 6-12 months to 3x5 | 12+ months to slow/weighted | Chest-to-bar is the gate |
| Full L-sit | 1-2 months | 2-4 months to 30s | 6-12 months to V-sit | Hip flexor cramping is normal |
| Human flag | 3-6 months from foundations | 6-12 months | 12-18 months | Side plank 60s is entry gate |

---

*End of Skill Builder Program Bible v1.0*

*Sources: Overcoming Gravity 2nd Ed. (Steven Low), Beyond Bodyweight (Refael Paz),
FitnessFAQs programs (Daniel Vadnal), Branscheidt et al. 2019 (eLife/Johns Hopkins),
Czyz et al. 2024 (Scientific Reports), r/bodyweightfitness community,
Berg Movement, School of Calisthenics, GMB Fitness, Calisthenic Movement.*
