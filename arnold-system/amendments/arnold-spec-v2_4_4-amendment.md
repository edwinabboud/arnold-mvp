# Arnold — Spec Amendment v2.4.4

**Status:** Active. Pending merge into master.
**Sequencing:** Merges into `arnold-product-spec-v2_5.md` after MVP 1.12 ships, alongside v2.4.1, v2.4.3, v2.4.5.
**Trigger:** Real-device testing — DEV affordances are `__DEV__`-gated, which is `false` in EAS preview/production builds. Founder cannot debug on their own iPhone.

---

## Change 1 — §15.1 Development Access (new subsection)

DEV affordances are exposed to (a) anyone on a `development` build, OR (b) authenticated users whose email matches the build-time allowlist. Same gate runs in `preview` and `production`.

**Module:** `src/config/devAccess.ts`

```ts
const DEV_ALLOWLIST = [
  'edwinabboudblanco@gmail.com',
];

export function isDevUser(email?: string): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return DEV_ALLOWLIST.includes(normalized);
}
```

**Gate pattern:** every DEV affordance uses `__DEV__ || isDevUser(currentUserEmail)`. Approximately 5–10 call sites in `src/screens/**`. New DEV affordances follow the same pattern — never `__DEV__` alone.

---

## Change 2 — Email normalization rule

Allowlist matching is case-insensitive and trim-normalized. Supabase preserves case on email storage; Gmail aliases route to the lowercase form. Without normalization, a typo on next sign-in could silently lock the allowlist match.

| Input | Match? |
|---|---|
| `edwinabboudblanco@gmail.com` | ✓ |
| `EdwinAbboudBlanco@gmail.com` | ✓ |
| `  edwinabboudblanco@gmail.com  ` | ✓ |
| `edwin@gmail.com` | ✗ |
| `''` | ✗ |
| `undefined` | ✗ |

Unit tests required against `isDevUser` to lock these cases.

---

## Change 3 — Destructive-action confirmation rule

Trust-the-user for reversible actions. Confirm for destructive ones.

| DEV affordance | Confirms? | Why |
|---|---|---|
| DEV RESET (wipes AsyncStorage + Supabase profile) | **Yes** | Destroys real training history, not recoverable |
| Skip Onboarding / Prefill | No | Reversible by signing out |
| Sim Easy / Sim Hard / Sim Pain / Sim Can't Finish | No | Flag for next session; no persistent data destroyed |
| Sim pattern conflict / Sim missed week | No | Schedule state; reversible by tapping again |
| Debug panel | No | Read-only |

Confirmation = single Apple-style destructive dialog ("Reset all state? This destroys your training history."). No typed phrase. No long-press.

---

## Change 4 — §15.1 EAS profile table update

Existing Notes column language replaced:

| Profile | Notes (new) |
|---|---|
| `development` | DEV affordances enabled for all users. |
| `preview` | Internal TestFlight. Staging Supabase project. DEV affordances off for non-allowlisted users; gated by `isDevUser()` for allowlisted accounts (see §15.1 Development Access). |
| `production` | App Store. Production Supabase project. DEV affordances off for non-allowlisted users; allowlist applies in production too (same module). |

---

## Change 5 — Defensive startup warning

If `isDevUser()` returns `true` in a non-development build, log a one-time warning at app startup:

```
[arnold] DEV affordances active for user {email}
```

Catches the failure mode where someone commits a wildcard or empty-string match by mistake. Costs nothing.

---

## Change 6 — MVP Builder Instructions addendum

New line in the existing EAS notes section:

> DEV affordances are gated by `__DEV__ || isDevUser()`. New DEV affordances follow the same gate — never `__DEV__` alone.

Keeps the pattern sticky for future builder sessions without re-deriving it.

---

## Caveats (logged, not blocking)

- **Email change breaks the allowlist.** If Edwin's Supabase email changes, allowlist breaks until next build. Acceptable.
- **Allowlist is in the bundle.** Decoded by anyone unpacking the IPA. Not a security concern — DEV tools don't grant data access beyond the user's own auth session. RLS still protects everyone else's data.
- **Shared-device risk.** If someone signs in with an allowlisted email on a shared device, they see DEV tools. Low impact — buttons are labeled; worst case is DEV RESET wiping their own data (confirmation dialog protects this).

---

## Build flags (MVP 1.14)

| Surface | Scope |
|---|---|
| New file | `src/config/devAccess.ts` with `DEV_ALLOWLIST` const + `isDevUser()` + unit tests |
| Existing files | Replace every `__DEV__` check in `src/screens/**` with `__DEV__ || isDevUser(currentUserEmail)`. Approximately 5–10 call sites (HomeScreen, ConversationalOnboarding, possibly SessionScreen). |
| Destructive wrapper | Confirmation dialog on DEV RESET only |
| App startup | One-time warning log when `isDevUser()` returns true in non-development build |

Estimated build time: ~30 minutes. Single-prompt change.

---

## Changelog stub (for v2.5 merge)

**v2.4.3 → v2.4.4 | May 2026**

**Added:**
- §15.1 Development Access — dual-gate pattern (`__DEV__` OR email allowlist)
- `DEV_ALLOWLIST` const + `isDevUser()` module
- Destructive-action confirmation rule (DEV RESET only)
- Defensive startup warning when allowlist active in non-development build

**Changed:**
- §15.1 EAS profile table — Notes language updated to reflect allowlist override

**Added to MVP Builder Instructions:**
- Pattern requirement: new DEV affordances use `__DEV__ || isDevUser()`
