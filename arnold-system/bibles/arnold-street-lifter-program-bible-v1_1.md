**ARNOLD**

STREET LIFTER PROGRAM BIBLE

*The Complete Programming Spec for Weighted Calisthenics*

Version 1.1  |  April 2026

Sources: King of Weighted (KOW), Mathew Zlat, StrengthLog, Soviet Streetlifting Blueprint,

Grgic 2018, Williams 2017, Baz-Valle 2022, Travis 2020, real coach programming data.

# 1. Tier Selection Logic

How the user lands in a program tier based on their onboarding choice.

| **Onboarding Path** | **Condition** | **Assigned Tier** |
| --- | --- | --- |
| Starting from scratch | No assessment | Beginner |
| Assessment | < 10 pull-ups OR < 12 dips | Beginner |
| Assessment | >= 10 pull-ups AND >= 12 dips | Intermediate |
| I know my weights | Inputs any working weights | Intermediate |
| I know my weights | Added >= 50% BW pull-up OR >= 80% BW dip | Advanced |
| Auto-promotion | Completed Beginner + hits prerequisites | -> Intermediate |
| Auto-promotion | Completed 2+ Int. cycles + hits thresholds | -> Advanced |

## Tier Prerequisites

| **Tier** | **Pull-ups** | **Dips** | **Training History** | **Equipment** |
| --- | --- | --- | --- | --- |
| Beginner | 0-9 strict | 0-11 strict | None required | Pull-up bar, parallel bars |
| Intermediate | 10+ | 12+ | 3+ months BW training | + Dip belt, plates (1.25kg) |
| Advanced | 10+ with +50% BW | 12+ with +80% BW | 12+ months weighted | + Fractional plates (0.5kg), squat setup |

# 2. Exercise Variation System

A real coach does not just program "weighted dips." They program paused dips, double pause dips, tempo dips, deficit dips -- each targeting a specific weakness. The variation IS the programming tool.

## Pull-up / Chin-up Variations

| **Variation** | **Code** | **Description** | **Purpose** |
| --- | --- | --- | --- |
| Clean / Standard | clean | Full ROM, dead hang to chin over bar | Baseline strength |
| Paused (top) | paused_top | 2-3s hold with chin over bar | Top-end strength, TUT |
| Deadstop | deadstop | Full dead hang 1-2s between reps | Starting strength, no momentum |
| Negative | negative | Pull to top, lower over 4-6s | Eccentric strength, tendon loading |
| Half rep (top) | half_top | Partial ROM -- chin over bar to 90 degrees | Sticking point work |
| Tempo | tempo_Xs | Controlled eccentric (X = seconds) | Time under tension, hypertrophy |
| With band | banded | Resistance band adds load at top | Accommodating resistance |
| Isometric hold | iso_hold | Dead hang with weight, hold for time | Grip endurance, lat engagement |

## Dip Variations

| **Variation** | **Code** | **Description** | **Purpose** |
| --- | --- | --- | --- |
| Clean / Standard | clean | Full ROM, shoulders below elbows, lockout | Baseline strength |
| Paused (bottom) | paused_bottom | 2-3s hold at deepest position | Bottom-end strength |
| Double pause | double_pause | Pause at bottom 2s + pause at lockout 2s | Full ROM strength, no momentum |
| Tempo | tempo_Xs | Controlled eccentric (X seconds) | Time under tension, hypertrophy |
| Deficit | deficit | Extended ROM on parallettes | Bottom-end strength, flexibility |
| With band (neck) | banded_neck | Band around neck adds load | Accommodating resistance |
| Ring dips | rings | Performed on gymnastic rings | Stability, shoulder recruitment |

## Variation Cycling Schedule

Within each 4-week phase, back-off variations rotate weekly. Top sets stay consistent for tracking overload.

| **Week** | **Dip Back-Off Variation** | **Pull-Up Back-Off Variation** |
| --- | --- | --- |
| 1 | double_pause 3x5 | paused_top 3s, 3x3 |
| 2 | tempo_4s 3x6 | deadstop 3x4 |
| 3 | paused_bottom 3x5 | half_top 3x4 + negative 3x6 |
| 4 | banded_neck 3x8 or clean volume | clean 3x7 (max volume) |

# 3. Beginner Program

**Duration:** 8-12 weeks (repeatable until prerequisites met)

**Frequency:** 3 days/week (minimum 48h between sessions)

**Split:** Full Body A/B/C rotation

**Progression:** Double progression within 5-8 rep range

**Deload:** Every 4th week

No added weight until the user can do 10 strict pull-ups and 12 strict dips consistently. Connective tissue adapts roughly 50% slower than muscle -- rushing to weight causes injuries.

## Session A -- Pull Emphasis

| **Block** | **Exercise** | **Sets x Reps** | **Rest** | **Intent** |
| --- | --- | --- | --- | --- |
| Warm-Up | General activation (5 min) | -- | -- | -- |
| Warm-Up | Band pull-aparts + Dead hang + Scap pulls | 2x15 / 2x20s / 2x8 | 30s | Easy |
| Main | Pull-ups (or current progression) | 3 x 5-8 | 180s | Challenging |
| Volume | Australian rows | 3 x 8-12 | 90s | Moderate |
| Complementary | Dips (or current push progression) | 3 x 5-8 | 120s | Moderate |
| Accessory | Hanging knee raises | 3 x 10-15 | 60s | Easy |
| Accessory | Bodyweight squats / Split squats | 3 x 10-15 | 60s | Easy |
| Cooldown | Dead hang + stretch | 3 min | -- | -- |

## Session B -- Push Emphasis

| **Block** | **Exercise** | **Sets x Reps** | **Rest** | **Intent** |
| --- | --- | --- | --- | --- |
| Warm-Up | General + scap push-ups + band pull-aparts | -- | -- | -- |
| Main | Dips (or current progression) | 3 x 5-8 | 180s | Challenging |
| Volume | Push-ups (or current progression) | 3 x 8-12 | 90s | Moderate |
| Complementary | Pull-ups (or current progression) | 3 x 5-8 | 120s | Moderate |
| Accessory | Face pulls with band | 3 x 15 | 60s | Easy |
| Accessory | Hollow body hold | 3 x 20-30s | 60s | Easy |

## Session C -- Legs + Full Body

| **Block** | **Exercise** | **Sets x Reps** | **Rest** | **Intent** |
| --- | --- | --- | --- | --- |
| Warm-Up | General + BW squats 2x10 | -- | -- | -- |
| Main | Squat progression | 3 x 5-8 | 120s | Challenging |
| Volume | Lunges or step-ups | 3 x 10-12/leg | 90s | Moderate |
| Complementary | Pull-ups + Push-ups | 3 x 5-8 each | 90-120s | Moderate |
| Accessory | Calf raises | 2 x 15-20 | 45s | Easy |
| Accessory | Dead bugs | 3 x 10/side | 60s | Easy |

## Beginner Progression Rules

- Start at bottom of rep range (3 x 5)

- Add 1 rep per session until all sets hit 3 x 8

- Advance to next progression in tree, reset to 3 x 5

- Stuck 3 sessions at same reps --> deload week (2 x 5), then retry

- Transition to Intermediate when: 3x10 pull-ups + 3x12 dips for 2 sessions

### First Weight Addition Protocol

- Pull-ups: +2.5kg, reset to 3 x 5

- Dips: +5kg, reset to 3 x 5

# 4. Intermediate Program

**Duration:** 12-week mesocycle (repeatable)

**Frequency:** 3-4 days/week

**Split:** Push/Pull/Push+Pull (3 days) or Upper/Lower (4 days)

**Periodization:** Undulating with variation cycling on back-offs

## Phase Structure

| **Weeks** | **Phase** | **Top Set Target** | **Back-Off Style** | **Volume** |
| --- | --- | --- | --- | --- |
| 1-4 | Accumulation | 1x6 @RPE 7-8 | 3-4 x 6-8, variation cycling | High |
| 5 | Deload | 2x6 @RPE 5 | 2x8 light | Low |
| 6-9 | Strength | 1x3-4 @RPE 8-9 | 3 x 4-6, variation cycling | Moderate |
| 10 | Deload | 2x5 @RPE 5 | 2x6 light | Low |
| 11 | Peaking | Heavy single @RPE 9 | 2x3 @85% | Low |
| 12 | Test | 1RM protocol | Light back-offs only | Minimal |

## Day 1 -- Heavy Dips

| **Block** | **Exercise** | **Sets x Reps** | **Rest** | **Notes** |
| --- | --- | --- | --- | --- |
| Ramp-Up | Dips +10kg x 10 | 1 | 90s | Light -- technique, blood flow |
| Ramp-Up | Dips +20kg x 6 | 1 | 90s | Building |
| Ramp-Up | Dips +30kg x 5 | 1 | 120s | Approaching working weight |
| Ramp-Up | Dips +40kg x 3 | 1 | 150s | Final ramp |
| Top Sets | Dips -- heavy working weight | 3-4 x 3-4 | 240-300s | Per phase -- overload target |
| Back-Offs | Dips -- variation (rotating) | 3 x 5-7 | 120-180s | double_pause / tempo / paused / banded |
| Finisher | Dips -- moderate, max(-2) | 1 x max(-2) | -- | Fatigue gauge |
| Accessory | Weighted push-ups | 3-4 x 10 | 60s | Horizontal push volume |

## Day 2 -- Heavy Pull-ups

| **Block** | **Exercise** | **Sets x Reps** | **Rest** | **Notes** |
| --- | --- | --- | --- | --- |
| Ramp-Up | Pull-ups +10kg x 6 | 1 | 90s | Light |
| Ramp-Up | Pull-ups +15kg x 4 | 1 | 90s | Building |
| Ramp-Up | Pull-ups +20kg x 3 | 1 | 120s | Approaching working weight |
| Top Sets | Pull-ups -- heavy | 3-4 x 2-3 | 240-300s | Primary overload |
| Variation | Pull-ups -- paused or half reps | 3 x 3-5 | 180s | Sticking point work |
| Volume | Pull-ups -- clean, lighter | 3 x 6-8 | 120s | Volume accumulation |
| Isometric | Dead hang + weight | 1-2 x 15-30s | 60s | Grip + lat endurance |
| Accessory | Lat pulldowns or rows | 3 x 8-10 | 90s | Horizontal pull balance |

## Day 3 -- Peak Singles + Secondary Pull

| **Block** | **Exercise** | **Sets x Reps** | **Rest** | **Notes** |
| --- | --- | --- | --- | --- |
| Ramp-Up | Dips ascending to near-max | 4-5 ramp sets | 90-180s | Full pyramid |
| Peak | Dips -- heaviest, paused singles | 3-4 x 1 | 300s | Weekly max expression |
| Working | Chin-ups -- moderate weight | 4 x 4-5 deadstop | 120s | Pull frequency |
| Volume | Chin-ups -- lighter | 3 x 5-7 | 90s | Clean volume |

## Autoregulated Top Set Progression

| **Last Session Performance** | **Next Session Adjustment** |
| --- | --- |
| All reps clean, RPE felt lower than target | +2.5kg |
| All reps clean, at target RPE | +1.25kg |
| All reps clean, RPE higher than target | No change -- consolidate |
| Missed 1 rep on last set | No change -- retry |
| Missed 2+ reps or RPE 10 | -2.5kg, rebuild |

## Isometric Hold Progression

| **Weeks** | **Weight** | **Hold Time** |
| --- | --- | --- |
| 1-2 | +35kg | 15s |
| 3-4 | +35kg | 20s |
| 5 | Deload | -- |
| 6-8 | +35kg | 25s |
| 9-10 | +37.5kg (add weight, reset time) | 15s |
| 11-12 | +37.5kg | 20s |

## Max(-2) Finisher

Performed at a consistent moderate weight (roughly 40-50% of top set). User does max reps but stops 2 short of failure. Track reps over weeks -- if trending up, fitness is improving. If trending down, fatigue is accumulating and may need deload. Arnold uses this as a silent adaptation signal.

# 5. Advanced Program

**Duration:** 12-week mesocycle

**Frequency:** 3-5 days/week

**Split:** Push/Pull/Push+Pull (3d), Upper/Lower (4d), or PPL+UL (5d)

**Periodization:** Block (Accumulation -> Transmutation -> Realization -> Test)

## Phase Structure

| **Weeks** | **Phase** | **Top Set** | **Intensity** | **RIR** | **Volume** |
| --- | --- | --- | --- | --- | --- |
| 1-4 | Accumulation | 4 x 6-10 | 65-78% | 3-4 | High |
| 5 | Deload | 2 x 6 | 55-60% | 5+ | Low |
| 6-9 | Transmutation | 4-5 x 3-5 | 78-88% | 2-3 | Moderate |
| 10 | Deload/Taper | 2 x 3 | 70-75% | 4+ | Low |
| 11 | Realization | 3-5 x 1-2 | 88-97% | 0-1 | Very low |
| 12 | Test Week | Singles | 95-102% | 0 | Minimal |

## Accumulation Variation Cycling (Weeks 1-4)

| **Week** | **Dip Back-Offs** | **Pull-Up Back-Offs** | **Finisher** |
| --- | --- | --- | --- |
| 1 | double_pause 3x5 @65% | paused_top 3s, 3x3 | max(-2) @50% |
| 2 | tempo_4s 3x6 @60% | deadstop 3x4 | max(-2) @50% |
| 3 | banded_neck 3x8 @55% | negative 3x6 | max(-2) @52% |
| 4 | paused_bottom 4x5 @65% | half_top 3x4 + clean 3x7 | max(-2) @52% |

## Transmutation Variation Cycling (Weeks 6-9)

| **Week** | **Dip Back-Offs** | **Pull-Up Back-Offs** | **Finisher** |
| --- | --- | --- | --- |
| 6 | double_pause 3x4 @72% | paused_top 2s, 3x3 | max(-2) @55% |
| 7 | tempo_3s 3x5 @68% | deadstop 3x3 | max(-2) @55% |
| 8 | paused_bottom 3x4 @73% | half_top 3x3 + negative 3x4 | max(-2) @57% |
| 9 | clean 3x5 @75% | clean 3x5 (straight volume) | max(-2) @57% |

## Competition Peaking Taper

| **Timeline** | **Volume** | **Intensity** | **What Changes** |
| --- | --- | --- | --- |
| 4 weeks out | 100% | 80-85% | Normal training |
| 3 weeks out | 85% | 85-90% | Cut accessories to 1 set each |
| 2 weeks out | 65% | 90-95% (singles) | Main lifts + openers only |
| 1 week out | 40% | Light openers 70-80% | Practice comp setup |
| 3-4 days out | 0% | Complete rest | Sleep, hydrate, mental prep |

## 1RM Test Protocol

- BW x 5 (60s rest)

- 50% e1RM x 3 (90s rest)

- 70% x 2 (120s rest)

- 82% x 1 (180s rest)

- 90% x 1 (240s rest)

- 95% x 1 (300s rest)

- 100-102% x 1 -- 1RM attempt (300s rest)

- If successful: +2.5kg attempt

- Max 3 attempts above 95%

## e1RM Calculation

Epley formula: e1RM = weight x (1 + reps/30)

- Pull-ups: total load = added weight + (bodyweight x 0.65)

- Dips: total load = added weight + (bodyweight x 0.70)

- Squats: total load = barbell weight (standard)

# 6. Rest Period Reference

| **Context** | **Rest Period** |
| --- | --- |
| Peak singles (RPE 9+) | 300s (5 min) |
| Top sets (3-5 reps, RPE 8-9) | 240-300s (4-5 min) |
| Back-off / variation sets | 120-180s (2-3 min) |
| Volume sets (6-10 reps) | 90-120s |
| Accessories | 45-90s |
| Ramp-up sets (ascending) | 60-150s (increases with weight) |
| Between different exercises | 120-180s |
| 1RM attempts (above 90%) | 300s+ |
| Isometric holds | 60s |
| Max(-2) finisher | End of session -- no rest after |

# 7. Warm-Up Protocol

## General Warm-Up (every session, 5 minutes)

- Light cardio: jumping jacks or jump rope (60-90s)

- Arm circles forward + backward (15 each direction)

- Wrist circles (10 each direction)

- Hip circles (10 each direction)

- Leg swings front-to-back (10/leg)

- Shoulder dislocates with band (10 reps)

## Specific Warm-Up by Session Type

| **Session** | **Warm-Up Exercises** |
| --- | --- |
| Pull Day | Band pull-aparts 2x15, Scap pulls 2x8, Dead hang 1x20-30s, Lat stretch 30s/side, Thoracic extension 60s |
| Push Day | Scap push-ups 2x10, Band pull-aparts 2x15, Wrist stretch 30s, Shoulder CARs 5/direction, Chest doorway stretch 30s/side |
| Leg Day | BW squats 2x10, Hip circles 10/dir, Lateral leg swings 10/leg, Deep squat hold 60s, Hip flexor stretch 30s/side |

## Ramp-Up Sets (Intermediate + Advanced)

Graduated loading sets that prepare the CNS for heavy work. NOT warm-up sets.

| **Set** | **Weight** | **Reps** | **Rest After** |
| --- | --- | --- | --- |
| 1 | ~20% of working weight | 8-10 | 90s |
| 2 | ~40% of working weight | 5-6 | 90s |
| 3 | ~60% of working weight | 3-4 | 120s |
| 4 (Adv. only) | ~75% of working weight | 1-2 | 180s |
| --> | Working sets at 100% | Per program | 240-300s |

# 8. Cooldown Protocol

Arnold automatically programs the right cooldown for the day's training:

| **Pull Day** | **Push Day** | **Leg Day** |
| --- | --- | --- |
| Dead hang 60-90s | Chest doorway stretch 30s/side | Quad stretch 30s/side |
| Lat stretch 30s/side | Tricep stretch 30s/side | Hamstring stretch 30s/side |
| Bicep wall stretch 30s/side | Overhead lat stretch 30s/side | Hip flexor stretch 30s/side |
| Forearm stretch 30s | Wrist flexor stretch 30s | Calf stretch 30s/side |
| Thoracic foam roll 60s | Shoulder sleeper stretch 60s/side | Pigeon pose 60s/side |
| Prayer stretch 30s | Shoulder CARs 5/direction | Deep squat hold 90s |

# 9. Weekly Volume Targets

Sets per movement pattern per week. Based on systematic reviews (Baz-Valle 2022, Schoenfeld).

| **Tier / Phase** | **Pull** | **Push** | **Legs** | **Core** |
| --- | --- | --- | --- | --- |
| Beginner | 9-12 | 9-12 | 6-9 | 6-9 |
| Intermediate -- Accumulation | 16-20 | 16-20 | 10-14 | 6-9 |
| Intermediate -- Strength | 12-16 | 12-16 | 8-12 | 6-9 |
| Advanced -- Accumulation | 18-22 | 18-22 | 12-16 | 6-9 |
| Advanced -- Transmutation | 14-18 | 14-18 | 10-14 | 6-9 |
| Advanced -- Realization | 8-12 | 8-12 | 6-10 | 4-6 |
| Deload (all tiers) | 6-8 | 6-8 | 4-6 | 3-4 |

## Exercise Count Per Session (excluding warm-up/cooldown)

| **Tier** | **Main** | **Back-Off/Var.** | **Volume** | **Accessories** | **Finisher** | **Total** |
| --- | --- | --- | --- | --- | --- | --- |
| Beginner | 2 | 0 | 1-2 | 2 | 0 | 5-6 |
| Intermediate | 2 | 1 | 1 | 2-3 | 1 | 6-8 |
| Advanced | 2 | 1-2 | 1-2 | 2-3 | 1 | 7-9 |

## Session Duration Estimates

| **Tier** | **Duration (including warm-up + cooldown)** |
| --- | --- |
| Beginner | 40-50 minutes |
| Intermediate | 60-75 minutes |
| Advanced | 75-95 minutes |

# 10. Exercise Database

## Main Lifts

| **Exercise** | **Available Variations** |
| --- | --- |
| Weighted Pull-ups | clean, paused_top, deadstop, negative, half_top, tempo, banded, iso_hold |
| Weighted Chin-ups | clean, paused_top, deadstop, negative |
| Weighted Dips | clean, paused_bottom, double_pause, tempo, deficit, banded_neck, rings |
| Barbell Back Squat | clean, paused_bottom, tempo, pin, front |
| Weighted Muscle-up | clean (advanced only) |

## Accessory Exercises

| **Exercise** | **Targets** | **Priority** |
| --- | --- | --- |
| Face pulls (band) | Rear delts, rotator cuff | High |
| Band external rotations | Rotator cuff | High |
| Romanian deadlift | Hamstrings, posterior chain | High |
| Hanging leg raises | Core, hip flexors | High |
| Bicep curls | Biceps, elbow health | Medium |
| Tricep extensions | Triceps, lockout strength | Medium |
| Lateral raises | Side delts | Medium |
| Lat pulldowns | Lats (machine variation) | Medium |
| Nordic curls | Hamstrings | Medium |
| Hollow body hold | Core, anti-extension | Medium |
| Weighted push-ups | Push volume | Medium |
| Dead hang (weighted) | Grip, decompression | Medium |
| Calf raises | Calves | Low |
| Grip work (plate pinch) | Forearms | Low |

# 11. Plan Generator Rules

Non-negotiable rules the generator must follow when building Street Lifter programs.

- No exercise fewer than 3 sets (except accessories = 2 minimum, finisher = 1)

- Ramp-up sets always precede main lifts (Intermediate + Advanced)

- Back-off variation changes every week within a phase

- No two consecutive training days without 48h rest (Beginner) or 24h rest (Int/Adv)

- Deload weeks at prescribed positions -- never skipped

- Pull-ups and heavy dips never on consecutive days without 48h gap

- Isometric holds progress independently (time first, then weight)

- Max(-2) finisher always at end of push-heavy sessions

- Peak singles (Day 3 pattern) only in Intermediate/Advanced

- Weekly volume stays within targets defined in Section 9

## Generator Inputs

- Tier (Beginner / Intermediate / Advanced)

- Assessment data or self-reported maxes

- Bodyweight (for e1RM calculation)

- Schedule (3/4/5 days, preferred days)

- (Warm-up and cooldown are auto-generated per session type — no user input needed)

## Generator Outputs (per session)

- Warm-up exercises (from Section 7)

- Ramp-up sets (calculated from working weight)

- Main exercises with sets x reps x weight x rest x variation code

- Back-off sets with variation cycling

- Finisher (max(-2) at specified weight)

- Accessories (from exercise database)

- Cooldown exercises (from Section 8)

- All exercises tagged with difficulty intent

*-- End of Street Lifter Program Bible v1.1 --*