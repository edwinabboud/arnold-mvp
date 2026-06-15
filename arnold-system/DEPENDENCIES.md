# DEPENDENCIES — what blocks what

Reconciled from both handoffs. v2.4.8 is NOT a blocker (live on main).

## Critical path → App Store submission
1. **Final app name** — "Arnold" vs "Arnold Coach" (ASC listing is currently "Arnold Coach"). Blocks screenshots + listing. See OPEN-DECISIONS.
2. **Privacy live** — enable GitHub Pages on docs/privacy.md, paste URL into App Store Connect (Apple blocker), get Overview review per v2.4.6. Drafts already committed (commit 2171113).
3. **mvp-1.20 → TestFlight build** — decided-but-not-executed. Ship now vs after capped polish pass.
4. **Store assets** — screenshots, keywords, description. Needs final name + final UI.
5. **Submit** (status is "Prepare for Submission", not yet in review).

## Not on the critical path (real, but tidy-up)
- **`UserProfile.goals` type drift** — 2 of the 43 baseline tsc errors; onboarding writes a `goals` shape the type doesn't have. Non-crashing, no confirmed data loss. Fix to drive baseline below 43; not a ship blocker.
- **Session type derived from label substrings** — load-bearing labels; real fix is an explicit `sessionType` field on `PlannedSession` (spec-level, unwritten). Caused the held v2.4.12 #9 rename.
- **node_modules half-install flakiness** — recurring; workaround is full reinstall + `expo start -c`. Eats sessions; wants a permanent fix.

## Blocked, waiting on a decision (not founder time — inter-chat)
- **v2.4.10 coach-data calibration** — decision text never delivered to Build; amendment doesn't exist; coach-data work cannot start. **Overview owes this.** See OPEN-DECISIONS.

## Next single task
> The 5 TestFlight texts. Everything in "Ship-blockers" runs in parallel and none of it depends on the texts — so there is no reason the texts wait.
