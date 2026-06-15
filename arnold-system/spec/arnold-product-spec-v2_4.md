# PRODUCT SPECIFICATION

# ARNOLD

## AI-Powered Calisthenics Coach

*Your Personal Training Partner — In Your Pocket, In Your Corner,
Always Adapting*

Version 2.4 | May 2026 | LIVING DRAFT

*Everything in this document is a working structure — all details will
be researched, validated, and adapted.*

# Table of Contents

1.  Product Vision
2.  UX Philosophy
3.  Target User & Use Case
4.  Core User Flow
    - 4.5 The Schedule (new)
5.  Program Paths
6.  Session Structure & Programming
7.  Warm-Up & Cooldown System
8.  Coaching Intelligence Engine
9.  Decision Logic Framework
10. Calisthenics Progression System
11. Adaptive Programming
12. Interaction Model
13. Feature Roadmap
14. 3D Exercise Viewer
15. Technical Architecture (High-Level)
16. AI Brain Architecture
17. Open Questions & Research Needed

---

# 1. Product Vision

Arnold is an AI-powered calisthenics coaching app that replaces the need
for a human coach. Not a tracker. Not an exercise database. A coach —
one that knows your history, adapts your plan when things go wrong,
pushes you when you're sandbagging, and restructures your entire program
when you miss a PR or something doesn't feel right.

**The Problem:** A good online calisthenics coach costs €200–400/month.
For that money, you get a personalized program, weekly adjustments based
on how your sessions went, injury management, and accountability. The
problem is that most people can't afford this — or can't justify spending
it. So they fall into one of two traps: they follow rigid programs that
don't adapt (and plateau or get injured), or they use apps that are just
exercise databases with some adaptive features bolted on. Neither
replicates what a real coach does.

**What a Coach Actually Does:** A real coach doesn't just hand you a
program. They have a conversation with you after every session. They know
what you did, what it was supposed to feel like, and where it fits in the
bigger plan. When you say "I couldn't finish that last set," they don't
panic — they check whether that exercise was meant to push you to failure
or not. If it was, they say "good, that's the point." If it wasn't, they
adjust the plan. When you say "that felt too easy," they check if you're
in a deload week before reacting. When you miss a PR, they don't just retry
next week — they restructure the next 2–3 weeks of training to address the
weak link, then reschedule. When something hurts, they ask how much and
respond proportionally — maybe a warm-up tweak, maybe a physio referral.
The point isn't any single scenario. The point is that every response is
contextual. The coach knows the program, knows you, and reasons about both
before answering. That's what makes a coach worth €300/month. No app does
this today.

**The Solution:** Digitize the coach's brain into an app that works on two
levels. On the surface, it's the simplest training app you've ever used:
open the app, tap Start Session, see your exercises, tap Done between sets,
finish, close. That's it. No feedback required, no forms, no complexity.
The program still adapts — silently, based on what you did. But in the
corner of the screen sits a chat icon — and that's Arnold. Tap it, and
you're talking to a coach that already knows your program, your history,
and exactly where you are in the session. The chat is interactive: Arnold
asks structured questions with tappable options (like a conversation, not
a form). You can talk to him about an injury, a plateau, why today felt
weird, or anything else. Based on your input, Arnold proposes changes to
the plan. You tap yes or no, the program adapts, and those changes cascade
forward through the entire mesocycle. You never switch to a different mode.
You never unlock a deeper version of the app. The depth is just there when
you want it, invisible when you don't. Voice is available as an optional
layer for hands-free interaction (Phase 2), but the app works perfectly
without it. The result is a €300/month coaching experience for a fraction
of the price.

**The Insight:** The best coaching isn't about having the perfect plan —
it's about how the plan adapts when things don't go as expected. Missed
sessions, unexpectedly easy or hard days, discomfort, life getting in the
way. That's where Arnold lives. The plan is never static. It's a living
document that the AI continuously rewrites based on what actually happens —
whether the user tells Arnold directly through the chat, or the AI infers
it from behavioral data like completed reps, skipped exercises, and session
patterns.

**Why Calisthenics First:** Calisthenics is uniquely suited to AI coaching
because progressions are clear and structured (skill trees from beginner to
advanced), form matters more than load (perfect for the 3D avatar viewer),
no equipment variables to track, and the community is underserved — most
apps are built for gym lifters. Phase 1 perfects calisthenics. Phase 2
expands to gym and holistic health.

**The Competitive Gap:** There are 6–8 serious calisthenics apps today
(Calistree, Calisteniapp, Movement Athlete, Simple Calisthenics, Fitloop,
Die Ringe). They all have large exercise libraries, progression tracking,
and some adaptive features. None of them have: (1) an interactive coaching
chat that knows your full program context and responds like a real coach,
not a chatbot, (2) intelligent adaptation that cascades changes through the
entire mesocycle when something goes wrong, (3) a coach personality that
checks training phase before reacting to feedback, (4) curated expert
program paths designed like a real coach would program them — not a "pick
your own" exercise buffet, or (5) a 3D avatar that demonstrates perfect
form on demand. Arnold isn't competing with these apps. Arnold is competing
with the coach.

---

# 2. UX Philosophy

**Simple enough to just train, deep enough to coach you.**

Arnold is one app. There are no modes, no toggles, no complexity settings.
The experience is simple — you open it, you train, you close it. That's it.

But Arnold (the coach) is always sitting in the corner of the screen. If
you ever want to talk to him — about an injury, a plateau, your goals, why
today felt weird, whatever — you tap and he's right there. He already knows
your program, your history, and what you just did. You talk, he adapts.
Then you go back to training.

The user never "switches" to anything. They never unlock a "pro mode." The
app is always the same app. The depth is just there when they want it,
invisible when they don't.

## 2.1 What This Looks Like in Practice

**A beginner on day one:** Opens the app. Goes through onboarding. Taps
Start Session. Sees exercise cards. Taps Done between sets. Rest timer
runs. Session ends. Closes the app. Never touches the chat. Never gives
feedback. The program still adapts based on what they did — sessions
completed, reps logged, exercises skipped. The app just works. It's not
intimidating. It feels like following a coach who already planned your day.

**That same beginner three months later:** They've been stuck on pull-ups
for a few weeks. They notice the chat icon in the corner — they've seen it
every session but never tapped it. Today they tap it. Arnold says "How's
training going?" They type "I can't get past 8 pull-ups." Arnold asks a
couple of follow-up questions, checks their history, and proposes
adjustments. They tap "Yes, update it." The plan changes. They go back to
training. From now on, they chat with Arnold when something feels off. Not
every session — just when they need to.

**An intermediate (the primary user):** They talk to Arnold regularly. After
sessions, they give feedback. They report a shoulder tweak. They ask why
today's workout felt too easy. Arnold explains it's a deload week. They ask
to restructure their goals. Arnold proposes changes and they approve. The
coaching chat is where the real value lives for this person — but it's the
same app the beginner uses. Nothing changed. They just use more of it.

**An expert:** They know what they're doing. They train, they tap Done, they
leave. Maybe once a month they check in with Arnold about a PR schedule or
an injury. The app stays out of their way.

## 2.2 Why This Matters

This philosophy is validated by ICP research:

- The #1 complaint about Movement Athlete is that it demands constant
  feedback but doesn't use it well. Arnold is the opposite — works great on
  its own, works even better when you talk to it.
- Beginners churn from apps that feel complicated or intimidating. If the
  first screen asks them about mesocycles and training phases, they're gone.
  Arnold should feel as simple as opening a workout and pressing play.
- Intermediates (the primary user) naturally start talking to Arnold because
  they care about the details. You don't need to force them — they'll find
  the chat when they hit their first real plateau or injury.
- The depth is a discovery, not an onboarding step. That discovery moment —
  when a user taps the chat for the first time and realizes Arnold actually
  knows their program and can coach them — is the moment they become a
  paying, retained user.

## 2.3 The Analogy

It's like having a personal coach at the gym. You can just show up and
follow the program on the whiteboard — never say a word to the coach. It
still works. But the coach is right there, and when you walk up and say "my
shoulder's been bugging me," they already know your program and adjust it on
the spot. You didn't switch to "coaching mode." You just talked to your
coach.

That's Arnold. The program is always running. The coach is always there. You
talk when you want to.

## 2.4 Design Implication

Every feature in this spec must pass the simplicity test: can a user who
never touches the chat still benefit from this feature? And every coaching
feature must pass the depth test: when a user does engage, does Arnold
respond with full context and intelligence? If either answer is no, the
feature needs rethinking.

---

# 3. Target User & Use Case

Arnold's target user is not "everyone who does calisthenics." It's a
specific person with a specific problem and a specific willingness to pay.
The following profiles are built from real community behavior on Reddit
(r/bodyweightfitness, r/calisthenics), app store reviews, and coaching
market data.

## 3.1 Primary User: The Coachable Intermediate

**Who they are:** 18–35 years old, predominantly male (though calisthenics
is growing fast among women). They've been training for 6–24 months.
They've moved past the beginner phase — they can do pull-ups, dips, and
basic holds. They probably learned from YouTube (Chris Heria, FitnessFAQs,
Calisthenic Movement) or the Reddit Recommended Routine. Now they want to
progress toward advanced skills: muscle-ups, handstands, front levers,
weighted calisthenics.

**Their daily life:** They train at a park, home setup, or gym with a
pull-up bar. Headphones in, music playing. They're used to training alone.
They might work a full-time job (often in tech, creative, or knowledge work
— the same demographic that pays for apps and subscriptions). They value
efficiency and don't want to waste sessions on bad programming.

**Their problem:** They've hit a plateau. The Reddit Recommended Routine got
them started, but it's generic. They're stuck between intermediate and
advanced, and they don't know how to program for themselves. They've tried
2–3 apps and found them to be either too rigid (follow this exact program),
too passive (here's an exercise library, figure it out), or too shallow in
adaptation (rate your set 1–5 and we'll adjust the next one).

**What they've tried:** Free YouTube programs, the Reddit Recommended
Routine, 1–2 paid apps (probably Calisteniapp or Calistree), maybe a
one-time paid program from Calisthenic Movement or FitnessFAQs (€50–150).
Some have considered an online coach but couldn't justify €200–400/month,
or tried a cheap one (€50–100) and got a cookie-cutter program with minimal
feedback.

**What they want but can't get:** The coaching experience. Someone who knows
their history, adjusts when they're injured, pushes them when things are too
easy, and restructures the plan when they fail — without costing €300/month.
They want to be told what to do today, have it adapt when things go wrong,
and not have to think about programming. They want to just train.

**Why they'd pay for Arnold:** Arnold gives them the €300/month coaching
experience at a fraction of the cost. It's not another exercise database —
it's the brain behind the program. It knows them. It adapts. It pushes back.
When they say "my shoulder hurts," it doesn't just skip the exercise — it
restructures around it and builds recovery into their warm-ups. When they
fail a muscle-up PR, it doesn't just retry next week — it changes the next
three weeks of training.

**Price sensitivity:** They already spend money on fitness: €5–15/month on
apps, €20–50 on equipment, maybe €50–150 on one-time programs. They'd pay
€15–30/month for Arnold because it replaces both their current app AND the
coach they can't afford. The value proposition is clear: 10% of a coach's
price for 80% of the coaching experience.

## 3.2 Secondary User: The Motivated Beginner

**Who they are:** Complete beginners to calisthenics, often coming from
gym/weights or no fitness background at all. Age range is broader: 16–45.
They're inspired by calisthenics content online and want to start but feel
overwhelmed by the options and progressions.

**Their problem:** They don't know where to start, what progression to
follow, or how to structure training. They're afraid of injury from doing
exercises wrong. They want hand-holding — tell me exactly what to do, show
me how to do it, and adjust when it's too hard or too easy.

**Why they'd pay for Arnold:** Arnold is the coach they never had. It
assesses them in week one, builds a program at their level, shows every
exercise in 3D, and adjusts as they progress. They don't need to research
programming or progressions. They just open the app and train.

## 3.3 Use Context

The user is at a park, gym, or home. Headphones in, music playing. They open
Arnold and tap Start Session. The workout is already planned — they just
follow it. Exercise cards tell them what to do, they tap Done between sets,
the rest timer runs, and the app advances. They never need to look at their
phone for more than 2 seconds unless they choose to. If they want to talk to
the coach, he's in the corner. If they don't, the session just flows. It
feels like training with a coach who planned your day and is standing nearby
— not operating an app.

## 3.4 Market Context

**Market size:** r/bodyweightfitness has 2+ million members. Calisteniapp
has 2 million downloads. The Movement Athlete claims 100,000+ paying users.
The personal fitness training market is valued at $15.6 billion in 2026,
growing at 12% CAGR. Online fitness coaching averages €100–500/month. There
is a massive gap between "free app" and "pay a human coach." Arnold fills
that gap.

**Coaching price reference:** Online calisthenics coaching ranges from
€50/month (cookie-cutter, minimal feedback) to €200–400/month (personalized,
weekly check-ins) to €1000+/month (VIP, unlimited access). In-person
sessions cost €50–200 per hour. Arnold targets the €200–400/month experience
at a €15–30/month price point.

---

# 4. Core User Flow

## 4.1 Onboarding (First Use)

Onboarding should feel fast and simple — the user should be training within
minutes, not filling out forms. Arnold handles complexity behind the scenes.

The onboarding flow uses the same chat interface as the rest of the app.
Arnold asks, user taps or types, Arnold asks the next thing. No separate
onboarding screens, no jargon.

**Step 1 — Choose Your Program Path:**

Arnold asks one question: "What do you want to focus on?"

The user sees four program cards, each with a clear one-line description:

- **Street Lifter** — Get stronger with weighted pull-ups, dips, and squats
- **Skill Builder** — Master muscle-ups, handstands, planche, and front lever
- **Hybrid Athlete** — Build weighted strength AND unlock advanced skills
- **Endurance** — High-rep circuits, conditioning, and muscular endurance

The user taps one. That's the program path. No ranking, no mixing, no
priority percentages. One tap.

If the user taps Street Lifter, Arnold follows up: "Some athletes also want
to work on skills like handstands or muscle-ups alongside their weighted
training. Want to add that?" → [Yes → redirects to Hybrid Athlete] [No →
stays on Street Lifter].

If the user taps Skill Builder, Arnold follows up: "Weighted strength
(pull-ups, dips) directly supports skill acquisition. Want to add weighted
training?" → [Yes → redirects to Hybrid Athlete] [No → stays on Skill
Builder].

Endurance has no compatible combination — it stays standalone.

**Step 2 — Set Your Goals:**

Goals are path-specific. Arnold asks different questions depending on which
path the user chose.

**Street Lifter goals:** Arnold asks: "Which lifts do you want to focus on?"
User multi-selects 1–3 from: Weighted Pull-ups, Weighted Dips, Weighted
Muscle-ups, Squats. For each selected lift, Arnold asks: "What's your
target?" Options: "Just get stronger" (Arnold auto-targets based on
assessment), a specific number (user types e.g. "+60kg dips"), or
"Competition prep" (Arnold asks target date + weight class, aligns peaking
with comp date).

**Skill Builder goals:** Arnold asks: "Which skills do you want to work
toward?" User multi-selects 1–3 (max 3) from: Handstand, Planche, Front
Lever, Back Lever, Muscle-up, L-sit/V-sit, Human Flag. For each selected
skill, Arnold shows the user's current level (from assessment or experience
level default) and asks for a target: a specific level (e.g. "Freestanding
handstand 30s") or "Just improve" (Arnold picks the next 2–3 progressions).
If a target is far (e.g. tuck to full front lever), Arnold breaks it into
intermediate targets per 12-week cycle.

**Hybrid Athlete goals:** Both of the above. First weighted targets (same as
Street Lifter), then skill targets (same as Skill Builder). If the user
selects 5–6 training days later (which triggers Structure C), Arnold also
asks them to rank all goals into Primary (3×/week), Secondary (2×/week), and
Tertiary (1×/week).

Goals can be updated anytime via chat after onboarding.

**Step 3 — Schedule:**

User selects training days per week: [2] [3] [4] [5]. One tap. Arnold
selects the correct split template for their path automatically. No
preferred-day picker — the user just picks a number, Arnold handles the
structure. If the user wants to change later, they tell Arnold in chat: "I
can only do 3 days now" → Arnold regenerates with the 3-day template,
progression levels carry over.

**Step 4 — Day Preferences:**

Arnold presents a 7-day weekly grid. The user taps each day to cycle through
three states:

- **Train** (green) — preferred training day
- **OK if needed** (amber) — available as a fallback for cascade
- **Blocked** (gray, strikethrough) — never train here

The grid pre-populates from the count selected in Step 3, using auto-spread
defaults (2 → Mon/Thu highlighted as Train, etc.). The user adjusts from
there. A **"Use suggested schedule"** button applies the auto-spread and
skips directly to Step 5 — for users who don't want to configure manually.

**Constraint:** The user must have at least as many Train days tagged as
their session count from Step 3. If they tag fewer, Arnold surfaces: *"You
need [N] training days for this schedule — add one more or reduce your
weekly sessions."*

**Step 5 — Experience Level:**

Arnold asks: "What's your experience level?" → [Beginner] [Intermediate]
[Advanced]

Each maps to a default starting position on every progression tree:

- Beginner: bottom 1–2 levels (wall push-ups, Australian rows, BW squats,
  dead bugs, crow pose)
- Intermediate: middle levels (full pull-ups, diamond push-ups, pistol
  negatives, hanging leg raises, wall handstand)
- Advanced: upper levels (archer pull-ups, ring dips, weighted pistols,
  dragon flags, free handstand)

**Step 6 — Optional PR Input:**

Arnold asks: "Want to add your current numbers so I can dial it in?" →
[Yes] [Skip — just start me]

If yes: Arnold shows exercises relevant to the selected program path. The
user taps exercises they know and enters their current numbers (reps, weight,
hold time). Anything left blank uses the experience level default. For Street
Lifter and Hybrid Athlete, this includes current working weights on pull-ups,
dips, and squats.

If skip: Arnold uses the experience level defaults. The first 2–3 real
sessions self-correct through silent adaptation — behavioral data (sets
completed, reps logged, difficulty) adjusts the placement within the first
week.

**Rules:** Two taps minimum to start training (experience level + skip). No
jargon. No assessment week unless the user specifically asks for one through
the chat. Arnold figures out the real level from behavioral data within the
first week.

**Step 7 — Plan Generation:**

AI generates a 12-week mesocycle based on the selected program path,
experience level (with optional PR data), schedule, and day preferences. The
plan uses the program path's specific periodization template, session
structure, and set/rep schemes. No blending engine — each path is a designed
program. Progression tree placement is based on experience level defaults,
overridden by any PR data the user provided. Silent adaptation corrects
placement within the first 2–3 sessions.

## 4.2 Program Paths — Overview

Arnold offers four curated program paths. Each is a complete,
expert-designed training program with its own periodization, session
structure, exercise selection logic, and progression rules. Users select one
path during onboarding. They can switch paths at any time through the chat,
which triggers a plan recalculation.

**Why curated paths instead of mix-and-match:** A real coach doesn't let you
"pick 60% strength and 30% skills and 10% endurance." They assess you and
put you on a program. Some goal combinations are synergistic (strength +
skills) and some actively interfere with each other (heavy strength + high-
rep endurance). Curated paths ensure every user gets a program that's been
designed as a coherent whole — not a mathematical mashup of percentages. The
Hybrid Athlete path exists specifically for users who want the most popular
combination (strength + skills), designed to work together rather than forced
into a blending algorithm.

Program path details are in Section 5.

## 4.3 Daily Training Session

The session screen is built around three elements: the workout itself, the
chat widget, and the 3D viewer.

**The Workout:** Exercise cards displayed in a clean, scrollable layout. Each
card shows the exercise name, sets/reps, and current progress. A rest timer
runs between sets. A large DONE button is always visible — tap it to log a
completed set and the app advances to the next one automatically. Every
exercise card — warm-up, main workout, and cooldown — has a tap target to
open the 3D viewer showing Arnold performing the exercise with perfect form,
plus a written breakdown (form cues, target muscles, common mistakes, why
it's in the plan).

**Chat Widget:** Arnold's chat sits in the corner of the screen, always
accessible but never intrusive. The user can complete entire sessions —
including warm-ups and cooldowns — without ever tapping the chat. It's there
when they want it. Tap to open, and all coaching interaction happens here:
reporting discomfort, asking questions, requesting exercise swaps, or just
chatting about how the session is going. Arnold responds with interactive
tappable options (like a conversation, not a form) or accepts free text. The
chat knows the full context — your program, the current exercise, its
difficulty tag, your history.

**3D Viewer:** Available on every exercise in the session — warm-up, main
workout, and cooldown. Tap any exercise card to see Arnold's figure
performing the movement with perfect form. The figure is rotatable (swipe),
zoomable (pinch), and pausable (tap). Primary muscles are highlighted in red,
secondary in orange. Below the figure, a written breakdown describes the
exercise: form cues, target muscles, common mistakes, and what this exercise
is meant to achieve in the plan.

**Session Flow:** User opens app → taps Start Session → warm-up exercises
appear as cards (skippable with one tap) → main workout begins → user
trains, tapping DONE between sets → rest timer runs → app advances → after
final exercise, cooldown/stretching exercises appear as cards (skippable with
one tap to mark session complete) → if the user taps the chat, Arnold opens a
post-session check-in; if they don't, the session just ends.

**Post-Session Feedback (Optional):** After the session, if the user taps the
chat, Arnold opens a check-in conversation: "How did today feel?" → [Great]
[Good] [Tough] [Bad] [Let me explain]. Follow-up questions drill down based
on the answer. The user can tap through in 10 seconds if everything was fine,
or type freely when something needs explaining. Arnold may propose
adjustments: "Want me to update next week's sessions?" → [Yes] [No]. Changes
cascade through the program. But this entire interaction is optional. If the
user closes the app after the last exercise or skips the cooldown, the
session is still logged and the program still adapts based on behavioral data.

**Silent Adaptation:** The program adapts even when the user never interacts
with the chat. The AI tracks behavioral signals — sessions completed, reps
logged, exercises skipped, rest times, session frequency, progression stalls
— and uses this data to make adjustments. The chat makes adaptation faster
and more precise, but the plan is never static even without it.

## 4.4 Streaks & Consistency Tracking

Arnold tracks training streaks to reinforce consistency, which is the single
most important factor in calisthenics progress.

**Daily Streak:** Consecutive days of completed sessions. Visible on the home
screen. Motivational but not punishing — rest days don't break the streak if
they're part of the plan.

**Weekly Streak:** Consecutive weeks where the user hit their target session
count (e.g., 5 out of 5 planned sessions). More meaningful than daily
streaks for long-term consistency.

**Milestone Streaks:** Special recognition for hitting targets like 30 days,
100 sessions, or completing an entire mesocycle without missing a planned
session.

**Streak Recovery:** Life happens. Arnold offers a "streak freeze" mechanic
for legitimate reasons (travel, illness). The AI can distinguish between a
planned rest and falling off — and adjusts its tone accordingly.

**Streak Reset Logic**

After a fully missed Mon–Sun calendar week (zero completed sessions),
`currentDaily` and `currentWeekly` reset to 0.

Preserved on reset: `longestDaily`, `longestWeekly`, `totalSessions`,
`streakFreezes`.

The reset fires on HomeScreen mount, subject to all three conditions:

- **(A)** The previous Mon–Sun calendar week had zero completed sessions
- **(B)** The user has at least one completed session before that week
  (prevents false penalty on fresh accounts)
- **(C)** No session was completed within the last 60 seconds (prevents
  false-positive during hot re-renders or rapid state transitions)

The check is idempotent — safe to run on repeated mounts.

**`currentWeekly` Increment Logic**

`currentWeekly` increments on the first app open of each new calendar week
(Monday), evaluated against the previous week:

- **Increment by 1:** Previous week had ≥ 100% of adjusted scheduled
  sessions completed.
- **Reset to 0:** Previous week had fewer than adjusted scheduled sessions
  completed (subject to conditions A/B/C above).

**Adjusted scheduled sessions** is defined as:

- Original scheduled session count for the week
- Minus any sessions dropped via Plan Realignment (§4.5.3 Option 2) —
  Arnold-approved drops reduce the target
- Cascade moves (§4.5.2) do NOT reduce the count — the session still
  happens, just on a different day
- Genuine misses (sessions not completed and not Arnold-approved-dropped)
  count against the schedule

**Example:** Week scheduled for 4 sessions. User invokes Plan Realignment and
drops one (Option 2). Adjusted schedule = 3. Completing all 3 = 100% of
adjusted → week streak increments. If the user instead missed one without
invoking Plan Realignment: 3 of 4 actual = 75% of original → week streak
resets (subject to conditions A/B/C).

**Store Fields: `lastStreakCheckWeek` and `weeklyDrops`**

Two fields in the Zustand store bridge the streak system and the Plan
Realignment logic. Both are persisted to AsyncStorage.

**`lastStreakCheckWeek`** (`string | null`)

An ISO week identifier (e.g., `"2026-W19"`) recording the last Mon–Sun week
for which the streak reset check was evaluated. The HomeScreen check reads
this field first — if it matches the current week, the check is skipped
(idempotent guard). When the check fires and completes, this field is written
with the current week identifier. Prevents the reset from firing more than
once per week regardless of how many times HomeScreen mounts.

**`weeklyDrops`** (`number`, default `0`)

Counts the number of sessions dropped in the current Mon–Sun week via Plan
Realignment Option 2 (Arnold-approved drops). Resets to 0 at the start of
each new calendar week.

This field is the mechanical bridge between Plan Realignment (§4.5.3) and the
`currentWeekly` streak increment logic. When the streak check evaluates
"adjusted scheduled sessions completed," it computes:

```
adjustedTarget = originalScheduledCount - weeklyDrops
streakIncrements = completedSessions >= adjustedTarget
```

`weeklyDrops` is only incremented by Plan Realignment Option 2. Cascade moves
(§4.5.2) do not touch it. Genuine misses do not touch it.

## 4.5 The Schedule

The schedule system governs how planned sessions are distributed across the
calendar and how the app responds when sessions are missed. All schedule
logic is deterministic — no LLM cost.

### 4.5.1 Day Preferences

During onboarding, the user tags each weekday as one of three states:

- **Train** — preferred training day. Arnold places planned sessions here
  first.
- **OK if needed** — fallback day. Used only when cascade resolution requires
  it.
- **Blocked** — never schedule a session here under any circumstances.

The count of **Train** days determines the weekly split template for the
selected program path — replacing the previous days/week number picker.
Arnold selects the correct split automatically (same logic as before, now
driven by the count of Train-tagged days rather than a number tap).

**If the user skips day-tagging:** Arnold applies the default auto-spread (2
days → Mon/Thu, 3 → Mon/Wed/Fri, 4 → Mon/Tue/Thu/Sat, 5 →
Mon/Tue/Wed/Fri/Sat). All non-scheduled days default to "OK if needed."
Blocked days cannot be set via auto-spread — only via the tagging step.

Day preferences can be updated at any time through the chat. Arnold
regenerates the week structure; progression levels carry over.

**Data shape:**

```typescript
dayPreferences: {
  [dayOfWeek: number]: "train" | "ok" | "blocked";
  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}
```

### 4.5.2 Cascade Rules (1 Missed Session)

When exactly one session is missed earlier in the current Mon–Sun calendar
week, the cascade fires automatically on the next app open.

**Resolution algorithm:**

1. Find the next available day that is: (a) not Blocked, (b) not already
   scheduled, (c) does not create a same-movement-pattern conflict back-to-
   back (push→push, pull→pull, or same-skill→same-skill for Skill Builder
   and Hybrid Athlete sessions)
2. Move the missed session to that day
3. Push subsequent sessions forward by one slot
4. Stay within the current Mon–Sun week — no spillover into the next calendar
   week
5. If the algorithm cannot resolve cleanly (pattern conflict, week ends, all
   remaining days Blocked) → fall back to Plan Realignment dialog (§4.5.3)

**Pattern conflict definition:** Same-side pattern back-to-back = push→push,
pull→pull, or the same named skill (e.g., planche session → planche session).
Push followed by legs is not a conflict. Hybrid Athlete weighted day followed
by a skill-only day is not a conflict.

**Cascade is silent.** No chat interaction or user confirmation required. The
user is notified via an amber pill on the home screen: *"Moved from [Day] —
Undo."* One-tap Undo reverts to the original schedule. Undo state is local UI
only — not persisted to the plan.

**Lock timing:** The cascade decision is committed at first app open on a
given day. Once the session card has loaded, the schedule is fixed for that
day. This eliminates timezone edge-case complexity and makes the behavior
predictable.

**Manual override:** If the user long-presses the session card to manually
swap a day, the amber pill is dismissed automatically.

**Chat behavior:** Cascade is not surfaced as an adaptation event in the
chat. If the user opens the chat widget after a cascade, Arnold does not
proactively mention it — the amber pill handles surfacing. If the user asks
why their session moved, Arnold explains. Consistent with the principle that
the chat is never forced.

### 4.5.3 Plan Realignment Dialog (2+ Missed Sessions)

When two or more sessions are missed within the current Mon–Sun week, or when
the 1-session cascade fails to resolve cleanly, the Plan Realignment dialog
triggers on the next app open.

Arnold opens with a single line: *"You missed [N] sessions this week. How do
you want to handle it?"* followed by three tappable options:

**Option 1 — Compress:** Fit remaining sessions into available (non-Blocked)
days this week. Session order is preserved. Movement pattern constraints are
respected where possible — if no pattern-clean arrangement exists, Arnold
arranges the closest option and surfaces a brief note (*"Back-to-back push
days this week — unavoidable given your schedule."*). Rest between sessions
may be reduced.

**Option 2 — Drop a session:** Remove the lowest-priority session for this
week. Heavy compound sessions are never dropped. Priority order for dropping
(lowest priority first):

| Path | Drop order |
|---|---|
| Street Lifter | Accessory/volume day → Upper Volume day → Peak Singles day |
| Skill Builder | Strength Volume day → Legs day → Pure Skill day |
| Hybrid Athlete | Accessory bolt-on day → Skill day → Volume day |

The dropped session is not rescheduled and does not count against the streak.
Dropping via this option reduces the adjusted scheduled session count for the
week (see §4.4 `currentWeekly` increment logic). Increments `weeklyDrops` by
1.

**Option 3 — Extend the week:** Push the entire current training week forward
by one calendar week. The mesocycle extends by 1 week.

Hard cap: the mesocycle can extend by a maximum of **+2 weeks total** across
its 12-week duration. If the cap has been reached, this option is grayed out
with the note: *"You've already extended the cycle twice — I'll keep it tight
from here."*

**Dismissal behavior:** The dialog appears once per triggering event. If the
user dismisses without choosing, Arnold selects Compress by default and
surfaces it the next time the user opens the chat.

**UI placement:** The Plan Realignment dialog is a modal on the home screen,
distinct from the chat widget.

### 4.5.4 Cascade vs. Plan Realignment — Decision Table

| Scenario | Response |
|---|---|
| 0 missed sessions | Normal schedule. No action. |
| 1 missed, cascade resolves cleanly | Silent cascade. Amber pill. |
| 1 missed, cascade fails (conflict / Blocked days / week ends) | Plan Realignment dialog. |
| 2+ missed in current week | Plan Realignment dialog. |
| 2+ calendar weeks missed | Multi-week absence protocol (§9.4). |

---

# 5. Program Paths

This is the core of the programming system. Each path is a complete,
expert-designed training program. The plan generator uses the path's specific
periodization template, session structure, exercise selection rules, and
set/rep schemes to produce the mesocycle.

## 5.1 Street Lifter

**What it is:** A strength program built around weighted calisthenics. The
four primary movements are weighted pull-ups, weighted dips, weighted
muscle-ups (when ready), and squats (barbell or weighted pistol). Programming
follows traditional strength sport periodization — volume accumulation →
strength intensification → peaking → test.

**Who it's for:** Athletes who want to get as strong as possible on the bar.
Often interested in streetlifting competitions (Final-Rep, King of Weighted).
They own a dip belt and plates. They care about adding kg to their pull-ups
and dips.

**Periodization (12-week mesocycle):**

| Weeks | Phase | Focus |
|---|---|---|
| 1–3 | Volume Accumulation | 3–4×8–10 at moderate weight. Build work capacity, hypertrophy, technique |
| 4 | Deload | 2×6 at 60–70% effort. Recovery |
| 5–7 | Strength | 4–5×3–5 at heavier weight. Progressive overload via weight increments |
| 8 | Deload | Recovery |
| 9–10 | Peaking | Work up to heavy doubles and triples. Near-max intensity |
| 11 | Deload | Taper for testing |
| 12 | Test | 1RM attempts on all primary lifts. PR week |

**Session Structure (5 blocks):**

1. Warm-Up — Specific warm-up sets: bodyweight reps → 50% working weight × 5
   → 75% × 3 → working sets
2. Heavy Compound — Primary lift of the day (weighted pull-ups, weighted dips,
   or squats). 3–5 sets, 3–10 reps depending on phase. 2–4 min rest
3. Back-Off / Volume Work — Same movement pattern at reduced weight or
   bodyweight variation. 3–4 sets × 8–12 reps. 90–120s rest
4. Accessories — Weak point training: overhead press, rows, face pulls, tricep
   extensions, bicep curls, core work. 2–3 sets × 10–15 reps. 60–90s rest
5. Cooldown — Session-dependent stretching

**Weekly Split by Frequency:**

| Days/Week | Split | Sessions |
|---|---|---|
| 2 | The Core Two | Day 1: Heavy Dips. Day 2: Heavy Pull-ups. No Peak Singles. Squats as accessory. |
| 3 | The Competition Trio | Day 1: Heavy Dips. Day 2: Heavy Pull-ups. Day 3: Peak Singles. Squats as accessory. |
| 4 | Trio + Legs | Day 1: Heavy Dips. Day 2: Heavy Pull-ups. Day 3: Peak Singles. Day 4: Legs. |
| 5 | Trio + Legs + Volume | Day 1: Heavy Dips. Day 2: Heavy Pull-ups. Day 3: Peak Singles. Day 4: Legs. Day 5: Upper Volume. |

**Frequency principle:** The 3-day split is the base program. The 2-day is
the 3-day without Day 3. The 4-day adds a dedicated leg session. The 5-day
adds an upper volume day. At 4+ days, legs get a dedicated session with
squats as the primary lift.

**Progression Method:** Double progression. Start at bottom of rep range →
add reps until hitting the top → increase weight by 1.25–2.5kg → reset to
bottom of rep range. For competition prep, percentage-based programming off
estimated 1RM.

## 5.2 Skill Builder

**What it is:** A technique-focused program for unlocking advanced
calisthenics movements. Target skills include muscle-ups, handstands, planche,
front lever, back lever, and human flag. Programming follows a skill
acquisition framework — dedicated skill practice when the CNS is fresh,
followed by supporting strength work.

**Who it's for:** Athletes who want to master impressive movements. They watch
FitnessFAQs, Calisthenic Movement, and Chris Heria. They care about holding a
handstand, not about how much weight is on their dip belt.

**Periodization (12-week mesocycle):**

| Weeks | Phase | Focus |
|---|---|---|
| 1–3 | Hypertrophy | Build muscle mass to support strength. Higher volume, moderate intensity. 3–4×8–12 |
| 4 | Deload | Recovery |
| 5–8 | Strength | Increase force output for skill progressions. Lower reps, higher intensity. 4–5×3–5 |
| 9 | Deload | Recovery |
| 10–11 | Skill Peaking | Reduce volume, maximize skill practice time. Test new progressions |
| 12 | Test | PR attempts on target skills (hold times, clean reps) |

**Session Structure — The 6-Slot Template**

Every Skill Builder session follows this 6-slot structure. Slot content varies
by skill focus and tier; slot order is fixed. Total session duration: 44–65
minutes.

| Slot | Name | Duration | Notes |
|---|---|---|---|
| 1 | Warm-up | 8–12 min | Fixed 3-part structure |
| 2 | Skill practice | 5–10 min | Submaximal CNS work, self-directed rest |
| 3 | Primary skill isometric | 10–15 min | Accumulation-based, sets × seconds |
| 4 | Complementary lift | 8–10 min | Bent-arm, same pattern as slot 3 |
| 5 | Prehab accessories | 8–10 min | 2 movements: skill-specific + antagonist |
| 6 | Core finisher + cooldown | 5–8 min | 1 core movement + static stretch |

**Slot 1 — Warm-Up (Fixed 3-Part Structure)**

*Part A — Pulse Raiser (all sessions):*
30 seconds jumping jacks → 30 seconds high knees. Always first.

*Part B — Wrist + Scapular Sequence:*
Full wrist sequence (7 drills, ~3–4 min) on any session involving pushing,
pressing, or planche/handstand skills. Abbreviated (wrist only) on pull days.

Wrist sequence (Tom Merrick / GMB canonical):
1. Wrist circles — 10 reps each direction
2. First-knuckle push-ups — 10 reps
3. Wrist push-ups (palm-to-fist roll) — 10 reps
4. Wrist rocks in table position — 10 reps forward/back
5. Kneeling wrist extension #1 (palms down, fingers back) — 10 pulses, hold 10 s
6. Kneeling wrist extension #2 (rotated 180°) — 10 pulses, hold 10 s
7. Kneeling wrist flexion (backs of hands down) — 10 pulses, hold 10 s

Scapular + shoulder block (all sessions):
- Scapular shrugs — 2×10
- Band pull-aparts — 2×15
- Banded shoulder dislocates — 10 reps
- Cat-cow — 10 reps

*Part C — Bodyline Drills (all sessions):*
Always 1 anterior + 1 posterior. Beginners: hollow body hold 3×20–45 s +
arch hold 3×20–30 s (fixed). Intermediate: can rotate in dead bug or superman
hold for variety.

**Slot 2 — Skill Practice**

Submaximal CNS practice. Not a working set. Stop each set when form
deteriorates. Self-directed rest.

| Skill Focus | Practice Drill | Beginner | Intermediate |
|---|---|---|---|
| Planche | Planche lean holds | 8 × 3–5 s | 8 × 5–8 s |
| Front Lever | Tuck hang + scapular depression hold | 6 × 3–5 s | 6 × 5–8 s |
| Handstand | Wall kick-ups to handstand | 8–10 attempts | Freestanding kick-up attempts × 8–10 |
| Muscle-Up | False-grip hang | 6 × 10–15 s | False-grip ring rows 3×5 slow |
| Back Lever | German hang → tuck back lever | 6 × 3–5 s | 6 × 5–8 s |

Never take slot 2 to failure.

**Slot 3 — Primary Skill Isometric**

Accumulation-based. Many short sets, never to failure, full recovery between
sets. Generator always outputs sets × seconds, never "reps" for isometric
holds. Exercise schema: `unit: "seconds"`.

| Phase | Sets | Hold Duration | Rest |
|---|---|---|---|
| Accumulation (weeks 1–4) | 6 × | 4–6 s | 3 min |
| Strength (weeks 5–8) | 5 × | 6–10 s | 3 min |
| Intensification (weeks 9–12) | 4 × | 8–12 s | 3–4 min |

Progression levels by skill focus:

*Planche:* L0 Planche lean → L1 Tuck planche → L2 Advanced tuck planche →
L3 Straddle planche → L4 Full planche

*Front Lever:* L0 Tuck front lever → L1 Advanced tuck → L2 One-leg extended
→ L3 Straddle front lever → L4 Full front lever

*Handstand:* L0 Wall handstand chest-to-wall → L1 Wall handstand back-to-wall
→ L2 Freestanding kick-up + hold attempts → L3 Freestanding handstand → L4
Press handstand work

*Muscle-Up:* Rep-based (not hold-based). 5×3–5 across all phases, progression
through harder variations. L0 False-grip chest-to-ring pull-ups → L1 Toe-
assisted muscle-up → L2 Banded muscle-up → L3 Strict muscle-up singles → L4
Strict muscle-up volume.

*Back Lever:* L0 German hang conditioning → L1 Tuck back lever → L2 Advanced
tuck → L3 One-leg back lever → L4 Full back lever

**Slot 4 — Complementary Lift**

Mandatory. Bent-arm movement in the same pattern as the primary skill. Set/rep
scheme: beginner 3×6–10 (controlled tempo, 2 s down); intermediate 3×3–8
(strength-focused). Rest: 2–3 min.

| Skill Focus | Primary Pick | Secondary Pool (rotate) |
|---|---|---|
| Planche | Pseudo-planche push-ups 3×8–12 (beg) / 3×5–8 (int) | Pike push-ups, tuck planche push-ups, weighted push-ups, archer push-ups |
| Front Lever | Weighted pull-ups 3×5–8 (beg BW) / 3×4–6 (+5 kg) | Front-lever rows, ice-cream makers, archer pull-ups, chest-to-bar pull-ups |
| Handstand | Pike push-ups 3×6–10 | Elevated pike push-ups, wall HSPU negatives (beg) / full (int), decline push-ups |
| Muscle-Up | Straight-bar dips 3×6–10 (default) | Russian dips (transition weak), L-sit pull-ups (pulling weak), ring dips (pushing weak) |
| Back Lever | Bent-over rows / ring rows 3×6–10 | Reverse hypers, hip extensions |

**Slot 5 — Prehab Accessories**

Two movements, always: one skill-specific + one antagonist. 2–3 × 10–20
reps. Light weight, strict form. 60–90 s rest. Supersetted where possible.

| Skill Focus | Slot 5a (skill-specific, rotate) | Slot 5b (antagonist, always) |
|---|---|---|
| Planche | Scapular push-ups, 45° dumbbell anterior raises, W-wall slides, Whippets | Band pull-aparts 3×15–20, alternate with face pulls 3×12–15 |
| Front Lever | Scapular pull-ups, dragon flags, hanging leg raises, dead hang | Band pull-aparts 3×15; scapular push-ups 2×10 (push balance) |
| Handstand | Wall slides, shoulder shrugs in handstand, lateral shoulder raises, prone Y+T raises | Band pull-aparts 3×15–20, scapular pull-ups 2×10 |
| Muscle-Up | Ring support hold, RTO support hold, banded lat stretch, false-grip wrist mobility | Face pulls 3×12–15, band pull-aparts 3×15 |
| Back Lever | Reverse hypers, Superman holds, prone hip extensions | Band pull-aparts 3×15, straight-arm lat pulldown 3×12 |

**Slot 6 — Core Finisher + Cooldown**

One core movement (rotate across sessions):
- Hollow body hold — 3×20–45 s (if not done in slot 1; otherwise: dead bug)
- Dead bug — 3×8/side
- L-sit accumulation — 30–60 s total
- Hanging knee raises — 3×10–15
- Plank (feet elevated) — 2×45–60 s

Cooldown (fixed, always): 3–5 minutes static stretching. Minimum: chest
opener + lat stretch + forearm/wrist flexor stretch + hip flexor.

**Full Session Examples**

*Beginner — Planche Focus (~50 min, 13 movements):*
Slot 1: Jumping jacks + high knees → full wrist sequence → scapular block
→ hollow hold 3×20 s + arch hold 3×20 s |
Slot 2: Planche lean holds 8×3 s |
Slot 3: Tuck planche 6×5 s, 3 min rest |
Slot 4: Pseudo-planche push-ups 3×10, 2 min rest |
Slot 5: Scapular push-ups 3×10 + band pull-aparts 3×15, 60 s rest |
Slot 6: L-sit accumulation 30 s → cooldown 4 min

*Intermediate — Front Lever Focus (~56 min, 14 movements):*
Slot 1: Jumping jacks + high knees → full wrist sequence → scapular block
→ hollow hold 3×30 s + superman hold 3×25 s |
Slot 2: Advanced tuck hang + scapular depression 6×5–6 s |
Slot 3: Advanced tuck front lever 5×7–8 s, 3 min rest |
Slot 4: Weighted pull-ups (+5 kg) 3×5, 3 min rest |
Slot 5: Dragon flags 3×5 + face pulls 3×15, 60 s rest |
Slot 6: Hanging knee raises 3×12 → cooldown 4 min

**Multi-Skill Sessions**

When two skill focuses appear in one session: full warm-up (merged pools),
skill practice alternates 2–3 attempts per skill, primary skill gets full
slot 3 volume, secondary gets 4 sets (reduced), one complementary lift
(primary skill only), one accessory from each pool (skip antagonist in slot
5b). Hard cap: 70 minutes. If over, reduce secondary to 3 sets and slot 5b
to one movement.

**Weekly Split by Frequency:**

| Days/Week | Split | Sessions |
|---|---|---|
| 2 | The Core Two | Day 1: Skill + Push. Day 2: Skill + Pull. Legs as accessory. |
| 3 | Skill + Strength Rotation | Day 1: Skill + Push. Day 2: Skill + Pull. Day 3: Skill + Legs/Full Body. |
| 4 | Skill + Strength + Legs + Pure Skill | Day 1: Skill + Push. Day 2: Skill + Pull. Day 3: Legs. Day 4: Pure Skill. |
| 5 | Full Program | Day 1: Skill + Push. Day 2: Legs. Day 3: Skill + Pull. Day 4: Pure Skill. Day 5: Strength Volume. |

**Skill Practice Frequency:** Each target skill is practiced 3–5× per week
in short sessions for optimal neural adaptation. Skill work appears at the
beginning of most sessions, even on "strength" days — limited to 10–15
minutes.

## 5.3 Hybrid Athlete

**What it is:** The program for athletes who want BOTH weighted strength AND
advanced skills. This is the most popular profile in serious calisthenics —
the person who wants heavy weighted pull-ups AND a clean muscle-up AND a
solid handstand. It's not a percentage blend — it's a specifically designed
program that leverages the high synergy between weighted strength and skill
acquisition.

**Who it's for:** The all-rounder. The person who watches both streetlifting
competitions and skill athletes. They want to be strong AND capable. This is
Arnold's primary ICP — the coachable intermediate described in Section 3.1.

**Why this isn't just "Street Lifter + Skill Builder mashed together":**
Weighted strength and skill acquisition are highly synergistic. Heavy weighted
pull-ups build the raw pulling strength needed for muscle-ups and front levers.
Weighted dips build the pressing foundation for handstand push-ups and planche.
The Hybrid path programs them to feed each other, not compete for volume.

**Periodization (12-week mesocycle):**

| Weeks | Phase | Focus |
|---|---|---|
| 1–3 | Base Building | Moderate weight, moderate volume. Establish work capacity. Skill practice every session |
| 4 | Deload | Recovery. Light skill practice maintained |
| 5–7 | Strength + Skill Intensification | Heavier weighted work. Harder skill progressions. Skills benefit from strength gained in base building |
| 8 | Deload | Recovery |
| 9–10 | Specialization | Choose emphasis: weighted PRs or skill PRs. Non-emphasized area drops to maintenance |
| 11 | Deload / Taper | Prepare for test week |
| 12 | Test | PR attempts on both weighted lifts AND skill hold times |

**Session Structure (6 blocks):**

1. Skill Practice — Always first. 10–15 min. Handstand, planche lean, front
   lever, or muscle-up work depending on the day. 3–5 sets × short holds or
   low reps. Full rest between sets
2. Heavy Compound — Weighted pull-ups, weighted dips, or squats. 3–5 sets ×
   3–8 reps depending on phase. 2–4 min rest
3. Volume Work — Bodyweight variations for hypertrophy. 3–4 sets × 8–12 reps.
   90–120s rest
4. Complementary Movement — Different plane from the heavy compound. 3 sets ×
   8–10 reps
5. Accessories — Skill-specific weak links + general shoulder/wrist health.
   2–3 sets × 10–15 reps
6. Cooldown

**The Synergy Engine:** Weighted pull-ups on pull days directly support front
lever and muscle-up progression. Weighted dips on push days directly support
planche and HSPU progression. When a skill plateaus, the system increases
supporting strength work for that pattern.

**Weekly Split by Frequency:**

| Days/Week | Structure | Sessions |
|---|---|---|
| 2 | Bolt-On Core Two | Day 1: Heavy Dips + push skills. Day 2: Heavy Pull-ups + pull skills. |
| 3 | Structure A (Bolt-On) | Day 1: Heavy Dips + skill bolt-on. Day 2: Heavy Pull-ups + skill bolt-on. Day 3: Peak Singles + L-sit/core. |
| 4 | Structure B (PPL + Skill) | Day 1: Heavy Dips + push skill. Day 2: Heavy Pull-ups + pull skill. Day 3: Legs. Day 4: Dedicated Skill Day. |
| 5 | Structure B+ (Full) | Day 1: Heavy Dips + push skill. Day 2: Legs. Day 3: Heavy Pull-ups + pull skill. Day 4: Dedicated Skill. Day 5: Upper Volume + extra skill. |

**Structure note:** At 2–3 days, skills are bolted onto weighted sessions
(10–15 min). At 4 days, skills get their own dedicated session. Weighted work
always gets CNS priority — skills never come before heavy lifting in the same
session.

## 5.4 Endurance

**What it is:** A conditioning-focused program built around high-rep
calisthenics, circuits, AMRAP rounds, and minimal rest. Training emphasizes
muscular endurance, cardiovascular conditioning, and work capacity through
bodyweight movements.

**Who it's for:** Athletes who want to build work capacity, stay lean, and
handle volume. Often cross-training from other sports (climbing, martial arts,
OCR) or wanting general fitness through calisthenics.

**Periodization (12-week mesocycle):**

| Weeks | Phase | Focus |
|---|---|---|
| 1–4 | Base Conditioning | Build aerobic base. Moderate volume, moderate rest. Learn circuit formats |
| 5 | Deload | Recovery |
| 6–9 | Volume Ramping | Increase rep targets weekly, add circuit rounds, reduce rest times progressively |
| 10 | Deload | Recovery |
| 11–12 | Test | Max rep tests, timed challenges, benchmark workouts |

**Session Formats:**

Format A — Circuit Training: 3–5 exercises in sequence, minimal rest between
exercises, 60–90s rest between rounds. 3–5 rounds.

Format B — AMRAP: Set a timer (10, 15, or 20 minutes). Perform a circuit
continuously. Count total rounds.

Format C — EMOM: Perform a set number of reps at the start of every minute.
Rest for the remainder. 10–20 minutes.

Format D — Timed Sets: Perform an exercise for a set time (30–60s), rest,
repeat. Count total reps.

**Weekly Split:**

| Days/Week | Split | Session Layout |
|---|---|---|
| 3 | Full Body circuits ×3 | Each session uses a different format (Circuit/AMRAP/EMOM) |
| 4 | Push/Pull circuits ×2 | Push + legs circuit, Pull + core circuit, alternating |
| 5 | Push/Pull/Legs/Full/Conditioning | 3 pattern-specific circuits + 1 full body + 1 pure conditioning |

**Progression:** More reps per set → more rounds per session → shorter rest
periods → harder exercise variations (only when reps are very high).

## 5.5 Program Path Compatibility — Why These Four

**Street Lifter + Skill Builder = Hybrid Athlete.** Weighted strength and
skill acquisition are highly synergistic — they share the same neural demands,
the same CNS-fresh requirement, and weighted strength directly transfers to
advanced skills.

**Endurance stands alone.** High-rep, low-rest conditioning sends opposing
physiological signals to heavy strength work. A real coach would never program
heavy weighted pull-ups and high-rep circuits in the same session.

**Mobility is not a goal — it's built in.** Mobility is delivered through the
warm-up and cooldown system (Section 7), automatically contextualized to each
session type.

**Why not let users combine freely?** Because a coach wouldn't. Curated paths
ensure every user gets a program that works — designed as a coherent whole.

## 5.6 Switching Paths

Users can switch program paths at any time by talking to Arnold through the
chat. Arnold asks why they want to switch, confirms the new path, and generates
a new mesocycle. Training history and progression levels carry over — only the
program structure changes.

---

# 6. Session Structure & Programming

## 6.1 Exercise Selection by Role

Every exercise in a session is selected for a specific role. This replaces the
old system where exercises were picked by tree offset.

**Main Exercise (Heavy Compound):** The user's active progression in the
primary pattern for this session. This drives the progression tree forward.

**Volume Exercise:** A mastered exercise in the same movement pattern, selected
for its ability to accumulate volume safely. Usually 2–4 levels below the main.

**Complementary Exercise:** An exercise in a related but different movement
plane within the same pattern. Creates balanced development and prevents
overuse.

**Accessory Exercise:** Targets weak links, stabilizers, or antagonists.

**Skill Exercise:** (Skill Builder and Hybrid Athlete only.) The user's target
skill progression. Always placed first in the session.

**Skill Practice** (`skill-practice` role): (Skill Builder only.) Slot 2 of
the 6-slot template. Submaximal CNS practice before the primary isometric.
Never autoregulated — Arnold never queues weight or load changes for this slot.

**Skill Isometric** (`skill-isometric` role): (Skill Builder only.) Slot 3 of
the 6-slot template. The primary skill hold work. Schema: `unit: "seconds"`.
The session screen displays "Hold X seconds" not "X reps." Autoregulation
applies to progression advancement/regression (move to harder/easier level);
load changes do not apply.

## 6.2 Evidence-Based Set/Rep Schemes

**Heavy Compounds (by phase):**

| Phase | Sets × Reps | Rest | Difficulty Intent |
|---|---|---|---|
| Base Building | 3–4 × 6–8 | 120–180s | Moderate |
| Strength | 4–5 × 3–5 | 180–240s | Challenging |
| Peaking | 3–5 × 1–3 | 240–300s | Challenging |
| Deload | 2–3 × 5–6 | 120s | Easy |

**Volume Work (by phase):**

| Phase | Sets × Reps | Rest | Difficulty Intent |
|---|---|---|---|
| Base Building | 3–4 × 8–12 | 90–120s | Moderate |
| Strength | 3 × 8–10 | 90–120s | Moderate |
| Peaking | 2–3 × 10–12 | 60–90s | Easy-Moderate |
| Deload | 2 × 10–12 | 60–90s | Easy |

**Skill Practice (Slot 2 — all phases):** Multiple short attempts, self-
directed rest. Submaximal. Stop before form deteriorates.

**Skill Isometric (Slot 3):** See §5.2 phase table (4–8 sets × 3–12 s,
3 min rest). Progresses by hold duration within the table, then advances to
the next progression level.

**Skill Complementary (Slot 4):** Beginner 3×6–10 controlled tempo; Intermediate
3×3–8 strength-focused. 2–3 min rest.

**Accessories:** All Phases: 2–3 × 10–15. 45–90s rest. Easy.

## 6.3 Weekly Volume Targets

Based on systematic reviews, optimal weekly training volume:

| Training Level | Sets Per Muscle Group Per Week |
|---|---|
| Beginner (0–6 months) | 8–12 |
| Intermediate (6–24 months) | 12–18 |
| Advanced (24+ months) | 15–20 |

## 6.4 Weekly Wave Loading

No two weeks within a phase should be identical.

**Base Building (3 weeks + 1 deload):** Week 1: 3×8 establish baseline. Week
2: 3×8 (+1 rep if all completed W1). Week 3: 4×8 add sets (peak volume). Week
4: 2×6 deload.

**Strength (3 weeks + 1 deload):** Week 1: 4×5 moderate intensity. Week 2:
4×4 harder progression or added weight. Week 3: 5×3 peak intensity. Week 4:
2×5 easy variation deload.

## 6.5 Exercise Count Per Session

| Session Type | Total Movements (including warm-up) |
|---|---|
| Strength-focused (Street Lifter) | 8–10 total (5–7 main + warm-up/cooldown) |
| Skill-focused (Skill Builder) | 13–14 total across all 6 slots |
| Hybrid Athlete | 9–11 total |
| Endurance (circuit) | 4–6 per circuit |
| Deload | 6–8 total |

Every exercise has a minimum of 3 sets (except accessories which can have 2).

---

# 7. Warm-Up & Cooldown System

Every session includes a warm-up before the main workout and a cooldown after.
Both are always present by default — the user doesn't need to request them or
interact with the chat to get them.

**Warm-Up (Pre-Workout):** The plan generator assigns a warm-up for each
session automatically.

The warm-up is session-dependent:

| Session Focus | Warm-Up Protocol |
|---|---|
| Push day | General activation (jumping jacks, high knees), shoulder dislocates, scapular push-ups, wrist circles, band pull-aparts, shoulder CARs, thoracic spine rotation |
| Pull day | General activation, band pull-aparts, dead hangs, scapular pulls, light rows, lat stretch, thoracic extension |
| Legs day | General activation, bodyweight squats, hip circles, leg swings, ankle mobility, deep squat holds, hip flexor stretch |
| Skill day (Skill Builder) | Fixed 3-part protocol: (A) 30 s jumping jacks + 30 s high knees → (B) Full wrist sequence (7 drills) + scapular/shoulder block → (C) Bodyline drills (hollow + arch). Skill-focus-aware: push skills get full wrist + anterior shoulder emphasis; pull skills get full wrist + scapular pulls. See §5.2 for full warm-up specification. |

General activation movements (jumping jacks, high knees) are included in every
warm-up. For Skill Builder sessions, the wrist sequence (§5.2) is mandatory
and replaces generic wrist circles.

**Recovery-Aware Additions:** When discomfort has been logged in recent
sessions (either through the chat or inferred from behavioral patterns like
skipped exercises), the plan generator adds targeted prehab/rehab movements to
the warm-up.

**Cooldown (Post-Workout):**

| Session Focus | Cooldown Exercises |
|---|---|
| Push day | Chest doorway stretch, tricep stretch, overhead lat stretch, shoulder sleeper stretch, wrist flexor/extensor work |
| Pull day | Bicep wall stretch, lat stretch, forearm stretch, active hang holds (60s), thoracic extension |
| Legs day | Quad stretch, hamstring stretch, hip flexor stretch, calf stretch, pigeon pose, deep lunge holds |
| Skill day | Wrist flexibility routine, shoulder stretch, forearm stretch, shoulder CARs, pike/straddle stretch |
| All sessions | Dead hang (30–60s), deep squat hold (30–60s) |

**Skippability:** Both warm-ups and cooldowns are designed to be easy to skip.
The app never forces participation — but the exercises are always there.

**Mobility is not a goal — it's built in.** Mobility work is built into every
session through warm-ups and cooldowns, contextualized to the session type. No
user preference needed.

---

# 8. Coaching Intelligence Engine

The Coaching Intelligence Engine (CIE) is the core AI brain of Arnold. It
replicates the decision-making process of an experienced calisthenics coach.

## 8.1 Core Coaching Principles

**Principle 1 — Context Before Reaction:** Never react to user feedback in
isolation. Always cross-reference against the current training phase, recent
history, and the user's stated goals before making a change.

**Principle 2 — Cascading Adaptation:** Changes don't just affect today. A
missed PR ripples forward through the mesocycle. A week off recalibrates the
timeline. The AI always considers downstream effects.

**Principle 3 — Skeptical Trust:** Trust the user's feedback but verify
against data. If someone says "that was maximal" but their recent history shows
smooth performance at that level, the AI pushes back constructively.

**Principle 4 — Train Around, Not Through (Severity-Dependent):** When injury
or discomfort arises, the AI's response scales with the severity. Mild
discomfort (1–5) is acknowledged and monitored. Moderate pain (6–7) triggers
exercise swaps and caution. Severe pain (8+) stops the movement entirely and
restructures the session. In all cases, the AI actively prescribes recovery
and prehab work.

**Principle 5 — Every Exercise Has Intent:** Each exercise in the plan is
tagged with a difficulty intent (challenging, moderate, easy). This determines
how the AI interprets feedback like "I couldn't finish."

**Principle 6 — Silent Adaptation:** The AI adapts the plan even when the user
doesn't provide explicit feedback. Behavioral signals — sessions completed,
reps logged, exercises skipped, rest time patterns, session frequency,
progression stalls — are sufficient to drive plan adjustments. Silence is also
data. The app must always be useful to the user who never touches the chat.

**Principle 7 — Propose and Approve:** When Arnold makes adaptation decisions
between sessions (weight changes, progression advances, exercise swaps), those
changes apply automatically to the next session. However, when the user next
opens the chat, Arnold surfaces what changed and why. The user can acknowledge,
override, or ask questions. This is not a notification or pop-up. If the user
never opens chat, adaptations still apply silently.

**Principle 8 — Knowledge Before Inference:** Arnold's decisions should be
grounded in sports science and established coaching methodology, not inferred
from patterns alone.

**Principle 9 — Deterministic When Possible, Intelligent When Necessary:** If
a decision can be made with a lookup table (e.g., autoregulation: missed 2+
reps → -2.5kg), it stays deterministic. The LLM is reserved for judgment calls
requiring weighing multiple factors.

---

# 9. Decision Logic Framework

## 9.1 Pain / Discomfort Reported

| Pain Level | Immediate Action | Session Impact | Plan Impact |
|---|---|---|---|
| 1–5 (mild) | Continue. Log it. | No change. | Monitor next 2 sessions. If recurring, flag for review. |
| 6–7 (moderate) | Continue with caution. Reduce intensity. | May swap exercise variation. | Recommend physio. Track trend over 1 week. |
| 8–10 (severe) | Stop exercise immediately. | Swap to alternative movement pattern. | Restructure affected sessions. Build rehab/prehab into plan. |

## 9.2 "That Felt Too Easy"

| Training Phase | AI Response | Action |
|---|---|---|
| Deload week | "That's by design. Trust the process." | No change. Reassure user. |
| Push / intensity week | "Good — you're progressing." | Progress to next calisthenics progression or add volume. |
| Assessment / test week | "Noted. Recalibrating." | Adjust baseline upward. Regenerate plan targets. |

## 9.3 "I Couldn't Finish My Sets"

| Exercise Difficulty Tag | AI Interpretation | Action |
|---|---|---|
| Tagged: Challenging | Expected. You were meant to struggle. | No change. Encourage. |
| Tagged: Moderate | Possible overestimation. | Evaluate: one-off bad day or systematic? If repeated, regress. |
| Tagged: Easy | Significant overestimation. | Regress immediately. Recalibrate baseline. Ripple changes forward. |

## 9.4 Multi-Week Absence

When the user returns after an extended break, the response scales with
absence duration. Detection fires on the next app open after a gap — Arnold
does not infer absence from the calendar alone.

| Duration Off | Protocol |
|---|---|
| 1–2 weeks | Restart the current microcycle (current training week's sessions) at deload intensity. Return to Train protocol applies. |
| 2–4 weeks | Restart the current phase from week 1 at its starting loads. Return to Train protocol applies. |
| 4+ weeks | Mini-reassessment + fresh mesocycle generation. Progression levels carry over as starting point; assessment data recalibrates within the first 2–3 sessions. |

**Return to Train Protocol (applies to all return scenarios):**

- First 3–5 sessions at 60–70% of pre-absence loads
- RPE capped at 7 for all exercises during this period
- Arnold monitors return via behavioral signals (sets completed, reps achieved,
  exercises skipped)
- After the 3–5 session window, Arnold evaluates whether to step up to full
  loads or extend the Return to Train period by 2 additional sessions

**Chat initiation on return:** When the user opens the app after a 1+ week
absence, Arnold initiates a single check-in message via the chat widget:
*"Welcome back. You've been away for [X] days. I've adjusted the plan to ease
you back in — here's where we're starting."* The user taps "Got it" to proceed
or asks questions. This is the one exception to the "chat is never forced"
rule — return-to-train has a safety dimension that warrants a single proactive
message. After this single message, the chat returns to fully passive behavior.

## 9.5 Silent Adaptation (No Explicit Feedback)

| Behavioral Signal | AI Interpretation | Action |
|---|---|---|
| All sets completed for 2–3 consecutive sessions at a progression | User is ready to advance. | Progress to next variation per progression rules. |
| Exercise repeatedly skipped across sessions | Possible discomfort, dislike, or equipment issue. | Flag for review. If pattern persists, swap to alternative. |
| Session frequency drops below plan | User is struggling with schedule or motivation. | Recalibrate weekly volume to match actual frequency. |
| Reps consistently logged below target on moderate/easy exercises | Possible overestimation of current level. | Evaluate trend. If persistent, regress progression. |
| User completes sessions but never engages chat | User is in "just train" mode. | Continue silent adaptation. Do not force engagement. |

## 9.6 Autoregulation (Weight Progression)

Session-to-session weight adjustments are deterministic. After every completed
session, the autoregulation engine evaluates performance against the prescribed
targets and applies adjustments for the next session.

| Last Session Performance | Next Session Adjustment |
|---|---|
| All reps clean, RPE below target | +2.5kg |
| All reps clean, at target RPE | +1.25kg |
| All reps clean, RPE above target | No change — consolidate |
| Missed 1 rep on last set | No change — retry |
| Missed 2+ reps or RPE 10 | -2.5kg, rebuild |

**RPE source hierarchy:** (1) User-reported RPE via chat, (2) inferred RPE from
behavioral signals (completion rate, rest time patterns, finisher rep trends),
(3) phase-default RPE targets.

**Finisher trend as fatigue gauge:** The max(-2) finisher set tracks fitness vs.
fatigue over time. Reps trending up over 3+ sessions = fitness building. Reps
trending down = fatigue accumulating, may need deload pulled forward.

**Plate rounding:** All weight adjustments round to the nearest 1.25kg
increment. Adjustments below 2.5kg total added weight are rounded to 0.

## 9.7 Adaptation Surfacing

When the autoregulation engine or silent adaptation system makes changes
between sessions, those changes are queued for surfacing.

**How adaptations are surfaced:** When the user opens the chat, Arnold checks
for pending adaptations and mentions them first.

**Pattern:** Arnold states what changed and why in one sentence.

Examples:
- "Bumped your dip working weight to +27.5kg — last session was clean at RPE 7."
- "Moving you to archer pull-ups. You've been clean at chest-to-bar for three sessions."
- "Dropped your pull-up weight back to +12.5kg — you missed reps two sessions in a row. We'll rebuild."
- "Deload next week. I know it feels unnecessary — trust the process."

**User response options:** "Sounds good" / "Why?" / "Keep it the same"

If the user taps "Keep it the same," Arnold reverts the change and notes the
override. If the user never opens chat, adaptations apply silently.

## 9.8 Autoregulation Deduplication by progressionId

The autoregulation loop generates at most one AdaptationItem per `progressionId`
per session. When multiple exercises in a session share the same `progressionId`
(e.g., ramp sets, main working sets, and volume back-off sets of the same lift),
only the highest-priority role drives the adaptation decision:

**Priority order:** `main` → `volume` → `accessory` → `finisher`

The winning role's performance data (sets completed, reps achieved, RPE)
determines the weight delta. That delta is then applied proportionally across
all exercises sharing the `progressionId` at the start of the next session
(§9.9).

**Rationale:** Generating separate AdaptationItems for each variant of the same
lift would produce compounding weight adjustments (e.g., +2.5kg from the main
set AND +2.5kg from the volume set = a +5kg error). One decision per lift, per
session.

## 9.9 Proportional Scaling on Session Start

When a queued weight delta is applied at session start, the adjustment
propagates across all exercises sharing the same `progressionId`:

1. Locate the `main` role exercise for the `progressionId`
2. Compute `ratio = newKg / oldKg` (where `newKg = oldKg + delta`)
3. Apply the same ratio to every other exercise sharing that `progressionId`
   (ramps, volume work, finisher)
4. Round all results to the nearest 1.25kg increment
5. Clamp at 0kg minimum
6. **Fallback:** If the main exercise weight is 0kg (bodyweight exercise), or
   no `main` role is found for the `progressionId`, skip ratio scaling. Apply
   the delta to the main only; leave all other roles unchanged.

**Example:** Main set at 43.75kg receives a +2.5kg delta → new main = 46.25kg,
ratio = 1.057. A 22.5kg ramp scales to 23.78kg → rounds to 23.75kg. A 28.75kg
volume set scales to 30.39kg → rounds to 30.25kg.

---

# 10. Calisthenics Progression System

Calisthenics is uniquely suited to AI coaching because progressions follow
skill trees. Unlike gym training where you simply add weight, calisthenics
requires mastering movement patterns through increasingly difficult variations.

## 10.1 Example Progression Trees

**Pull:** Australian rows → Negative pull-ups → Band-assisted pull-ups → Full
pull-ups → Chest-to-bar → Archer pull-ups → L-sit pull-ups → Weighted pull-ups
→ One-arm progression → Muscle-up transition

**Push:** Wall push-ups → Incline push-ups → Full push-ups → Diamond push-ups
→ Archer push-ups → Pseudo planche push-ups → Dips → Ring dips → Handstand
push-up progression

**Legs:** Bodyweight squats → Split squats → Bulgarian split squats → Pistol
squat negatives → Assisted pistol squats → Full pistol squats → Weighted pistol
squats → Shrimp squats

**Core:** Dead bugs → Hollow body holds → Hanging knee raises → Hanging leg
raises → Toes to bar → L-sit progression → Dragon flag negatives → Full dragon
flags → Front lever progression

**Skills:** Crow pose → Frogstand → Wall handstand → Free handstand → Handstand
walk → Planche lean → Tuck planche → Advanced tuck → Full planche

## 10.2 Progression Rules

**Advance when:** User completes all prescribed sets and reps at the current
progression for 2–3 consecutive sessions with good form.

**Regress when:** User consistently fails to complete sets at a progression
tagged as moderate or easy, or reports pain above 6/10 during the movement.

**Hold when:** User is completing sets but reporting high difficulty on a
progression tagged as challenging. This is working as intended.

---

# 11. Adaptive Programming

## 11.1 Plan Structure

| Timeframe | Component | Purpose | Adaptability |
|---|---|---|---|
| Macrocycle (12 weeks) | The full mesocycle for the selected program path | Direction and timeline | Goal dates shift based on progress |
| Phase (3–4 weeks) | A training block within the mesocycle | Specific adaptation focus | Volume/intensity adjusts based on weekly performance |
| Microcycle (1 week) | Weekly schedule of sessions | Day-to-day structure | Exercises can swap same-day |
| Session | Individual workout | Execute the work | Real-time adaptation mid-session |

## 11.2 PR Scheduling & Cascading Changes

The AI schedules PR attempt dates within the mesocycle. If a user fails a PR
attempt, the AI doesn't simply retry next week. It analyzes why, adjusts the
supporting training for the following weeks, and reschedules the attempt.

## 11.3 Program Path Awareness

The cascading adaptation logic is program-path-aware:

- **Street Lifter:** Failed weighted PR → increase volume at lower weight for
  2–3 weeks → reattempt
- **Skill Builder:** Stuck on a skill progression → increase supporting
  strength work for that pattern → reattempt in 2–3 weeks
- **Hybrid Athlete:** Failed skill PR → check if weighted strength in that
  pattern has also stalled. If yes, increase weighted volume first, then
  reattempt skill. If weighted strength is fine, increase specific skill
  practice volume
- **Endurance:** Benchmark workout regression → check if rest periods have
  been shortened too aggressively → adjust pacing

## 11.4 The Autoregulation Loop

The autoregulation loop is the primary feedback system that makes the plan
feel alive. It runs after every completed session:

1. **Collect signals:** Sets completed vs. prescribed, reps achieved, RPE (if
   reported via chat or inferred from behavior), exercises skipped, rest time
   patterns, session duration, finisher reps.

2. **Apply autoregulation rules:** Deterministic lookup against the
   autoregulation table (Section 9.6). Weight adjustments, progression
   advances/holds/regressions. No LLM cost, instant.

3. **Deduplicate by progressionId:** At most one AdaptationItem per
   `progressionId` per session (§9.8). Highest-priority role wins.

4. **Queue adaptations:** Store pending changes (weight adjustments, progression
   changes, volume modifications) for the next session.

5. **Apply to next session:** When the next session is loaded, queued
   adaptations are incorporated via proportional scaling (§9.9).

6. **Surface to user:** When the user opens chat, Arnold mentions queued
   adaptations (Section 9.7). User can approve or override.

The loop operates independently of the chat. A user who never opens chat still
gets a program that adapts session-to-session.

## 11.5 Plan Restructuring Triggers

| Trigger | Handler | Reason |
|---|---|---|
| Weight adjustment (session-to-session) | Deterministic (autoregulation table) | Simple lookup |
| Progression advance/regress | Deterministic (behavioral signal threshold) | Clear criteria: 2–3 clean sessions → advance |
| Failed PR attempt | LLM (Plan Restructurer agent) | Requires weak link analysis and multi-week replanning |
| Injury (severity 6+) | Deterministic (immediate safety) + LLM (replanning) | Immediate removal is deterministic; multi-week redesign requires judgment |
| Plateau detected (3+ weeks no progress) | LLM (Progress Analyst → Plan Restructurer) | Requires pattern analysis and path-specific intervention |
| Path switch | Deterministic (new TypeScript generator) | New mesocycle generation |
| Goal change via chat | LLM (interprets) → Deterministic (adjusts) | Interpretation needs LLM; execution is deterministic |
| Extended absence (1+ weeks) | Deterministic (rules) + LLM (degree of regression) | Rules define type; LLM determines how much to regress |
| Fatigue accumulation (finisher trend declining) | Deterministic (pull deload forward) | Clear signal: declining reps + rising RPE → deload |

---

# 12. Interaction Model

Arnold is one app with one experience. There are no modes. The workout is the
primary interface — clean, minimal, glanceable. The chat is the coaching brain
— always present in the corner, never forced. The 3D viewer is the form
reference — available on every exercise with a tap.

## 12.1 The Workout Interface

The main screen during a session is clean and minimal. Exercise cards stacked
vertically, current exercise highlighted. Each card shows the exercise name,
sets/reps target, and current progress. Between sets, a rest timer counts
down. The user taps a large DONE button to complete a set and advance. Every
exercise card has a tap target to open the 3D viewer.

## 12.2 The Coaching Chat

In the corner of the screen sits a chat icon. This is Arnold's brain. It's
always there, always aware, never demanding attention. The user can complete
weeks of training without ever tapping it — and the program still adapts
through silent behavioral data.

**Interactive Questions:** Arnold asks structured questions with tappable
options.

**Contextual Awareness:** When the user says "I failed the last set," Arnold
knows which exercise, what difficulty it was tagged as, and where in the
program the user is.

**Pain/Discomfort Flow:** The user mentions something hurts. Arnold asks: "From
1–10, how much?" → [1–3] [4–5] [6–7] [8+]. Every response leads to a concrete
plan change if the user agrees.

**Program Adaptation:** When Arnold suggests a change, the user sees it
clearly. If yes, the program updates in real-time and changes cascade forward.

**Always Available, Never Required:** The chat is accessible at any point
during the session. The user is never prompted, interrupted, or nudged to use
it.

## 12.3 3D Viewer Widget

Available on every exercise in the session. Tap any exercise card to open the
3D viewer showing Arnold's figure performing the movement with perfect form.
Rotatable (swipe), zoomable (pinch), pausable (tap). Primary muscles
highlighted in red, secondary in orange.

**New Exercises:** Full-screen takeover with "Got it" to dismiss. Skip always
available.

**Known Exercises:** Optional tap on the exercise card for a refresher.

**Future Enhancement — Pain Locator:** The 3D figure could double as a pain
input tool.

## 12.4 Voice (Optional Layer — Phase 2)

Voice is available as an optional hands-free mode. The app is designed to work
perfectly without voice.

---

# 13. Feature Roadmap

## 13.1 MVP (Phase 1) — Calisthenics Coach

- Onboarding flow with program path selection, experience level, and optional
  PR input — two taps minimum to start training
- Day preference tagging (Train / OK if needed / Blocked) with auto-spread
  default
- AI-generated 12-week mesocycle based on selected program path
- Evidence-based session structure with exercise roles (skill practice →
  skill isometric → heavy compound → volume → complementary → accessories)
- Interactive coaching chat with tappable options + free text — always
  available, never required
- Session screen: exercise cards, rest timers, DONE button, chat widget, 3D
  viewer on every exercise
- Warm-ups always included by default (fixed 3-part structure for Skill
  Builder; session-type-aware for all paths)
- Post-workout cooldown always included by default
- 3D exercise viewer with rotatable Arnold figure, muscle highlighting, and
  written exercise breakdown
- Silent adaptation from behavioral data
- Core decision logic (pain, too easy, can't finish, missed time)
- Calisthenics progression trees for all major movement patterns + all 5
  skill focuses (Planche, Front Lever, Handstand, Muscle-Up, Back Lever)
- Weekly wave loading — no two weeks identical within a phase
- Streak system (daily, weekly, milestones, streak freeze)
- Smart scheduling: 1-session cascade with amber Undo pill, Plan Realignment
  dialog (2+ missed sessions)
- Post-session feedback via chat — optional, not forced
- Basic progress dashboard (PRs, streaks, progression levels)
- Program path switching via chat at any time
- Return-to-train protocol with single proactive chat message (sole exception
  to passive chat rule)

## 13.2 Phase 2 — Expansion

- Voice mode ("ARNOLD" wake word for hands-free coaching)
- Pain locator: tap directly on Arnold's 3D body to specify discomfort
- Gym / hypertrophy mode (new program path)
- Holistic tracking: sleep, nutrition, mood, energy, recovery
- Proactive nudges and scheduling intelligence
- Wearable integration (Apple Watch, Garmin)

---

# 14. 3D Exercise Viewer

The 3D exercise viewer displays any exercise as an interactive 3D figure
(Arnold's character) performing the movement with perfect form. Available on
every exercise in the app — warm-ups, main workout exercises, and cooldown
stretches.

**Always Available:** Every exercise card in the session has a tap target to
open the 3D viewer. The 3D figure is rotatable, zoomable, and pausable.
Primary muscles highlighted in red, secondary in orange.

**Exercise Breakdown:** Below the 3D figure, a written description breaks down
the exercise: target muscles, form cues, common mistakes, and what this
exercise is meant to achieve within the user's current program.

**New Exercises — Full-Screen Takeover:** When Arnold introduces a new exercise
progression for the first time, the 3D viewer automatically takes over the
screen. A "Skip" option is always available.

**Known Exercises — Optional Tap:** For exercises the user has seen before, the
3D viewer is a tap target on the exercise card. No automatic takeover.

**Purpose:** Replaces the need for YouTube form videos. Consistent, clean,
angle-adjustable form reference with a detailed written breakdown — without
ads, bad advice, or distraction.

**Future Enhancement — Pain Locator:** The 3D figure could double as a pain
input tool.

---

# 15. Technical Architecture (High-Level)

## 15.1 Core Components

**Mobile App (iOS first):** React Native (Expo). Handles UI, 3D viewer,
interactive chat interface, and local session state.

**Coaching Engine (Backend):** Three-layer AI architecture: Knowledge
(structured coaching data), Decisions (rules engine + LLM judgment), Voice
(conversation agent). A rules engine handles deterministic decisions
(autoregulation, progression gates, pain thresholds). LLM agents handle
judgment calls (plan restructuring, plateau analysis, coaching conversations).

**Knowledge Engine:** Structured JSON files containing coaching knowledge
distilled from program bibles, sports science, and exercise science. Six
domains: periodization, exercises, autoregulation, injury management, skill
acquisition, and coaching guidance. The orchestration layer selects relevant
knowledge snippets based on user state and injects them into agent calls as
context packets.

**Plan Generators:** Initial mesocycle generation uses path-specific TypeScript
generators (deterministic, instant, free). Each path has its own generator.
No blending engine. LLM-based Plan Restructurer handles mid-cycle changes
requiring coaching judgment.

**Autoregulation Engine:** Deterministic system that adjusts weights,
progressions, and volumes session-to-session based on performance data.
Implements the autoregulation table (§9.6) and deduplication rules (§9.8).
Applies proportional scaling on session start (§9.9). Operates without LLM
cost.

**Silent Adaptation Engine:** Processes behavioral signals and triggers plan
adjustments without requiring explicit user feedback.

**Interactive Chat Layer:** The coaching interface. Must feel fast and
responsive — under 1 second for option-based responses, under 3 seconds for
AI-generated coaching responses. Never forces engagement. Surfaces pending
adaptations when the user opens chat.

**API Proxy (`arnold-proxy`):** All Anthropic API calls are routed through a
Supabase Edge Function (`arnold-proxy`) rather than called directly from the
client. The client sends requests to the Edge Function; the Edge Function holds
the Anthropic API key server-side and forwards the call. This keeps the API
key out of the app bundle entirely. The proxy is stateless — it does not modify
request or response payloads. The client still owns context assembly (context
packets, system prompts, conversation history). Cost accounting and rate
limiting can be enforced at the proxy layer in future iterations.

**3D Viewer Engine:** Renders animated 3D exercise figures with muscle
highlighting for every exercise in the app.

**Data Layer:** User profile, program path, training history, plan state,
progression levels, behavioral signals, chat/feedback logs, path-specific
goals, adaptation queue (pending changes between sessions). Local state is
managed with Zustand + AsyncStorage (offline-first, session state survives
app restart). Remote sync via Supabase (auth + `profiles` table). The
`profiles` table includes `program_path` (the user's current active path:
`street-lifter`, `skill-builder`, `hybrid-athlete`, `endurance`) and `tier`
(`beginner`, `intermediate`, `advanced`). These columns are the authoritative
remote source for path and tier — local AsyncStorage mirrors them; the Supabase
record is written on onboarding completion. Cross-device sync reads from
`profiles` on first launch. Known limitation: if the Supabase write fails at
onboarding, cross-device sync silently falls back to local-only state (deferred
resolution, not a user-visible error in MVP).

**Voice Layer (Phase 2):** Optional speech-to-text + text-to-speech layer for
hands-free interaction.

**Build Infrastructure (EAS):** Three Expo Application Services build profiles
are in production use:

| Profile | Target | API endpoint | Notes |
|---|---|---|---|
| `development` | Local dev client | Dev tunnel or localhost | DEV affordances enabled (skip onboarding, prefill, debug panel, sim buttons) |
| `preview` | Internal TestFlight | Staging Supabase project | DEV affordances off. Used for QA and stakeholder review. |
| `production` | App Store | Production Supabase project | DEV affordances off. Supabase keys differ from preview. |

DEV affordances are gated by the `development` build profile flag and are
never compiled into `preview` or `production` builds.

## 15.2 Four Specialized Agents

All LLM calls use the Claude API, routed through the `arnold-proxy` Edge
Function (see §15.1). The client assembles context packets and system prompts;
the proxy forwards them to Anthropic server-side. Specialized system prompts
per agent.

| Agent | When It Fires | Purpose |
|---|---|---|
| Conversation Agent | Every chat interaction | Arnold's voice. Receives context packet + rules decision. Communicates coaching in Arnold's persona. Surfaces adaptations. |
| Session Adapter | Mid-session: pain, exercise swap, volume change | Modifies remaining exercises in the current session. |
| Progress Analyst | Post-session (when chat was engaged) + weekly | Trend detection, plateau identification, fatigue monitoring. Feeds findings into adaptation queue. |
| Plan Restructurer | Failed PR, plateau, injury replanning, goal change | Modifies affected mesocycle sections. Only fires for changes requiring coaching judgment. |

Quick response bypass handles ~80% of interactions without an LLM call. Target
cost: under €1.50/user/month for active users.

## 15.3 Context Packets

Every agent call receives a context packet assembled by the orchestration layer:

- **User state:** Program path, tier, training phase, week number, day type,
  bodyweight, estimated 1RMs
- **Current session:** Exercises completed, next exercise, target weights, sets
  remaining
- **Recent history:** Last 3–5 sessions (completion rates, RPE, pain flags,
  finisher trends)
- **Pending adaptations:** Queued changes from autoregulation loop
- **Knowledge snippets:** Relevant coaching knowledge selected based on the
  user's path, tier, phase, and current context

## 15.4 Knowledge Evolution Path

| Phase | Approach | Timeline |
|---|---|---|
| MVP | Structured JSON knowledge base, manually curated from program bibles + sports science fundamentals | Now |
| Post-MVP | RAG with curated corpus: peer-reviewed papers, coaching textbooks, validated protocols. Vector DB replaces JSON for flexible retrieval | 3–6 months post-launch |
| Scale | Fine-tuning on real coaching data: programs designed by verified coaches, adaptation decisions with outcomes, coaching conversations rated by athletes | 6–12 months post-launch, requires 500+ active users |

---

# 16. AI Brain Architecture

For the full AI brain architecture, including the three-layer model (Knowledge
→ Decisions → Voice), knowledge base structure, autoregulation loop design,
adaptation surfacing UX, agent prompt architecture, cost model, data collection
strategy, and build phases, see the companion document: **Arnold AI Brain
Strategy v1.0**.

The AI Brain Strategy is the authoritative reference for all AI-related
decisions. It extends Sections 8, 9, 11, and 15 of this spec with
implementation-level detail. The hierarchy is:

1. This Product Spec (what Arnold does)
2. AI Brain Strategy (how Arnold's intelligence works)
3. Program Bibles (coaching knowledge source material)
4. MVP Builder Instructions (how to build it)

---

# 17. Open Questions & Research Needed

**Sports Science Validation:** The pain thresholds, progression rules, and
deload protocols need review by a qualified sports scientist or physiotherapist.

**Chat Response Quality:** The interactive coaching chat is the core product
experience. This requires extensive eval datasets covering every coaching
scenario, tested against real coaching behavior.

**Silent Adaptation Accuracy:** How reliably can the AI infer the right
adjustments from behavioral data alone?

**AI Honesty Detection:** The "skeptical trust" principle — how reliably can
the AI detect when a user is exaggerating effort or sandbagging?

**3D Model Feasibility:** The exercise viewer requires a library of 3D animated
movements covering every exercise in the progression trees, warm-ups, cooldowns,
and now the full Skill Builder exercise pool (wrist sequence, bodyline drills,
prehab exercises across all 5 skill focuses).

**Interactive Chat UX:** The tappable-options conversation model needs UX
testing with real users.

**Voice Recognition (Phase 2):** Gym/park environments are acoustically
challenging.

**Liability & Health Disclaimers:** Legal review needed for liability around
pain management advice.

**Calisthenics Progression Research:** The progression trees need to be
comprehensive and validated. The Skill Builder program bible requires an updated
version incorporating the 6-slot session template and full exercise pools.

**Program Path Validation:** Each of the four program paths needs validation
against established coaching methodology.

**Endurance Session Formats:** The AMRAP, EMOM, and circuit formats need UX
testing to ensure they work within Arnold's session screen.

**Path Switching Impact:** When a user switches paths mid-mesocycle, how much
of their current plan is preserved?

**Hybrid Athlete Specialization Phase:** In weeks 9–10, the Hybrid path asks
the user to choose emphasis (weighted PRs or skill PRs). How does Arnold
present this choice?

**Knowledge Base Depth vs. Generator Logic:** How much coaching knowledge
should live in the JSON knowledge base vs. hardcoded in the TypeScript
generators?

**Pain reporting flow:** Button exists in code; deeper logic not defined.

**Mid-session failure chat flow:** Chat routing for in-session failures not
fully specced.

**Goal-tracking UI / Progress screen:** Targets collected in onboarding but
never displayed. Needs screen spec before build.

**Skill Builder Program Bible update:** The Skill Builder Program Bible v1.0
requires a companion update incorporating the 6-slot session template, full
exercise pools for all 5 skill focuses across all progression levels, and
the complementary lift + prehab accessory pools documented in §5.2.

**Fine-Tuning Data Requirements:** When do we have enough data to begin fine-
tuning? Estimated: 500+ active users for 3+ months.

**World-Class Knowledge Sourcing:** Options for deepening Arnold's coaching
knowledge: (a) study published programs from top calisthenics coaches, (b) hire
a sports scientist to review and expand the program bibles, (c) partner with
competitive calisthenics coaches for validation.

This document is not the final version. It is a working foundation that
captures the product's direction, core logic, and interaction model as they
exist today. Every section will evolve as we validate through sports science
research, user testing, and real-world usage. The structure is the product;
the details adapt.

---

# Changelog

**v2.3 → v2.4 | May 2026**

**Added:**
- **§5.2 Skill Builder — 6-slot session template.** Replaces the previous
  2–3 exercise output. Slots: (1) Warm-up (pulse raiser + 7-drill wrist
  sequence + scapular block + bodyline drills), (2) Skill practice
  (submaximal CNS), (3) Primary skill isometric (accumulation-based, sets ×
  seconds), (4) Complementary lift (bent-arm, same pattern), (5) Prehab
  accessories (skill-specific + antagonist), (6) Core finisher + cooldown.
  Sessions now 13–14 movements, 44–65 minutes. Validated against FitnessFAQs
  Planche Pro, BWF Recommended Routine, GMB 5P framework, Calisthenic
  Movement, and Steven Low's Overcoming Gravity.
- **Exercise pools** for all 5 skill focuses (Planche, Front Lever,
  Handstand, Muscle-Up, Back Lever) across all 6 slots.
- **`skill-practice` and `skill-isometric` roles** added to §6.1 exercise
  role taxonomy. `skill-isometric` uses `unit: "seconds"` in the schema.
- **§6.5 exercise count** updated: Skill Builder now 13–14 total movements.
- **§7 warm-up** updated: Skill Builder sessions use the fixed 3-part
  protocol (§5.2) rather than the generic skill-day warm-up. Skill-focus-
  aware pool selection.
- **Build flag:** Session screen must display "Hold X seconds" not "X reps"
  for `skill-isometric` exercises.

**Added (v2.3.1):**
- **§4.4 — `lastStreakCheckWeek` + `weeklyDrops` store fields.** Bridge
  between Plan Realignment Option 2 and `currentWeekly` increment logic.
- **§15.1 — API Proxy.** `arnold-proxy` Supabase Edge Function routes all
  Anthropic API calls. Stateless. API key server-side.
- **§15.1 — Data Layer.** `profiles` table now includes `program_path` and
  `tier`. Known limitation: silent local-only fallback if Supabase write
  fails at onboarding.
- **§15.1 — EAS build profiles.** `development` / `preview` / `production`
  documented. DEV affordances gated to `development` only.
- **§15.2 — Agent calls** updated to reference proxy routing.

**Added (v2.3):**
- **§4.5 The Schedule** — day preferences, 1-session cascade, Plan
  Realignment dialog (+2 week extension cap), cascade decision table.
- **§4.4 addendum** — streak reset trigger (3-condition guard), `currentWeekly`
  increment logic with adjusted scheduled session count definition.
- **§4.1 Step 4** — day-tagging onboarding step. Steps 4–6 renumbered to 5–7.
- **§9.8** — autoregulation deduplication by `progressionId`.
- **§9.9** — proportional scaling on session start.
- **§11.4** — autoregulation loop updated to reference §9.8 and §9.9.

**Replaced (v2.3):**
- **§9.4 Missed Training Time** (general table) → **§9.4 Multi-Week Absence**
  (specific duration tiers + Return to Train protocol + single proactive chat
  message on return).

**Open questions added to §17:**
- Pain reporting flow
- Mid-session failure chat routing
- Goal-tracking UI / Progress screen
- Skill Builder Program Bible companion update required

---

*End of Product Specification v2.4*
