# Arnold MVP Builder Instructions — v2.2

**Supersedes:** v2.1. This version updates the spec-home location and adds two working conventions established the week of June 2026. All v2.1 content (build philosophy, what's built, AI architecture, decision logic reference, design system) remains in force unless changed below.

---

## 0. Spec Home — READ THIS FIRST

The Arnold project brain now lives **in the repo** at `arnold-system/`, edited directly by Claude Code as local files. It is no longer maintained as Claude.ai project-file attachments.

**Entry point:** `arnold-system/INDEX.md`. Read it before any build work. It is the currency table — it tells you which spec and amendments are LIVE, SUPERSEDED, PARTIAL, or PENDING, and points to the latest build-state handoff for code reality.

**Layout:**
```
arnold-system/
├── INDEX.md                ← start here every session
├── spec/                   ← arnold-product-spec-v2_4.md (master; v2_5 when merged)
├── amendments/             ← arnold-spec-v2_4_*-amendment.md
├── bibles/                 ← program bibles + path-specific goals
├── strategy/               ← AI brain strategy, builder instructions (this file), saas guide, app-store metadata
└── handoffs/               ← build-state + migration handoffs
```

**Source-of-truth hierarchy (UNCHANGED — only its location moved):**
1. Product Spec (`arnold-system/spec/`) — what Arnold does
2. AI Brain Strategy (`arnold-system/strategy/`) — how Arnold's intelligence works
3. Program Bibles (`arnold-system/bibles/`) — coaching knowledge source
4. **MVP Builder Instructions (this file)** — how to build it
5. Latest handoff (`arnold-system/handoffs/`) — current state
6. The codebase

Latest amendment wins on conflict. A decision that affects code/design/architecture is not real until it is written to a file in `arnold-system/`. Brainstorming is free; decisions and deliverables are not — they get written down.

**Practical effect:** because specs are now local files, Claude Code can read and edit them directly in the working tree alongside `src/`. The old friction — "CC can't see chat attachments, paste every amendment as text" — is gone for spec files. A spec change and the code that implements it can be committed together.

---

## 1. Two Conventions Added This Version

### 1.1 Verification division of labor (CC tests code, Edwin tests screens)

The default split for every build task:

- **Claude Code tests everything that is testable by code.** Pure logic — tier assignment, progression mapping, calibration math, fallback behavior, label-to-session-type resolution — is verified by CC with a throwaway direct-function harness that prints a PASS/FAIL table and is deleted after (kept untracked). Use boundary/off-by-one inputs, exercise both sides of every threshold, and add a regression case per rewritten path.
- **Edwin verifies a screen only when a screen changed.** CC has no simulator and cannot see rendered UI. Anything visual — a new onboarding step rendering, a button being wired to the right handler, pre-fill appearing, a keyboard not covering input — requires one short device pass by Edwin. UI bugs pass tsc and unit tests and still crash on device (precedent: the MVP 1.16 keyboard crash). 
- **Therefore:** engine-only batches require **zero** manual steps from Edwin. UI-touching batches require **one** short device pass. Don't ask Edwin to read logs or run matrices that CC can assert itself.
- **Tags stay held until device verification.** CC commits + pushes on a branch, no merge/no tag, until Edwin confirms (when a screen changed) or until CC's harness passes (engine-only). Then merge `--no-ff`, tag, push.

### 1.2 DEV_PREFILL must be OFF to test true first-time onboarding

Dev users (`__DEV__ || isDevUser()`) get pre-filled weight/height/benchmarks and **skip the experience-filter step** in onboarding. This is gated behind `DEV_PREFILL` (in `src/config/devAccess.ts`), default ON, toggleable from the DEBUG panel ("Dev pre-fill: ON/OFF").

**Consequence the builder must remember:** with `DEV_PREFILL` ON, the founder does **not** see the real first-time-user flow — including the "I'm new to calisthenics" experience filter and empty benchmark fields. Any verification that claims to test onboarding as a new user MUST be run with `DEV_PREFILL` toggled OFF first. The founder's dev onboarding is not the user's onboarding. `DEV RESET` does not reset this flag.

---

## CHANGELOG: v2.1 → v2.2

**Added:** Spec home relocated to `arnold-system/` in the repo (§0); `INDEX.md` as the mandatory session entry point; verification division of labor convention (§1.1); `DEV_PREFILL`-off requirement for true onboarding testing (§1.2).

**Changed:** Source-of-truth files now read from `arnold-system/` local files, edited by Claude Code directly, not from Claude.ai project attachments. Hierarchy and precedence unchanged — only location.

**Unchanged:** Build philosophy, what's built / not built, AI architecture (3 layers), decision logic reference, design system, all v2.1 content not listed above.
