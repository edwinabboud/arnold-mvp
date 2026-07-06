# OPEN DECISIONS — owed before migration / before ship

Things only Edwin (or a specific chat) can resolve. The migration should NOT execute
until the founder-owned gates below are answered.

## Founder-owned gates (block the repo migration)
1. ~~**Repo privacy.**~~ ✅ DECIDED (founder call, option **A**, July 6, 2026): **repo intentionally public
   until launch.** (Corrects the earlier "RESOLVED at migration (split)" note, which was inaccurate —
   verified July 6 the full brain is publicly clonable; only `strategy/private/` (saas-guide, xlsx) is
   gitignored, not the rest.) **Ship-blocker added to FOCAL: flip `arnold-mvp` private BEFORE App Store
   public launch.** Legal docs (privacy/ToS) move to a separate always-public `arnold-legal` repo so the
   store-facing URLs survive that flip — see FOCAL ship-blocker (external step, pending).
2. ~~**Final app name.**~~ ✅ RESOLVED (July 3, 2026): App Store name = **"Arnold Coach"** (keep the
   live ASC listing as-is), subtitle = **"AI Calisthenics Coach"** (carries the ICP search keyword).
   Arnold-vs-Arnold-Coach conflict closed in favor of the live listing. Logged in DECISIONS.md; unblocks
   screenshots/listing. (Schwarzenegger trademark/likeness check still owed before public launch — see Carried open flags.)

## Inter-chat owes (block specific work, not the migration)
3. **Overview → Build: deliver v2.4.10 decision text.** Coach-data calibration is blocked with
   no amendment. Build cannot start until Overview writes the actual decision.

## Strategic call to lock
4. **Ship-vs-quality priority.** Overview: get it to strangers now, retention number is #1.
   Build: quality is the bottleneck, Edwin validates first. Reconcile = capped self-validation
   (the 3-day polish pass) THEN ship. Overview owns direction; the call is: cap it, then ship.
   Lock the cap explicitly or it becomes the next avoidance object.

## Carried open flags
- **Four-agent architecture is spec-live but runtime-dormant (Build 10 STOP, July 6).** A request to
  delete/LEGACY-mark progressAnalyst / planGenerator / sessionAdapter / processCompletedSession was
  STOPPED: v2.4.8 explicitly preserves the four-agent architecture (§15.2 — "No new agents… the
  four-agent architecture stands"), which contradicts the "v2.4.8 collapsed to conversation+rules"
  premise. At runtime only the conversation agent fires — a spec-vs-reality GAP, not settled dead code.
  Resolve by decision (check base spec §15.2, then either wire them, or amend the spec to formally
  retire them) before any deletion. Safe half done: DEFAULT_MODEL → claude-sonnet-4-6 so the dormant
  paths can't call a retired model.
- Schwarzenegger trademark/likeness exposure — before commercial public launch.
- Does live v2.4.8 architecture actually produce coach-like (agentic) behavior or only Q&A?
  Build to verify against spec — this is the first quality iteration target, post-feedback.
- v2.5 spec merge — many amendments now stacked; optional to do during migration (Build suggests
  yes; Overview roadmap parks it post-validation). Not urgent.
