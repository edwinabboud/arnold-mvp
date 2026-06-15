# ARNOLD

## MVP Builder Instructions

*Everything the builder page needs to write code. Nothing more.*

Version 2.1 | April 2026

# 1. What this document is

This is the instruction set for the builder page. The builder takes these instructions and writes actual code. This page changes when the spec changes. The builder executes.

**The app in one sentence:** An AI calisthenics coaching app that’s simple enough to just open and train — tap Done between sets, close the app — but has a coaching brain sitting in the corner that knows your entire program and adapts it when you talk to him.

The builder page should read this document top to bottom before writing any code. Every architectural decision, UI pattern, and feature priority is documented here. If something contradicts what the builder assumes, this document wins.

# 2. UX Philosophy — Read This First

**Simple enough to just train, deep enough to coach you.**

This is the single most important design principle in the app. Every feature, every screen, every interaction must follow it. Arnold is one app. There are no modes, no toggles, no complexity settings, no “pro mode.” The experience is simple — you open it, you train, you close it. That’s it.

But Arnold (the coach) is always sitting in the corner of the screen. If you ever want to talk to him — about an injury, a plateau, your goals, why today felt weird, whatever — you tap and he’s right there. He already knows your program, your history, and what you just did. You talk, he adapts. Then you go back to training.

**What this means for the builder:**

- A user who never touches the chat must still get a fully functional, adapting training experience. The app works without the chat.

- A user who talks to Arnold regularly gets a richer coaching experience — but it’s the same app. Nothing unlocks. Nothing changes. They just use more of what’s already there.

- The chat is never forced, never prompted by the app, never interrupts the workout. It sits in the corner. The user initiates.

- Post-session feedback is optional. The session ends when the user finishes their last exercise (or skips the cooldown). If they tap the chat, Arnold checks in. If they don’t, the session just ends and is logged.

- Warm-ups and cooldowns are always present by default but easy to skip in one tap. No chat interaction required.

- The program adapts silently from behavioral data even without explicit feedback.

- When Arnold adapts the plan between sessions (weight changes, progression advances, exercise swaps), those changes apply automatically. But when the user opens chat, Arnold mentions what changed first — before the user asks. This is not a notification, not a pop-up, not a card on the home screen. It's Arnold being a coach: "Bumped your dip weight to +27.5kg. Last session was clean." The user taps "Sounds good" or asks why. If they never open chat, the adaptations still apply.

**The simplicity test:** Can a user who never touches the chat still benefit from this feature? **The depth test:** When a user does engage the chat, does Arnold respond with full context and intelligence? If either answer is no, the feature needs rethinking.

# 3. What changed in v2.1

**Changes from v2.0 that affect code:**

- **AI Brain Strategy added.** New companion document (arnold-ai-brain-strategy-v1_0.md) defines the three-layer AI architecture: Knowledge (structured JSON coaching data), Decisions (rules engine + LLM judgment), Voice (conversation agent). All AI work follows this strategy.

- **Knowledge Engine replaces bundled JSON.** The old "RAG Knowledge Base" (Layer 2) is replaced with a structured knowledge engine — organized JSON files in `src/knowledge/` covering periodization, exercises, autoregulation, injury, and coaching guidance. Distilled from program bibles. Injected into agent calls as context packets.

- **Autoregulation loop added.** Session-to-session weight adjustments are now deterministic (autoregulation table lookup). After every session: collect signals → apply rules → queue adaptations → apply to next session. No LLM cost.

- **Adaptation surfacing via chat.** When the user opens chat, Arnold proactively mentions pending adaptations from the autoregulation loop. User can approve or override. Not a notification — it's Arnold coaching.

- **Plan Generator Agent renamed to Plan Restructurer.** TypeScript generators handle initial plan creation (kept). LLM agent only fires for mid-cycle changes requiring judgment: failed PRs, plateaus, injury replanning, goal changes.

- **Context packets replace minimal context.** Agent calls now receive full context packets: user state, recent history, relevant knowledge snippets, pending adaptations. This is what makes Arnold feel personalized.

- **New files to create:** `src/knowledge/**/*.json` (knowledge base), `src/engine/adaptationQueue.ts`, `src/engine/contextPacket.ts`

- **Agent prompts need knowledge injection points.** All agent prompts get a `{{KNOWLEDGE_CONTEXT}}` placeholder filled by the orchestration layer with path-specific, phase-specific coaching data.

# 3b. What changed in v2.0 (from v1.1)

**Major changes from v1.1 that affect code:**

- **Goal mixing is gone.** No more 60/30/10 volume distribution, no goal ranking. Replaced with 4 curated program paths.

- **4 program paths replace goals:** Street Lifter, Skill Builder, Hybrid Athlete, Endurance. Each has its own periodization, session structure, and exercise selection logic.

- **Mobility is gone as a standalone goal.** Built into warm-ups and cooldowns with Standard/Extended preferences.

- **Onboarding is simpler:** One tap to pick a path (with smart follow-up), schedule, warm-up/cooldown preferences, assessment.

- **Exercise selection is role-based:** Main (heavy compound), Volume, Complementary, Accessory, Skill — not tree offset.

- **12-week standardized mesocycles** with path-specific phase templates.

- **Evidence-based set/rep tables** by exercise role × training phase.

- **Weekly wave loading** — no two weeks identical within a phase.

- **Session formats for Endurance:** Circuit, AMRAP, EMOM, Timed Sets — different from the straight-sets model used by other paths.

- **Warm-up/cooldown preferences** (Standard vs Extended, Standard vs Deep stretch) as onboarding settings.

# 4. The four things that make the app

## 4.1 The Plan

User picks a program path (Street Lifter, Skill Builder, Hybrid Athlete, Endurance). Does an assessment week. AI generates a 12-week mesocycle using the path’s specific periodization template. The plan is a living document, not static.

**Program paths replace goal mixing:** Instead of blending goals with percentages, each path is a complete, expert-designed program. The Hybrid Athlete path handles the most popular combination (strength + skills) through synergy programming, not percentage splits.

**Assessment:** This is the user’s first coaching experience. After each assessment exercise, Arnold asks through the chat how it felt. If the user doesn’t engage the chat, behavioral data sets baselines.

**Difficulty intent tags:** Every exercise in the plan is tagged as challenging, moderate, or easy. This determines how Arnold interprets feedback.

**Cascading changes:** When Arnold proposes a plan change and the user approves, the change ripples forward through the entire mesocycle. Cascading logic is now path-aware (see Section 5 of the product spec).

**Silent adaptation:** The plan adapts without explicit feedback. Behavioral signals drive progression advances, regression flags, and volume recalibration.

## 4.2 The Workout Screen

Clean exercise cards with the current exercise highlighted, difficulty tag visible, sets/reps, rest timer, big DONE button. Coaching notes on each exercise card come from the exercise knowledge base.

**Exercise cards are organized by role:** Skill Practice → Heavy Compound → Volume → Complementary → Accessories. Each card shows its role label. The session structure varies by program path.

**Every exercise has a 3D viewer tap target.** Warm-up, main workout, and cooldown. The viewer is never forced (except for brand-new exercises) but always one tap away.

**Session flow:** User opens app → taps Start Session → warm-up exercises appear as cards (skippable in one tap) → main workout by role blocks → user taps DONE between sets → rest timer → app advances → cooldown exercises appear as cards (skippable in one tap to mark session complete) → if user taps chat, Arnold opens post-session check-in; if not, session just ends.

**Warm-ups are always included:** Session-dependent (push day = shoulder work, pull day = band pull-aparts) and recovery-aware. Standard or Extended based on user preference. Skippable in one tap.

**Cooldowns are always included:** Standard stretch or Deep stretch based on user preference. Skippable in one tap.

**Endurance sessions are different:** Circuit, AMRAP, EMOM, and Timed Set formats use different timer behavior than straight sets. The session screen needs to handle: circuit round tracking (exercises in sequence, minimal rest between), AMRAP countdown timer, EMOM per-minute timer. Build these as session format variants, not separate screens.

## 4.3 The Chat

*⚠ This is the core differentiator. Build it early (Week 3). Everything plugs into it.* *⚠ But remember: the app must work fully without the chat. The chat makes things better, not possible.*

A chat widget always accessible during and after sessions — but never forced. It sits in the corner. The user initiates all interactions. Interactive with tappable options AND free text. The chat knows the full context — program path, training history, current exercise, difficulty intent, training phase.

**Post-session feedback flow (optional):** Only triggers when user taps chat after session. If they close the app, the session is logged and the plan adapts silently.

**Mid-session coaching:** User can report pain, ask questions, request exercise swaps — but only if they choose to open the chat.

**Path switching:** Users can switch program paths through the chat at any time. Arnold asks why, confirms the new path, generates a new mesocycle. Progression levels carry over.

**Chat interaction model:** - Tappable options for structured questions - Free text always available alongside tappable options - Follow-up chains max 3 levels deep for quick feedback - Arnold can answer general fitness questions using the RAG knowledge base - Response time: under 1 second for option-based, under 3 seconds for AI-generated

## 4.4 The 3D Viewer

Available on every exercise. Tap target on every exercise card opens the 3D figure performing the current exercise with perfect form. Rotatable, zoomable. Primary muscles red, secondary orange. Below the figure: written breakdown.

*⚠ For MVP: the 3D model is deferred to Phase 2. The exercise detail view (form cues, muscles, mistakes in text) is a temporary stand-in. Build the tap target on every exercise card now.*

# 5. What’s already built

| **Component** | **What exists** | **Status** |
| --- | --- | --- |
| **Data models** | Full TypeScript types: user profile, goals, schedule, mesocycle, sessions, progressions, coaching engine I/O, exercise knowledge, streaks | ⚠ Needs update for program paths (replace goals with path selection) |
| **Progression trees** | Pull (9 levels), Push (9), Legs (8), Core (9), Skills (9). Each exercise has prerequisites, form cues, target muscles, common mistakes | Complete |
| **Rules engine** | Deterministic decision logic: pain handler, too-easy handler, can’t-finish handler, missed-time handler, progression gates | Complete |
| **Silent adaptation** | Behavioral signal processing for plan adjustments without chat feedback | Complete |
| **Agent prompts** | 4 specialized system prompts in src/engine/prompts/ | ⚠ Needs update for program paths |
| **State management** | Zustand store with persistence | ⚠ Needs update for program path and warm-up/cooldown preferences |
| **Session prototype** | Interactive JSX prototype: exercise cards, DONE button, rest timer, chat widget | Prototype only |
| **Theme system** | Dark UI with amber accent, coral for pain, teal for skills | Complete |

## 5.1 What’s NOT built yet

- **Plan generator rewrite** — 4 path-specific generators replacing the single generator with goal mixing

- **Exercise role selection** — Main/Volume/Complementary/Accessory/Skill role-based selection replacing tree offset

- **Weekly wave loading** — No two weeks identical within a phase

- **Endurance session formats** — Circuit, AMRAP, EMOM, Timed Sets (different timer behavior)

- **Warm-up/cooldown preference system** — Standard vs Extended, Standard vs Deep stretch

- **Path switching via chat** — New mesocycle generation when user changes path

- **Onboarding rebuild** — From multi-goal ranking to single path selection with smart follow-up

- Claude API streaming integration

- Interactive chat widget (full version with tappable options and context awareness)

- Exercise detail view (3D viewer stand-in)

- Progress dashboard

- React Native port to Expo

# 6. AI Architecture

Three layers, no fine-tuning (yet), no custom LLM. Claude API with structured prompts + deterministic code + structured knowledge base. See the AI Brain Strategy document for full architecture detail.

## 6.1 Layer 1: Rules Engine (deterministic, no AI)

Plain TypeScript. Handles pain logic, progression gates, difficulty feedback interpretation, silent adaptation triggers, and **autoregulation** (session-to-session weight adjustments). Already built (autoregulation in progress). Rules engine makes decisions; the LLM wraps them in Arnold's voice.

**Decision tables encoded:** Pain, too easy, can't finish, missed time, silent adaptation — all unchanged from v1.1. **New:** autoregulation table (weight progression based on last session performance — see Section 10.6).

## 6.2 Layer 2: Knowledge Engine

Structured JSON files in `src/knowledge/`, organized by domain. Distilled from program bibles + sports science. The orchestration layer selects relevant knowledge snippets based on user state and injects them into agent calls as **context packets**.

**Knowledge domains:**
- `periodization/` — per-path phase structures, intensity zones, volume targets, variation cycling patterns
- `exercises/` — full library with form cues, muscles, mistakes, roles, variations, warm-ups, cooldowns
- `autoregulation/` — weight progression tables, volume adjustment rules, deload triggers
- `injury/` — pain protocols by severity, exercise swaps by body area, prehab movements
- `coaching/` — phase-specific guidance, plateau response patterns, milestone messaging

**Evolution path:** Structured JSON (MVP) → RAG with vector DB (3-6 months post-launch) → Fine-tuning on real coaching data (6-12 months, requires 500+ active users).

## 6.3 Layer 3: Four Specialized Agents

All Claude API calls with specialized system prompts in `src/engine/prompts/`. Each prompt has a `{{KNOWLEDGE_CONTEXT}}` injection point filled by the orchestration layer.

| **Agent** | **Job** | **Status** |
| --- | --- | --- |
| **Conversation Agent** | Arnold's voice. Receives context packet (user state, history, knowledge, pending adaptations) + rules decision. Surfaces adaptations. Coaches in Arnold's persona. | Needs rewrite: must accept knowledge injection, reference specific user data, surface adaptations |
| **Session Adapter** | Modifies today's session mid-workout based on real-time feedback. Understands exercise roles, movement patterns, and weights. | Prompt solid. Needs: knowledge injection point, weight awareness |
| **Progress Analyst** | Post-session analysis. Trend detection, plateau identification, fatigue monitoring. Feeds findings into adaptation queue and Plan Restructurer. | Prompt solid. Needs: output wired to adaptation queue |
| **Plan Restructurer** (renamed from Plan Generator) | Fires for failed PRs, plateaus, injury replanning, goal changes. Modifies affected mesocycle sections only. | NEW prompt needed. Old Plan Generator is dead code. TypeScript generators handle initial plan creation. |

## 6.4 Layer 4: Orchestration

Router that decides which agent to call. Builds **context packets** for every agent call: user state (path, tier, phase, week, weights), recent history (last 3-5 sessions), relevant knowledge snippets (from knowledge engine), pending adaptations (from autoregulation queue). Quick response bypass for common actions (~80% skip the LLM). Cost target: under €1.50/user/month for active users.

## 6.5 The Autoregulation Loop

After every completed session, the autoregulation engine runs (deterministic, no LLM cost):

1. **Collect signals:** Sets completed, reps achieved, RPE (reported or inferred), exercises skipped, finisher reps
2. **Apply autoregulation rules:** Weight adjustments per the autoregulation table (see Section 10.6)
3. **Queue adaptations:** Store pending changes (weight adjustments, progression advances/regressions)
4. **Apply to next session:** Next session loads with updated weights and exercises
5. **Surface to user:** When user opens chat, Arnold mentions what changed (see Section 10.7)

## 6.6 The Adaptation Queue

New data structure (`src/engine/adaptationQueue.ts`) that stores pending adaptations between sessions. Adaptations apply automatically. User approval via chat is for communication, not gating — if the user never opens chat, changes still take effect.

# 7. Tech Stack

| **Layer** | **Technology** | **Why** |
| --- | --- | --- |
| **Mobile app** | React Native (Expo) | iOS-first with Android for free |
| **State management** | Zustand with persistence | Already set up |
| **AI backend** | Claude API (Sonnet) | 4 agents. Quick response bypass for cost control |
| **Knowledge engine** | Structured JSON in `src/knowledge/` (MVP), RAG with vector DB later | Coaching knowledge distilled from program bibles, injected into agent calls as context packets |
| **Backend/API** | Supabase or Firebase | Auth, user data, training history, plan state |
| **Experiment tracking** | Weights & Biases or MLflow | Prompt version tracking |

# 8. Design System

## 8.1 Visual language

**Theme:** Dark-first. Background #0A0A0B. Cards and surfaces use subtle white opacity layers (2–4%).

**Accent color:** Amber #F5A623 — Arnold’s signature.

**Pain/danger:** Coral #E63946.

**Skill acquisition:** Teal #2A9D8F.

**Typography:** System font stack (SF Pro on iOS). 13–16px body, 18–22px headings.

## 8.2 Key screen patterns

**Session screen:** Exercise cards stacked vertically, organized by role block (Skill Practice → Heavy Compound → Volume → Complementary → Accessories). Current exercise highlighted with amber border. Difficulty tag chip. Role label on each card. DONE button large, centered. Chat widget icon bottom-right — quiet. Warm-up section at start with “Skip warm-up” button. Cooldown at end with “Skip & finish” button.

**Onboarding:** Four program path cards on one screen. One tap selects. Smart follow-up question for Street Lifter and Skill Builder. Then schedule → warm-up/cooldown preferences → assessment intro. Fast — training within minutes.

**Chat:** Bottom sheet that slides up. Arnold’s messages on the left, user’s on the right. Tappable option buttons below Arnold’s messages. Free text input always visible. Only opens when user taps the chat icon.

# 9. What’s cut from MVP

- 3D exercise viewer (keep exercise knowledge via tap — Phase 2)

- Voice mode (Phase 2)

- Pain locator on 3D body (body-part chips in chat instead)

- Streak freeze mechanic

- Wearable integration

- Gym / holistic modes

- Proactive scheduling nudges

## 9.1 What’s NOT cut

- **Dynamic warm-ups:** Always included. Session-dependent and recovery-aware. Standard/Extended preference. Skippable.

- **Cooldowns:** Always included. Standard/Deep stretch preference. Skippable.

- **Exercise knowledge on every exercise:** Tap target for form cues, target muscles, common mistakes. Text-based in MVP, 3D viewer in Phase 2.

- **Post-session feedback as conversation:** Optional. Only when user taps chat.

- **Silent adaptation:** Program adapts from behavioral data without chat.

- **Interactive assessment:** Feels like coaching, not data entry. Falls back to behavioral data if user doesn’t engage chat.

- **Path switching:** Via chat, anytime. Progression levels carry over.

- **Evidence-based session structure:** Exercise roles, set/rep tables, weekly wave loading.

- **Skeptical trust:** Cross-reference user claims against training history.

# 10. Decision Logic Reference

## 10.1 Pain / Discomfort Reported

| **Pain Level** | **Immediate Action** | **Session Impact** | **Plan Impact** |
| --- | --- | --- | --- |
| **1–5 (mild)** | Continue. Log it. | No change. | Monitor next 2 sessions. |
| **6–7 (moderate)** | Reduce intensity. | May swap exercise. | Recommend physio. Track 1 week. |
| **8–10 (severe)** | Stop immediately. | Swap to alternative. | Restructure. Build rehab into plan. |

## 10.2 ‘That Felt Too Easy’

| **Training Phase** | **Action** |
| --- | --- |
| **Deload** | No change. Reassure. |
| **Push / intensity** | Progress to next variation or add volume. |
| **Assessment / test** | Recalibrate baseline upward. |

## 10.3 ‘I Couldn’t Finish My Sets’

| **Difficulty Tag** | **Action** |
| --- | --- |
| **Challenging** | Expected. Encourage. |
| **Moderate** | Evaluate: one-off or systematic? If repeated, regress. |
| **Easy** | Regress immediately. Recalibrate. Ripple forward. |

## 10.4 Missed Training Time

| **Context** | **Action** |
| --- | --- |
| **Active break** | Minor regression. Shift plan ~1 week. |
| **Inactive break** | Bigger regression. Mini re-test. Shift 2–3 weeks. |
| **Illness/injury** | Careful re-entry. May restructure significantly. |

## 10.5 Silent Adaptation

| **Behavioral Signal** | **Action** |
| --- | --- |
| **All sets completed, 2–3 sessions** | Progress per progression rules. |
| **Exercise repeatedly skipped** | Flag for review. May swap. |
| **Frequency drops below plan** | Recalibrate volume. Adjust timeline. |
| **Reps below target (moderate/easy)** | Evaluate trend. If persistent, regress. |
| **Never engages chat** | Continue silent adaptation. App works for this user. |

## 10.6 Autoregulation (Weight Progression)

Session-to-session weight adjustments. Deterministic — no LLM cost. Applied after every completed session.

| **Last Session Performance** | **Next Session Adjustment** |
| --- | --- |
| All reps clean, RPE below target | +2.5kg |
| All reps clean, at target RPE | +1.25kg |
| All reps clean, RPE above target | No change — consolidate |
| Missed 1 rep on last set | No change — retry |
| Missed 2+ reps or RPE 10 | -2.5kg, rebuild |

**RPE source hierarchy:** (1) User-reported via chat, (2) inferred from behavioral signals (completion rate, rest patterns, finisher trends), (3) phase-default targets.

**Finisher trend:** Max(-2) finisher reps trending up = fitness building. Trending down = fatigue accumulating → consider pulling deload forward.

**Plate rounding:** All adjustments round to nearest 1.25kg. Below 2.5kg total added = 0 (not worth a plate).

## 10.7 Adaptation Surfacing

When autoregulation or silent adaptation makes changes between sessions, those changes are queued and surfaced when the user opens chat.

**Pattern:** Arnold states what changed and why in one sentence, before responding to whatever the user asked.

**User response options:** "Sounds good" / "Why?" / "Keep it the same"

If "Keep it the same" → Arnold reverts and notes the override. If user never opens chat → adaptations apply silently.

# 11. Progression Rules

**Advance when:** User completes all prescribed sets and reps for 2–3 consecutive sessions. Triggered by explicit feedback or behavioral data (silent adaptation).

**Regress when:** Consistent failure on moderate/easy exercises, or pain above 6/10. Can be triggered silently.

**Hold when:** Completing sets at high difficulty on a challenging-tagged exercise. Working as intended.

# 12. Competitive Context

**The Movement Athlete (TMA):** Closest competitor. Gaps: no coaching chat, no weighted calisthenics, no cascading plan changes, demands constant feedback but doesn’t use it well.

**Calisteniapp:** 2M downloads. Gap: no adaptive AI.

**Freeletics:** 60M+ users. Gap: HIIT-focused, not calisthenics skill trees.

**Human coaches:** €200–400/month.

Arnold’s competitive advantages: (1) coaching chat with full program context, (2) cascading plan adaptation, (3) phase-aware responses, (4) curated expert program paths including Hybrid path for all-rounders, (5) weighted calisthenics support, (6) works without forced feedback.

# 13. Success Criteria

**Functional:** Full loop from onboarding to 4+ weeks of adapted training. Works for BOTH user types: chat engager and “just train” user. Works across all 4 program paths.

**Simplicity:** First-time user completes first session without confusion, without needing chat, without configuration beyond path selection and schedule.

**Emotional:** Talking to Arnold feels like talking to a coach, not operating an app. For non-chat users, the app feels effortless.

**Commercial:** 10–20 early access users actively training and providing feedback. Charge as soon as users get value.

**Performance:** Chat < 1s for quick actions, < 3s for AI coaching. Session screen 60fps.

# 14. After the MVP

If the MVP validates (users retain past week 4 and are willing to pay), Phase 2 activates:

- Voice mode

- 3D exercise viewer (replaces text-based exercise detail view)

- Pain locator on 3D body

- Gym / hypertrophy mode (new program path)

- Holistic tracking

- Wearable integration

- Streak freeze mechanic

- Proactive scheduling nudges

**Pricing target:** €15–30/month, undercutting human coaches at €200–400/month for 80% of the coaching experience.

**Fine-tuning timeline:** After 6+ months of real user data, evaluate distilling coaching patterns into a smaller, faster, cheaper model.

# CHANGELOG: v1.1 → v2.0

**Removed:** Mobility goal, goal mixing engine (60/30/10), goal ranking.

**Added:** 4 curated program paths, exercise role selection, set/rep tables, weekly wave loading, warm-up/cooldown preferences, endurance session formats, path switching, synergy programming for Hybrid.

**Changed:** Onboarding (multi-goal → single path), plan generator (1 blended → 4 path-specific), mesocycle (3–6 months flexible → 12-week standardized), exercise selection (tree offset → role-based).
# CHANGELOG: v2.0 → v2.1

**Added:** Knowledge Engine (structured JSON knowledge base in `src/knowledge/`), autoregulation loop (session-to-session weight adjustments), adaptation queue (`src/engine/adaptationQueue.ts`), context packets (`src/engine/contextPacket.ts`), adaptation surfacing pattern (Arnold proactively mentions changes in chat), Plan Restructurer agent (replaces dead Plan Generator prompt), AI Brain Strategy companion document.

**Changed:** AI Architecture from 4 layers to 3 layers (Knowledge → Decisions → Voice). RAG Knowledge Base → Knowledge Engine with structured domains. Plan Generator agent → Plan Restructurer (TypeScript generators remain for initial plan creation). Quick response bypass expanded from ~40% to ~80% of interactions. Cost target revised from $0.02-0.05/session to under €1.50/user/month. Orchestration layer now builds full context packets instead of minimal context. Section 6 fully rewritten. Sections 10.6, 10.7 added.

**Principles added to spec:** Principle 7 (Propose and Approve), Principle 8 (Knowledge Before Inference), Principle 9 (Deterministic When Possible). Principle 6 (Silent Adaptation) clarified.

**Source of truth hierarchy updated:**
1. Product Spec v2.2 (master)
2. AI Brain Strategy v1.0 (AI architecture decisions)
3. Program Bibles (coaching knowledge source material)
4. Path-Specific Goals (goal system design)
5. MVP Builder Instructions v2.1 (this document)
6. Session Handoff (current state)
7. The codebase
