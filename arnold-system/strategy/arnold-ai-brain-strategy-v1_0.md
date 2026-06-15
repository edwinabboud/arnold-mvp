# ARNOLD AI BRAIN STRATEGY

## The Intelligence Architecture Behind the Coach

Version 1.0 | April 2026 | WORKING DOCUMENT

---

# 1. VISION

Arnold is not an app with AI features. Arnold is a **domain-specific calisthenics coaching AI** that lives inside an app.

The program generation, the adaptation, the coaching knowledge, the conversation — these are not separate systems. They are one unified intelligence that:

- Generates world-class, personalized training programs from deep coaching knowledge
- Continuously adapts those programs based on the user's real training data
- Surfaces that intelligence through a world-class coach persona when the user engages
- Operates subtly — users go to the gym to train, not to talk to an AI

**The north star:** Arnold should know what a world-class calisthenics coach would know, reason the way they reason, and communicate the way they communicate. The user should never need to think about whether Arnold's programming is correct. It just is.

**What Arnold replaces:** A €200-400/month human coach who designs your program, adjusts it weekly based on your sessions, manages injuries, pushes you when you're sandbagging, and restructures the plan when things go off-track.

---

# 2. CORE PRINCIPLES

**Principle 1 — The AI is the product.** The app is just the interface. If the AI's programming decisions are wrong, nothing else matters. Getting the coaching intelligence right is more important than any UI feature.

**Principle 2 — Subtle over loud.** People train, not talk. Arnold's intelligence should be felt through the quality of the program, the accuracy of the weights, and the precision of the adaptations — not through constant interaction. When the user does engage, Arnold shines.

**Principle 3 — Arnold proposes, user approves.** Arnold is a world-class coach who happens to know your numbers. He makes recommendations with confidence, but the user always has the final say. Adaptations are surfaced when the user opens chat — never forced, never intrusive.

**Principle 4 — Knowledge before inference.** Arnold should know the answer from sports science and coaching methodology, not guess it from patterns. Fine-tuning and learned behavior come later — the foundation is curated, expert-level knowledge.

**Principle 5 — Deterministic when possible, intelligent when necessary.** If a decision can be made with a lookup table (autoregulation: missed 2+ reps → -2.5kg), it stays deterministic. The LLM is reserved for judgment calls that require weighing multiple factors (plateau detection, injury pattern recognition, plan restructuring).

---

# 3. ARCHITECTURE OVERVIEW

Arnold's brain has three layers. Each layer has a clear job and a clear boundary.

```
┌─────────────────────────────────────────────────────┐
│                  LAYER C: VOICE                     │
│         How Arnold communicates decisions            │
│     Conversation Agent + Coaching Persona            │
├─────────────────────────────────────────────────────┤
│                LAYER B: DECISIONS                   │
│           What Arnold decides to do                  │
│   Rules Engine (deterministic) + LLM (judgment)      │
│   Autoregulation + Silent Adaptation + Restructuring │
├─────────────────────────────────────────────────────┤
│              LAYER A: KNOWLEDGE                     │
│          What Arnold knows about coaching             │
│  Program Bibles + Exercise Science + Biomechanics    │
│  Periodization + Injury Management + User History    │
└─────────────────────────────────────────────────────┘
```

Data flows bottom-up: Knowledge informs Decisions, Decisions are communicated through Voice. User data flows top-down: interactions feed back into the Knowledge layer (user history), which updates the Decision layer.

---

# 4. LAYER A — THE KNOWLEDGE ENGINE

## 4.1 What Arnold Needs to Know

Arnold's knowledge spans six domains. Each domain has a depth target for MVP and a future target.

| Domain | MVP Depth | Future Depth |
|---|---|---|
| **Periodization & Programming** | Program bibles (Street Lifter, Skill Builder, Hybrid) — phase structures, volume targets, set/rep schemes, variation cycling | Full periodization theory: DUP, block, conjugate, linear. Auto-select periodization model based on user profile |
| **Exercise Science** | 44 exercises with form cues, muscles, mistakes, breathing. Exercise roles (main/volume/complementary/accessory/skill) | 100+ exercises. Biomechanical analysis per exercise. Force curves, joint angles, muscle activation patterns |
| **Autoregulation & Load Management** | Autoregulation tables from program bibles. e1RM calculation. Phase-based intensity zones. RPE interpretation | Fatigue modeling (fitness-fatigue model). HRV integration. Readiness scoring. Volume landmarks (MV/MEV/MAV/MRV per muscle group) |
| **Injury & Prehab** | Pain thresholds (1-10 scale). Exercise swaps by body area. Basic prehab movements per pattern. "See a physio" recommendations | Injury risk prediction from movement patterns. Rehab protocols by injury type. Return-to-training timelines. Contraindicated movements per condition |
| **Skill Acquisition** | Progression trees (5 trees, 8-9 levels each). Prilepin table for isometric holds. Skill-to-strength synergy mapping | Motor learning principles. Specificity vs. variability. Skill transfer coefficients. Neurological adaptation timelines |
| **Nutrition & Recovery** | Basic guidance: protein targets, meal timing, sleep importance. Light touch — "I'm a training coach, not a nutritionist" | Caloric needs by training phase. Recovery optimization. Supplement evidence base. Hydration protocols |

## 4.2 Knowledge Base Structure (MVP)

The knowledge base is **structured JSON files** bundled in the app. Not a vector DB — not yet. The orchestration layer selects the right knowledge snippets based on the user's path, tier, phase, and current context.

```
src/knowledge/
├── periodization/
│   ├── streetLifter.json        # Phase structures, intensity zones, volume targets
│   ├── skillBuilder.json        # Prilepin tables, skill practice guidelines
│   ├── hybridAthlete.json       # Synergy rules, structure selection, specialization
│   └── principles.json          # Universal: progressive overload, SRA curve, supercompensation
├── exercises/
│   ├── library.json             # All exercises: form cues, muscles, mistakes, roles
│   ├── variations.json          # Back-off variations, when to use each, cycling patterns
│   ├── warmups.json             # Session-type-specific warm-up protocols
│   └── cooldowns.json           # Session-type-specific cooldown protocols
├── autoregulation/
│   ├── weightProgression.json   # RPE-based load adjustment tables
│   ├── volumeAdjustment.json    # When to add/remove sets based on recovery signals
│   └── deloadTriggers.json      # When to pull forward a deload
├── injury/
│   ├── painProtocols.json       # Response by severity, body area, and recurrence
│   ├── exerciseSwaps.json       # Safe alternatives by body area and movement pattern
│   └── prehab.json              # Prehab movements by risk area
└── coaching/
    ├── phaseGuidance.json       # What to tell users in each phase (accumulation, strength, etc.)
    ├── plateauPatterns.json     # How to detect and respond to plateaus by type
    └── milestones.json          # Streak thresholds, PR celebrations, phase transitions
```

## 4.3 How Knowledge Gets Into Agent Calls

The orchestration layer (api.ts) builds a **context packet** for every agent call. The context packet includes:

1. **User state** — path, tier, phase, week, day type, current exercise, target weights
2. **Recent history** — last 3-5 sessions: sets completed, RPE reported, exercises skipped, pain flags
3. **Relevant knowledge** — selected based on what the agent needs for this specific interaction

Example: User opens chat during a Street Lifter intermediate accumulation session, week 2, after completing heavy dip working sets.

```json
{
  "user": {
    "path": "street_lifter",
    "tier": "intermediate",
    "phase": "accumulation",
    "week": 2,
    "dayType": "heavy_dips",
    "bodyweightKg": 70,
    "e1rm": { "dip": 132.5, "pullup": 97.8, "squat": null }
  },
  "currentSession": {
    "exercisesCompleted": ["ramp_dips", "working_dips"],
    "nextExercise": "backoff_dips_tempo_4s",
    "targetWeight": "+25kg",
    "setsRemaining": 3,
    "repTarget": 6
  },
  "recentHistory": {
    "lastSessionRPE": 7,
    "trendDirection": "progressing",
    "painFlags": [],
    "setsCompletedRate": 1.0,
    "finisherTrend": [12, 14, 15]
  },
  "knowledge": {
    "currentVariation": "Tempo 4s dips — 3x6 @60%. Eccentric control emphasis. Week 2 of accumulation variation cycling.",
    "nextWeekVariation": "Paused bottom — 3x5 @65%. Strengthening bottom position.",
    "phaseGuidance": "Accumulation: building work capacity. RPE 7-8 on top sets. Volume is high, intensity moderate. Users should feel worked but not destroyed.",
    "autoregulation": "All reps clean + RPE below target → +2.5kg next session. All reps clean + at target RPE → +1.25kg."
  }
}
```

This is what makes Arnold feel like "YOUR coach" — every response is grounded in specific knowledge about what the user is doing, why, and what comes next.

## 4.4 Knowledge Evolution Path

```
MVP (now)          → Structured JSON, manually curated from program bibles
                     + sports science fundamentals

Post-MVP (3-6 mo)  → RAG with curated corpus: peer-reviewed papers,
                     coaching textbooks, validated protocols.
                     Vector DB replaces JSON for flexible retrieval.

Scale (6-12 mo)    → Fine-tuning on real coaching data:
                     - Programs designed by verified coaches
                     - Adaptation decisions with outcomes
                     - Coaching conversations rated by athletes
                     This is when Arnold starts developing coaching
                     "judgment" beyond what's in the knowledge base.
```

Fine-tuning prerequisites (what we need before it's viable):
- 500+ complete mesocycles with outcome data (did the user progress?)
- 1000+ adaptation decisions with before/after (did the change work?)
- Coaching conversation ratings from real users
- Expert review of Arnold's current decisions to identify gaps

---

# 5. LAYER B — THE DECISION ENGINE

## 5.1 Decision Types

Every decision Arnold makes falls into one of two categories:

**Deterministic decisions** (rules engine — no LLM, no cost, instant):
- Weight progression: autoregulation table lookup
- Progression gates: did user complete 2-3 sessions clean? → advance
- Pain response: severity → action mapping
- Difficulty interpretation: exercise intent + user feedback → response type
- Phase transitions: week number → phase
- Variation cycling: week within phase → which back-off variation
- Deload triggers: scheduled deload weeks
- Silent adaptation: behavioral signals → advance/regress/hold

**Judgment decisions** (LLM — costs money, takes time, adds value):
- Plateau analysis: "Is this a real plateau or normal fluctuation?"
- Injury pattern recognition: "Recurring shoulder flag — is this overuse or technique?"
- Plan restructuring: "PR failed — what's the weak link and how do we address it?"
- Goal recalibration: "User's target is unrealistic given progress rate — how to communicate?"
- Coaching tone: "User is frustrated — is this productive frustration or demotivation?"
- Cross-pattern analysis (Hybrid): "Pulling strength is fine but front lever stalled — what's the bottleneck?"

## 5.2 The Autoregulation Loop

This is the most important feedback system in Arnold. It makes the plan feel alive.

```
Session completed
       │
       ▼
┌──────────────────┐
│ Collect signals   │ ← Sets completed, reps logged, RPE (if reported),
│                   │   exercises skipped, rest patterns, session duration
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Apply rules       │ ← Autoregulation table (deterministic)
│                   │   All reps clean + RPE < target → +2.5kg
│                   │   Missed 2+ reps → -2.5kg
│                   │   etc.
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Queue adaptations │ ← Store pending changes for next session
│                   │   Weight adjustments, progression advances,
│                   │   volume modifications
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ Surface to user   │ ← When user opens chat, Arnold mentions:
│                   │   "Bumped your dip weight to +27.5kg. Last session
│                   │   was clean at RPE 7 — you've got more."
│                   │   User can approve or override.
└──────────────────┘
```

**If the user never opens chat:** Adaptations still apply. The program still updates. Arnold mentions the changes next time the user does open chat. The app works without the chat.

**If the user opens chat:** Arnold proactively surfaces queued adaptations. "Made a couple changes since last session. Your dip working weight is up to +27.5kg — last session was smooth. Also moved your pull-up back-offs to deadstop this week." The user can tap "Sounds good" or ask questions.

## 5.3 The Restructuring System

Restructuring is different from session-to-session adaptation. It's a significant change to the plan triggered by:

| Trigger | What happens | Decision type |
|---|---|---|
| Failed PR attempt | Analyze weak link, add targeted work for 2-3 weeks, reschedule PR | LLM judgment |
| Extended absence (1+ weeks) | Regress progressions based on absence length, potentially restart current phase | Deterministic (rules) + LLM (how much regression) |
| Injury (severity 6+) | Remove affected exercises, substitute alternatives, add prehab, shift PRs | Deterministic (immediate) + LLM (plan redesign) |
| Path switch | Generate new mesocycle for new path, carry over progression levels | Deterministic (new generator) |
| User request via chat | "I want to focus more on pull-ups" / "Add front lever to my goals" | LLM interprets → rules engine adjusts |
| Fatigue accumulation detected | Pull forward deload, reduce volume for 1-2 weeks | Deterministic (finisher trend analysis) |
| Plateau detected (3+ weeks no progress) | Path-specific response: Street Lifter → increase volume at lower weight. Skill Builder → increase supporting strength. Hybrid → check synergy mapping | LLM analysis + deterministic adjustment |

## 5.4 What the Plan Generator Should Be

Current state: 6 TypeScript generators produce mesocycles deterministically. They work but are rigid — they can't reason about edge cases, can't restructure intelligently, and embed coaching knowledge in hardcoded logic rather than pulling from the knowledge base.

**Target architecture:**

```
TypeScript generators (keep)     →  Structure + skeleton
  Phase durations, session splits,
  exercise slot assignments,
  variation cycling patterns

Knowledge engine (new)           →  Content + calibration
  Exact weights from e1RM + phase,
  exercise selection from progressions,
  volume targets from bible tables,
  warm-up/cooldown from session type

LLM plan generator (new)        →  Judgment + restructuring
  Only fires for: failed PR response,
  plateau restructuring, goal changes,
  injury replanning, path switches
  with complex carryover
```

The TypeScript generators stay as the fast, free, reliable skeleton builders. The knowledge engine fills them with accurate content. The LLM only fires when the situation requires genuine coaching judgment — which is rare (maybe 1-2 times per mesocycle).

---

# 6. LAYER C — THE VOICE

## 6.1 Arnold's Persona

Arnold is a world-class calisthenics coach who happens to know your numbers. Not a friend, not an assistant, not a chatbot. A coach.

**What this means in practice:**
- He has opinions and states them directly
- He doesn't hedge ("maybe consider trying...")
- He references your specific data, not generic advice
- He pushes back when your feedback contradicts your data (skeptical trust)
- He reassures when frustration is misplaced (deload weeks, expected difficulty)
- He never gives empty praise
- He coaches the program, not the moment — every response considers the bigger picture

**The relationship:** You hired a coach. He designed your program. He knows exactly what you did last session and what's coming next. When you talk to him, he already has context. You don't need to explain yourself.

## 6.2 Context-Rich Responses

The current conversation agent receives minimal context. The target is for every response to demonstrate specific knowledge:

**Current (generic):**
> "Good work on that set. Keep pushing."

**Target (context-rich):**
> "Clean set at +25kg. That's your third session at this weight with all reps completed. Bumping to +27.5kg next session. Tempo back-offs are next — 3x6 with a 4-second eccentric. Control the descent."

The difference is the knowledge engine feeding real data into the prompt. Arnold doesn't need to be told to be specific — he needs to HAVE specific data to reference.

## 6.3 When Arnold Speaks

Arnold only speaks when the user initiates. But when he does, he has things to say:

| User opens chat... | Arnold says... |
|---|---|
| Before a session starts | "Today's heavy dips. Working at +25kg, 3x4. Tempo back-offs after at +15kg. Warm-up's ready — shoulder dislocates and scap push-ups first." |
| Mid-session, after a set | Depends on what happened. Clean set → quick confirmation. Struggled → checks difficulty intent. Pain → triggers pain protocol. |
| After session ends | "Session logged. All sets clean, RPE looked right. Your finisher reps went up again — 15 this week vs 14 last week. Fitness is building. I bumped next session's working weight to +27.5kg." |
| Between sessions | "Two changes since last time. Pull-up working weight → +13.75kg (rounded to +15kg for plates). Also swapped your back-off to deadstop this week — that's the variation cycle." |
| With a question | Answers from the knowledge base with path-specific context. Not generic advice. |

## 6.4 Adaptation Surfacing

When Arnold has queued adaptations from the autoregulation loop, he surfaces them naturally in conversation — not as system notifications.

**Pattern:**
1. User opens chat
2. Arnold checks for pending adaptations
3. If adaptations exist, Arnold mentions them first: "Made a change — [what changed and why in one sentence]."
4. User can acknowledge ("Sounds good"), override ("Keep the weight the same"), or ask ("Why?")
5. If user doesn't open chat, adaptations apply silently. Arnold mentions them next time.

**This is not silent adaptation.** Silent adaptation is the deterministic rules engine adjusting progressions based on behavioral signals (all sets completed → advance). What we're describing here is the communication layer: Arnold tells you what changed when you ask. The changes themselves can happen silently; the explanation waits for you.

---

# 7. THE FOUR AGENTS (REDESIGNED)

## 7.1 Agent Roles

| Agent | When it fires | Input | Output | Cost |
|---|---|---|---|---|
| **Conversation Agent** | Every chat interaction | User message + context packet (user state, recent history, knowledge snippets, pending adaptations, rules decisions) | Coaching response in Arnold's voice + tappable options | ~$0.01-0.03/call |
| **Session Adapter** | Mid-session: pain reported, exercise swap requested, user says "too easy/hard" | Current session state + rules engine decision + exercise knowledge + injury protocols | Modified session plan (swap exercises, adjust weights, restructure remaining session) | ~$0.02-0.04/call |
| **Progress Analyst** | Post-session (only when user engaged chat) + weekly summary | Full session log + last 5 sessions + mesocycle state + progression levels | Findings (trends, plateaus, flags) + proposed plan changes | ~$0.02-0.04/call |
| **Plan Restructurer** (renamed from Plan Generator) | Failed PR, injury restructure, path switch, goal change, plateau intervention | Current mesocycle + trigger event + knowledge base context + user history | Modified mesocycle sections (affected weeks only, not full regeneration) | ~$0.05-0.10/call |

## 7.2 Agent Prompt Architecture

Each agent prompt has four sections:

1. **Identity** — Who you are, what you do, what you don't do
2. **Knowledge injection point** — `{{KNOWLEDGE_CONTEXT}}` placeholder filled by orchestration
3. **Decision rules** — How to handle each scenario type
4. **Output format** — Strict JSON schema

The knowledge injection point is critical. This is where the orchestration layer inserts path-specific, phase-specific, user-specific coaching knowledge from the knowledge engine. The agent prompt itself is static; the knowledge context is dynamic.

## 7.3 Quick Response Bypass (Keep & Expand)

~80% of interactions skip the LLM entirely. This stays. Expand it to cover:
- Set completion confirmations (already built)
- Rest timer starts (already built)
- Session end (already built)
- Simple acknowledgments ("Got it", "Sounds good", "Back to training")
- Adaptation approvals ("OK" on a queued change)
- Exercise info requests (pull from knowledge base directly, no LLM)

Only route to the LLM when:
- Free-text user input that isn't a known action
- Pain reports (need contextual response)
- Complex feedback ("Let me explain")
- Questions that require coaching judgment
- Plan change proposals that need explanation

## 7.4 Cost Model

Target: **under €1.50/user/month** for an active user (4 sessions/week, moderate chat engagement).

| Component | Cost per event | Events/month | Monthly cost |
|---|---|---|---|
| Quick bypass | €0 | ~60 | €0 |
| Conversation agent | €0.02 | ~12 | €0.24 |
| Session adapter | €0.03 | ~2 | €0.06 |
| Progress analyst | €0.03 | ~8 | €0.24 |
| Plan restructurer | €0.08 | ~0.5 | €0.04 |
| **Total** | | | **~€0.58** |

At €15/month subscription: 3.9% of revenue on AI. At €30/month: 1.9%. Both are healthy.

---

# 8. THE MAGICAL DAY 1

## 8.1 What Makes It Feel Magical

The user picks a path, enters benchmarks, and Arnold generates a program. That's the current flow. Here's what makes it magical:

1. **The program is immediately specific.** Not "pull-ups 3x8" but "Weighted pull-ups +12.5kg, 3x6. Working at 78% of your estimated max. Accumulation phase — building your base for the next 3 weeks."

2. **Arnold already talks like he knows you.** First chat interaction: "You're starting at +25kg dips for 7 reps — that puts your estimated 1RM around 31kg added. Solid base. We're building volume for 3 weeks, then pushing intensity. Your pull-ups are proportionally behind your dips — I've weighted the pull sessions slightly heavier to close that gap."

3. **The warm-up is specific to the session.** Not a generic warm-up. Push day = shoulder dislocates, scap push-ups, wrist warm-up, light dips at bodyweight.

4. **Every exercise has a reason.** The exercise detail explains why this specific movement is in the plan for this specific user: "Tempo dips at 4-second eccentric — this is your back-off variation for week 2 of accumulation. Builds eccentric control at the bottom, which is where your sticking point will be when we start peaking."

## 8.2 What Makes It Possible

The magical day 1 is entirely a knowledge engine problem. The benchmarks + path selection give Arnold enough data to:
- Calculate e1RMs for all primary lifts
- Place the user on the correct progression level
- Select the right phase intensity percentages
- Generate specific coaching notes per exercise
- Identify imbalances (dips ahead of pull-ups → emphasize pulling)

No LLM is needed for any of this. It's structured knowledge + math. The LLM only enters when the user opens chat and Arnold wraps this data in coaching language.

## 8.3 Self-Correction in First 2-3 Sessions

Even with accurate benchmarks, the first program won't be perfect. Arnold self-corrects:

- Session 1: User completes all dip sets easily, RPE 5-6. → Autoregulation: +2.5kg next session.
- Session 2: User struggles on pull-up back-offs, misses 2 reps. → Autoregulation: keep weight, retry.
- Session 3: Pull-ups clean. Dips at new weight, all clean. → Confirmed: benchmarks were slightly conservative on dips, accurate on pull-ups.

By session 3-4, the program is dialed in. This happens automatically through the autoregulation loop — no user interaction required.

---

# 9. DATA COLLECTION STRATEGY

## 9.1 What We Collect (From Day 1)

Every user session generates data that feeds back into Arnold's intelligence:

| Data point | Source | Used for |
|---|---|---|
| Sets completed vs prescribed | Session logging | Autoregulation, progression gates |
| RPE per exercise (when reported) | Chat interaction | Load adjustment, fatigue monitoring |
| Exercises skipped | Session logging | Silent adaptation (pain? dislike? equipment?) |
| Rest time between sets | Session timing | Recovery capacity estimation |
| Session duration | Session timing | Volume tolerance estimation |
| Pain reports (body area, severity) | Chat interaction | Injury tracking, exercise swaps, prehab |
| Chat messages (free text) | Chat logging | Coaching quality eval, future fine-tuning data |
| Finisher reps (max-2 set) | Session logging | Fitness trend indicator |
| Adaptation decisions + outcomes | Decision logging | Did the change work? (future fine-tuning) |
| Progression level changes | Progression tracking | Rate of advancement per exercise |

## 9.2 What This Enables Later

With 500+ users generating 3-5 sessions/week for 3+ months:

- **Population-level benchmarks:** "Users with your profile (70kg, intermediate, 12 months training) typically add +15-20kg to their weighted pull-up in the first mesocycle"
- **Adaptation effectiveness scoring:** "When Arnold increased volume after a plateau, it resolved 73% of the time within 2 weeks"
- **Fine-tuning training data:** Real coaching decisions with real outcomes
- **Injury prediction:** "Users who skip shoulder warm-ups 3+ times report shoulder discomfort within 2 weeks at 4x the base rate"

## 9.3 Privacy and Data Ethics

- All training data is stored per-user in Supabase with RLS
- Aggregate analytics are anonymized
- Users can export all their data
- Users can delete all their data
- Fine-tuning uses anonymized, aggregated data only
- No data sharing with third parties

---

# 10. BUILD PHASES

## Phase 1: Knowledge Engine + Weight Calibration (Weeks 1-2)

**Goal:** Arnold's programming decisions are accurate and grounded in real coaching knowledge.

**Deliverables:**
1. Distill program bibles into structured JSON knowledge base (src/knowledge/)
2. Fix weight engine calibration (3 known issues from handoff):
   - Ramp-ups based on added weight, not total load
   - Phase intensity percentages matched to program bible tables
   - Day-type awareness (peak singles get peaking intensity regardless of phase)
3. Build context packet builder — selects relevant knowledge snippets based on user state
4. Test weights against real coach comparison data (70kg user, intermediate Street Lifter)

**Validation:** Arnold's prescribed weights match within ±2.5kg of what a real coach would prescribe for the comparison user.

## Phase 2: Autoregulation Loop (Weeks 2-3)

**Goal:** The program adapts session-to-session based on real performance data.

**Deliverables:**
1. Session logging captures: sets completed, reps achieved, RPE (optional), exercises skipped
2. Autoregulation engine applies rules tables after every session
3. Weight adjustments queued for next session
4. Progression advances/holds/regressions triggered from behavioral signals
5. Pending adaptations stored for Arnold to surface in chat

**Validation:** Complete 3 simulated sessions. Verify weights adjust correctly per the autoregulation table. Verify progression advances after 3 clean sessions.

## Phase 3: Context-Rich Agent Prompts (Weeks 3-4)

**Goal:** Arnold talks like YOUR coach — specific, knowledgeable, contextual.

**Deliverables:**
1. Rewrite conversation agent prompt with knowledge injection points
2. Rewrite session adapter prompt with exercise knowledge + injury protocols
3. Build orchestration layer that assembles context packets from knowledge base + user state
4. Update quick response bypass to handle adaptation approvals
5. Test against 10-15 coaching scenarios (eval dataset)

**Validation:** Blind test — show Arnold's responses alongside a real coach's responses for the same scenarios. Arnold should be indistinguishable or preferred 60%+ of the time.

## Phase 4: Plan Restructurer (Weeks 4-5)

**Goal:** Arnold can restructure the plan when things go off-track.

**Deliverables:**
1. Build plan restructurer agent (replaces old plan generator prompt)
2. Handle: failed PR → analyze + restructure
3. Handle: injury → swap + prehab + shift PRs
4. Handle: plateau detected → path-specific intervention
5. Handle: goal change → adjust exercise selection + volume distribution
6. Restructured plan sections replace affected weeks in the mesocycle

**Validation:** Test each restructuring trigger against expected coaching behavior from the program bibles.

## Phase 5: Progress Analyst Integration (Weeks 5-6)

**Goal:** Close the loop — progress analysis feeds back into the plan.

**Deliverables:**
1. Rewrite progress analyst prompt with knowledge base context
2. Wire analyst findings into the adaptation queue
3. Trend detection: finisher rep trends, RPE trends, completion rates
4. Fatigue detection: when to pull forward a deload
5. Plateau detection: 3+ weeks without progression → trigger restructuring

**Validation:** Simulate a 12-week mesocycle with realistic data. Verify the progress analyst correctly identifies plateaus, fatigue, and progression opportunities.

---

# 11. RELATIONSHIP TO EXISTING SPEC

This document extends the product spec (v2.1), specifically Sections 8 (Coaching Intelligence Engine), 9 (Decision Logic Framework), 11 (Adaptive Programming), and 15 (Technical Architecture).

**What this document adds:**
- Concrete knowledge base architecture (the spec describes what Arnold knows conceptually; this describes how it's stored and accessed)
- Context packet design (the spec describes what agents receive; this specifies the exact data structure)
- Autoregulation loop design (the spec describes the rules; this describes the feedback system)
- Adaptation surfacing UX (the spec says "silent adaptation"; this adds "propose and approve" pattern via chat)
- Build phases with validation criteria
- Cost model
- Data collection strategy for future fine-tuning

**What this document changes from the spec:**
- Adaptation surfacing: The spec says fully silent adaptation. This strategy adds a "propose and approve" pattern — adaptations happen automatically but Arnold surfaces them in chat when the user engages. This is an additive change, not a contradiction. The app still works without the chat.
- Plan Generator Agent: The spec describes the plan generator as an LLM agent. This strategy keeps TypeScript generators for initial plan creation and reserves the LLM for restructuring only. More reliable, cheaper, faster.

**These changes should be reviewed and merged back into the product spec if approved.**

---

# 12. OPEN QUESTIONS

1. **How much of the program bibles should be in the knowledge base vs. hardcoded in generators?** The generators currently embed coaching logic (variation cycling, phase structures). Should this move to the knowledge base so the LLM can reason about it?

2. **Should Arnold explain adaptations proactively or only when asked?** Current proposal: proactive in chat when opened. Alternative: only explain if the user asks "why did my weight change?"

3. **Skill Builder knowledge gap:** The program bible is less detailed than Street Lifter. Should we invest in deepening Skill Builder coaching knowledge before building the knowledge engine, or build with what we have and iterate?

4. **Hybrid Athlete synergy mapping:** The spec describes synergy between weighted lifts and skills (pull-ups support front lever). Should this be in the knowledge base as explicit mappings, or should the LLM infer synergies?

5. **How to source "world-class coaching knowledge":** Options: (a) study published programs from top coaches (FitnessFAQs, Saturno Movement, Daniel Vadnal), (b) hire a sports scientist to review and expand the program bibles, (c) partner with competitive calisthenics coaches for validation.

6. **Fine-tuning timeline:** When do we have enough data to start? Estimated: 6-12 months after launch with 500+ active users. Should we start collecting and labeling data from day 1?

---

*This is a living document. It will be updated as we build and learn. The architecture described here is the target — the build phases describe how we get there incrementally.*

*End of Arnold AI Brain Strategy v1.0*
