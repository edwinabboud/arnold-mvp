# FOCAL — what matters right now

**Updated:** July 6, 2026 (Build 10 prep — ErrorBoundary + goals fix + model bump; repo public-until-launch)
**Build state:** `main` at `becf6f4`; tag **mvp-1.20** is the live code state, tsc baseline 43, tree clean, v2.4.12 shipped. **mvp-1.20 code is live on TestFlight as Build 9** (shipped June 22, 2026; see build-2026-06.md).
**The one goal:** Get Arnold in front of people who are not Edwin and find out if anyone trains a SECOND time. The retention number is the only thing that resolves the open guesses.

Everything below serves that. If a task isn't here or unblocking it, question it.

## NON-NEGOTIABLE next human action
- [ ] **→ NOW LIVE: Enable the TestFlight public link on Build 9 → generate QR code → Madrid park stranger test (watch 2–3 ICP users install + use Arnold live, ~10 min each).** Strategy pivot (founder call, July 3): the F&F testers aren't engaging seriously, so validation moves to strangers — this supersedes the old "send the 5 TestFlight texts" action. Aligns with Overview's recorded position ("get it to strangers now"). The retention goal is unchanged; only the vehicle changed. #1 priority; nothing else starts until this is done.
- [ ] The number: did anyone train twice (week-4 retention >30% gate).

## Capped polish pass (means to shipping, not a goal)
- [ ] 3-day / 5-surface polish so "looks vibe-coded" stops blocking you psychologically. HARD CAP. This is Build's "validate quality myself first" reconciled with Overview's "cap it then ship." Uncapped = avoidance.

## Ship-blockers (do in parallel, none depend on the texts)
- [x] ~~Decide final app name~~ DONE (July 3, 2026): App Store name "Arnold Coach", subtitle "AI Calisthenics Coach" (see DECISIONS.md / OPEN-DECISIONS #2).
- [ ] **Flip `arnold-mvp` private BEFORE App Store public launch.** Repo is intentionally public until launch (founder call, option A, July 6 — see OPEN-DECISIONS #1); it exposes the full brain. Must go private before public launch.
- [ ] **Create always-public `arnold-legal` repo** (privacy.md + ToS) + enable GitHub Pages → paste the live privacy URL into App Store Connect. Separate repo so the store URLs survive the arnold-mvp private flip. ⚠️ BLOCKED July 6: `gh` CLI not installed / no token in this env — external step for Edwin (commands provided in build report). Supersedes the old "enable Pages on docs/" plan.
- [x] ~~Decide mvp-1.20 → TestFlight build: now, or after the capped polish pass.~~ DONE — shipped now (Build 9, June 22, 2026); ship-now path taken, capped polish pass not gated ahead of it.
- [ ] App Store screenshots, keywords, description (needs final name).

## Parked until the retention gate clears
Coach-vs-chatbot rebuild, v2.4.9 Part 2 compression tables, v2.4.10 coach-data, v2.4.11 preview, custom/fine-tuned model, Reddit/content/referral/ads, Phase 2 (voice, 3D, wearables). Map exists; only "Now" is live.
