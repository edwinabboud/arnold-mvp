# Arnold — Migration Handoff (for the Migration / Meta-Project Chat)

**Date:** June 14, 2026
**From:** Build chat (MVP 1.18)
**Your job (this chat):** Stand up the local `arnold-system/` brain folder, migrate the right files into it, and govern how the project brain lives as local files that Claude Code (CC) edits directly. You are **not** building app features and **not** deciding product direction — you set up the *structure the other chats read from*.

**Repo:** `github.com/edwinabboud/arnold-mvp` (PUBLIC) · local `/Users/edwinblanco/Desktop/arnold mvp`
**main HEAD:** `09d9e7d` · tag **mvp-1.20** · tsc **43** · tree clean
**Companion doc:** `build-2026-06.md` (full build-state record).

---

## 0. The one decision to make BEFORE anything moves

The repo is public. Moving the brain in exposes specs, bibles, and strategy docs. Decide first:
- (a) Accept exposure — specs/bibles arguably fine public.
- (b) Split — specs/bibles/amendments public; sensitive strategy (saas-building-guide, launch playbook, monetization/ICP) in a private repo or gitignored `arnold-system/private/`.
- (c) Flip the whole repo private.

**Recommendation: (b).** Don't push the brain until decided — it can't be un-leaked. [RESOLVED: split chosen; saas-building-guide + xlsx live in strategy/private/, gitignored.]

---

## 1. Target structure

`arnold-system/` at repo root, sibling to `src/` and `docs/`:

```
arnold-system/
├── INDEX.md         ← entry point: currency table. CC reads FIRST.
├── spec/            ← arnold-product-spec-v2_4.md
├── amendments/      ← arnold-spec-v2_4_*-amendment.md
├── bibles/          ← program bibles + path-specific-goals
├── strategy/        ← ai-brain-strategy, mvp-builder-instructions, app-store-metadata (+ private/)
└── handoffs/        ← build + migration handoffs
```

---

## 2. What moves, what's left, what's missing

**Migrate (current):** everything in §1.
**Do NOT migrate:** v2.2/v2.3/v2.3-additions (absorbed); cascade-and-forget memo (rejected); duplicate v2.4.8 draft; v2.4.2 plate-rounding (parked).
**Mark SUPERSEDED in INDEX:** v2.4.7 (→ v2.4.9); v2.4.1 (partly overridden by v2.4.5 Change 3).
**Missing that should exist:** v2_4_10 amendment (BLOCKED on Overview decision — stub with "PENDING OVERVIEW DECISION"); v2_4_11 (optional stub); arnold-product-spec-v2_5.md (the merge — natural moment now).

---

## 3. INDEX.md — the contract

Single entry point. Contents: currency table (file → status → one-line); hierarchy statement (Product Spec → AI Brain Strategy → Bibles → Builder Instructions → chat work; latest amendment wins); amendment coded/live status; pointer to latest build-state handoff; the rule that a decision isn't real until written to a file here.

---

## 4. Execution (Build→CC discipline)

1. Decide §0. 2. Branch `chore/arnold-system-migration`. 3. CC prompt: create tree, write files verbatim, write INDEX.md (paste as text — CC can't see attachments). 4. Guardrails: arnold-system/** NOT in tsconfig include; Metro doesn't walk it; tsc still 43; .gitignore updated for private folder. 5. No tag (no code change); merge --no-ff once verified.

---

## 5. Strongly consider: the v2.5 merge now

The amendment stack is deep. Migrating is the clean moment to collapse v2.4 + amendments into arnold-product-spec-v2_5.md, keeping amendments as historical record. Arguably Overview's call on effort. Until then, INDEX.md's currency table IS the effective merged view — get it right.

---

## 6. After migration — handback

- Build and Overview read specs from local files via CC, not Claude.ai attachments — the main payoff.
- Update mvp-builder-instructions to point at arnold-system/ + add the two conventions: (1) CC tests logic, Edwin eyeballs screens; (2) DEV_PREFILL must be OFF to test true onboarding. [DONE: v2.2.]
- Carry forward blockers: v2.4.10 decision (Overview), v2.4.9 Part 2 (bible review), UserProfile.goals type drift (pins tsc at 43).

*This chat sets up the brain's new home and nothing else. main `09d9e7d`, tag mvp-1.20, tsc 43.*
