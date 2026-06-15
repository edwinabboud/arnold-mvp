# Arnold Coach — App Store Metadata Package

**Status:** Draft for TestFlight → App Store submission. Written for the current calisthenics-focused product; rewrite when the app scales to gym/stretching/recovery.
**Public name (current):** Arnold Coach *(placeholder — rebrand before public launch per trademark scan)*
**Primary audience:** Intermediate, skill-curious calisthenics athletes. Beginner-friendly on-ramp language as secondary.
**Monetization:** Paid subscription from day one.

---

## 1. App Name (30 char max)

Apple's app name field caps at 30 characters. Options:

- **`Arnold: Calisthenics Coach`** (27 chars) ← recommended
- `Arnold Calisthenics Coach` (25 chars)
- `Arnold Coach` (12 chars — too generic, wastes the keyword real estate in the name)

**Recommendation:** `Arnold: Calisthenics Coach` — the name field is indexed for search, so including "Calisthenics" here is free keyword weight. Don't waste the name on just "Arnold Coach."

---

## 2. Subtitle (30 char max)

Appears under the name in search + product page. High-value keyword + positioning real estate.

- **`AI plans for pull-ups & skills`** (30 chars) ← recommended
- `Your AI calisthenics coach` (26 chars)
- `Skill & strength programming` (28 chars)

**Recommendation:** the first — it packs "AI", "plans", "pull-ups", "skills" into 30 chars, all searchable terms, and signals the value (planning + skills) immediately.

---

## 3. Keywords (100 char max, comma-separated, NO spaces after commas)

Apple gives one 100-char keyword field. Rules: don't repeat words already in your name/subtitle (wasted), don't use spaces after commas (wasted chars), singular covers plural in most cases, don't keyword-stuff competitor brand names (rejection risk).

**Recommended 100-char string:**
```
workout,planche,muscleup,lever,handstand,dips,progression,bodyweight,strength,gym,fitness,training,reps
```
(99 chars)

Rationale:
- `planche`, `muscleup`, `lever`, `handstand`, `dips` — the specific skills your intermediate ICP searches for. This is your differentiation; generic "fitness" apps don't rank for these.
- `progression` — core to your product (the whole engine is progression-based)
- `bodyweight`, `strength`, `gym` — broaden reach without diluting
- Did NOT include: "calisthenics" (already in app name = indexed), "AI" (already in subtitle), "coach" (already in name) — repeating them wastes characters
- Did NOT include competitor brand names (Caliverse, Thenx, etc.) — Apple rejects brand-jacking

---

## 4. Promotional Text (170 char max — editable anytime without app update)

Shows at the top of the description. Use it for what's-new / seasonal hooks since it's editable without resubmitting a binary.

**Recommended:**
```
Arnold reads every set you log and adjusts your plan automatically. No guesswork — just the next session, dialed in for where you actually are.
```
(143 chars)

---

## 5. Description (4000 char max)

The opening 2-3 lines show before "more" — they carry the conversion weight. Written intermediate-first with a beginner on-ramp.

```
Most training apps hand you a fixed plan and leave you to figure out the rest. Arnold coaches you like a real person would — reading what you actually did each session and adjusting your next workout automatically.

Tell Arnold your goal — your first muscle-up, a clean planche, weighted pull-ups, or all-around strength — and it builds a structured program around where you are right now. Not a generic template. A plan that changes as you do.

HOW ARNOLD COACHES

• Reads every set. Log your reps and how it felt — Arnold adjusts weight, volume, and progression automatically. Have a great session? It pushes. Struggling? It backs off before you stall.

• Asks the right questions. After a workout, Arnold checks in on what actually mattered that day — the skill hold on a skill day, the heavy compound on a strength day — not a generic "how'd it go."

• Talks like a coach, not a chatbot. Short, specific, and grounded in your numbers. No filler, no empty hype.

CHOOSE YOUR PATH

🏋️ Street Lifter — Weighted pull-ups, dips, and squats. Strength-sport periodization with progressive overload.

🤸 Skill Builder — Master muscle-ups, handstands, planche, and front lever. Technique-first, with the supporting strength to back it.

⚡ Hybrid Athlete — Build weighted strength AND unlock advanced skills. Both worlds, one plan.

BUILT AROUND HOW YOU TRAIN

• Set your schedule — 2 to 6 days a week, your preferred days
• Pick your session length — Compact (~40 min), Standard (~60 min), or Recommended (~90 min)
• Every session warms you up properly and progresses you safely
• Your plan rebalances automatically when life gets in the way

Whether you're chasing your first pull-up or your first one-arm progression, Arnold meets you where you are and takes you forward — one adjusted session at a time.

Subscription required. Terms and privacy policy at [URL].
```

**Note:** the final line is a placeholder — fill the real ToS/privacy URLs (the other Sunday task). Apple requires a subscription disclosure line in the description when you're paid-from-day-one.

---

## 6. Category

- **Primary:** Health & Fitness (the obvious, correct choice — calisthenics coaching)
- **Secondary:** none needed, or "Sports" if you want a second discovery surface

---

## 7. Screenshot Plan (the highest-leverage visual asset)

You need 6.7" iPhone screenshots (1290 × 2796) minimum; Apple uses these for the 6.7", 6.5", and smaller displays. Plan for 5-6 screenshots, each with a one-line caption overlay (don't just screenshot the raw UI — add a headline).

Recommended sequence (order = priority, first 2-3 show in search results):

| # | Screen to capture | Caption overlay |
|---|---|---|
| 1 | The chat mid-coaching — Arnold referencing a specific weight/rep | "A coach that actually knows your training" |
| 2 | A generated session (warm-up → main → accessories visible) | "Structured plans that adapt to every set" |
| 3 | Path selection (Street Lifter / Skill Builder / Hybrid cards) | "Train for strength, skills, or both" |
| 4 | Post-session review chat (the smart question + tappable chips) | "Smart check-ins on what actually mattered" |
| 5 | Home screen with streak + week pills + session card | "Your week, organized and on track" |
| 6 | Session length / schedule settings | "Fits your schedule — 40 to 90 minutes" |

Caption style: keep the existing Arnold dark aesthetic, white text, one short line per shot. Tools: Figma, or a screenshot-framing tool like Screenshots.pro / Previewed.

**Important:** Screenshots 1 and 4 are your differentiators — the AI coaching chat is what makes Arnold not just another tracker. Lead with the chat, not the workout list. Every other calisthenics app shows workout lists; almost none show a coach that talks back.

---

## 8. App Preview Video (optional, high-impact — defer if short on time)

15-30 sec. If you make one: show the loop — log a set → Arnold reacts → next session adjusts. The "it responds to me" moment is the whole pitch. Can be added post-launch.

---

## 9. What's Editable Later (for the scale-up to gym/stretching/recovery)

When you broaden beyond calisthenics, these all change with a metadata update (most without even a binary resubmit):
- App name + subtitle (broaden from "Calisthenics" to umbrella positioning)
- Keywords (add gym/mobility/recovery terms)
- Description (add the new paths)
- Screenshots (add gym/stretching/recovery shots)
- Promotional text (instant, no resubmit)

Nothing here locks you in. Write calisthenics-true now; rewrite when the product broadens.

---

## 10. Pre-Submission Checklist (metadata-specific)

- [ ] App name finalized (and rebrand decision made before *public* launch)
- [ ] Privacy policy URL live (separate Sunday task)
- [ ] Terms of Service URL live (separate Sunday task)
- [ ] Subscription disclosure line in description
- [ ] Screenshots rendered at 1290 × 2796 with captions
- [ ] Keywords field ≤ 100 chars, no spaces after commas
- [ ] Age rating questionnaire completed (likely 4+, no objectionable content)
- [ ] Support URL (can be a simple landing page or email)
- [ ] EU trader status declared (DSA requirement — blocks EU downloads until done)

End of metadata package.
```
