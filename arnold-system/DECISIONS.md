# DECISIONS — what stuck

Folded from Overview §2 and Build §6 verbal decisions that were never in a file.
These would have been lost on migration. Each should point to a spec/amendment where one exists.

## Structure & process (Overview)
- **Project collapsed to TWO chats: Build + Overview.** Build executes everything (code, amendments, marketing, distribution, design). Overview decides direction + pushes back, writes no deliverables. The old separate Spec chat no longer exists — amendments are written in Build. Pushback layer stays separate on purpose.
- **Project instructions rewritten** to encode the two-chat model. (Must be mirrored into the local brain on migration.)
- **One deliverable per session** named up front. Build = one thing shipped; Overview = one decision; never both.

## Product & naming (Overview)
- **Name stays "Arnold."** Rename hunt closed. ⚠️ CONFLICT: ASC listing is "Arnold Coach" — unresolved (see OPEN-DECISIONS). Schwarzenegger trademark/likeness check still owed before public launch.
- **Custom/fine-tuned model PARKED to Phase 3** (post-funding, 500+ users). Keeps resurfacing; watch it.
- **Friends = bug-shakeout cohort, not validation.** Real ICP recruited only once stable.
- **Coach-vs-chatbot insight (product gap, N=1):** Arnold behaves reactively, not agentically. Routed to Build → check interaction-model spec first; build-fix if spec already calls for agentic, amend-first if not. Does NOT jump the queue; becomes the first quality iteration AFTER tester feedback. Open: where does it sting most — onboarding / session start / mid-session?

## Build / engineering (Build)
- **v2.4.12 (Calibration Eradication) shipped** — tag mvp-1.20, deviations recorded in its amendment.
- **Tier-confirmation UX:** users change their numbers, never the verdict directly; "I'm new" skips the screen; advanced verdict discloses it runs the intermediate program (no advanced generator exists).
- **Conservative calibration rules:** below-active progressions → "mastered"; weighted squat maps one below top; FL-only → skill_01; unassessed hold → 5s logged baseline.
- **Verification division of labor (standing convention):** Claude Code tests everything code-testable (throwaway harness, PASS/FAIL table); Edwin only verifies screens, only when a screen changed. Belongs in next builder-instructions version.
- **Tags HELD until device verification** — CC commits/pushes on a branch, no merge/tag until Edwin confirms.
- **DEV_PREFILL toggle exists** — must be OFF to see true first-time onboarding.
- **v2.4.8 clarifications RESOLVED** (priority-5 single question, behavioralFlags scoped to skips, Endurance future-spec). Live on main, not blocking.

## Distribution (Overview)
- **Distribution framework v1.1 generated but NOT filed** (held in-chat). Contains locked MVP decision: stop building features, ship to 10, fix only what breaks + build referral, week-4 retention >30% gate. AT RISK if not filed. → file into brain on migration.
- **Tooling rejections:** Notion stays (one Project Map page). Rejected as premature: Obsidian, Airtable, ClickUp, Figma, Stripe Atlas, "Founder Mode" IG. Long-term org = Claude Code + repo (this migration).

## Pending (decided but not yet written to a spec file)
- Explicit `sessionType` field on `PlannedSession` — agreed as the real fix for the label-substring fragility; no amendment yet.
- v2.4.10 decision text — owed by Overview; blocks the amendment.
