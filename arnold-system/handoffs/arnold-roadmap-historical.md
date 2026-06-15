# Arnold — Roadmap

**Last updated:** June 2026
**Owner:** Spec chat
**Status:** Living document. Updated as decisions ship or shift.

---

## What we did

**Core product (shipped)**
- Conversational onboarding (path, schedule, experience, benchmarks, tier assignment)
- Plan generation for Street Lifter, Skill Builder, Hybrid Athlete (beginner + intermediate)
- Session lifecycle (warm-up → exercises → cooldown) with sets, reps, rest
- Silent adaptation engine + deduplication by `progressionId`
- Proportional weight scaling on session start
- Chat infrastructure (corner widget, slide-up overlay, deterministic + LLM fallback)
- Home screen (streak, program status, session card, week pills, swap modal)
- 1-session cascade with amber Undo pill
- Streak reset on missed week
- `arnold-proxy` Edge Function (Anthropic calls server-side)
- Supabase auth + profiles table with `program_path` and `tier`
- EAS build profiles (dev / preview / production)

**Spec amendments (shipped or sanctioned)**
- v2.4.1 — Skill Builder 7-card slim generator
- v2.4.3 — Account deletion (Apple ship blocker)
- v2.4.4 — Email-gated DEV access for real-device testing
- v2.4.5 — Warm-up interaction model + ramp-up shape with exercise floors
- v2.4.6 — Health + AI disclaimers, removed GitHub OAuth
- v2.4.7 — Session duration tiers (superseded by v2.4.9, kept as history)
- v2.4.9 Part 1 — Session length redesign framework

**Infrastructure**
- TestFlight live with 5 testers + public link

---

## What we want to do

**Immediate (MVP 1.14–1.19)**
- Ship v2.4.5 (warm-up + ramp shape engine + UX)
- Ship v2.4.6 (disclaimers + email-only auth)
- Ship v2.4.8 (post-session review script + persona enforcement) — pending AI Brain chat clarifications
- Ship v2.4.9 Part 1 (session length onboarding + supersede v2.4.7 cut logic)

**Pre-App-Store submission**
- Privacy policy drafted + hosted (GitHub Pages recommended)
- App rename (final public-facing name)
- App Store screenshots, keywords, description
- Fix Supabase `profiles` schema sync bug

**Spec items still open (§17)**
- Pain reporting flow
- Mid-session failure chat routing
- Goal-tracking / Progress screen
- Street Lifter complementary lift pool
- Hybrid Athlete Specialization Phase chat surfacing
- Path switching mid-mesocycle
- Coach data structured log (for future fine-tuning)
- v2.4.9 Part 2 — Per-path × session-type compression tables (needs program-bible review)

**Post-TestFlight validation**
- Merge all amendments into master → `arnold-product-spec-v2_5.md`
- Full Skill Builder v1.5 (6-slot template + 7-drill wrist sequence)
- Skill Builder Program Bible v2.0
- Professional coach review of compression tables and cut rules
- Sign in with Apple + Google (if user demand emerges)

**Phase 2 (longer term)**
- Voice mode
- 3D pain locator
- Wearable integration
- Endurance path generators
- RAG knowledge base (replace static JSON)
- Fine-tuning on coach data (500+ users, 3+ months)
