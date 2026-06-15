# Arnold — Spec Amendment v2.4.3

**Status:** Active. Pending merge into master.
**Sequencing:** Merges into `arnold-product-spec-v2_5.md` after MVP 1.12 ships, alongside v2.4.1, v2.4.4, v2.4.5.
**Trigger:** Apple guideline 5.1.1(v) — in-app account deletion required for any app with sign-up. Hard ship blocker for TestFlight and App Store.

---

## Change 1 — §15.1 Account Deletion (new subsection)

Single-screen deletion accessible from Settings → "Delete Account." Immediate and complete per Apple's rule. No grace period, no deactivate-vs-delete option, no email confirmation step.

**Confirmation dialog:**

| Element | Content |
|---|---|
| Headline | "Delete your account?" |
| Body | "This permanently deletes your profile, training history, progression data, and chat history. Cannot be undone." |
| Primary (visually dominant) | "Cancel" |
| Destructive (red) | "Delete forever" |

**Deletion flow (remote-first, fail-loud):**

1. Show loading state ("Deleting…")
2. Client calls `arnold-delete-account` Edge Function with user's auth JWT
3. **On success:** clear AsyncStorage → reset Zustand → sign out → navigate to auth screen
4. **On failure:** show error, retry button, **do not clear local state**

No fake-deleted state ever exists. If the app is killed mid-call, user remains signed in on next launch and can retry.

---

## Change 2 — §15.1 `arnold-delete-account` Edge Function (new)

Mirrors the `arnold-proxy` pattern. Privileged operation that cannot live in the client bundle.

| Field | Value |
|---|---|
| Endpoint | `/functions/v1/arnold-delete-account` |
| Auth | User's JWT (Supabase auth header) |
| Verify | JWT belongs to requesting user (no admin-deleting-others) |
| Action | Delete `auth.users.{id}` using service role key (server-side only) |
| Returns | `{ success: true }` or error |

Do **not** bolt onto `arnold-proxy` — that function is stateless and forwards to Anthropic. Account deletion is a different shape; separate function, same architectural pattern.

---

## Change 3 — §15.1 Schema commitment: `ON DELETE CASCADE`

Every user-scoped table in Supabase has its foreign key to `auth.users(id) ON DELETE CASCADE`. Deleting the auth user cascades to every dependent row automatically.

**Rule:** future tables inherit the rule for free. No code change required when new tables are added.

This replaces enumerating tables in client or function code.

---

## Change 4 — §15.1 Settings Screen (new minimum spec)

Settings screen exists, accessed via gear icon on the home screen. MVP minimum contents:

| Section | Items |
|---|---|
| Account | Email (display), Sign out, **Delete account** |
| Notifications | Placeholder (can be empty for MVP) |
| About | Version number, Terms, Privacy |

Design chat owns the visual treatment; this spec owns the existence and contents.

---

## Change 5 — §15.1 EAS profile table addendum

No change to the table itself in this amendment. Account deletion lives in all build profiles (development, preview, production).

---

## Deferred (logged to §17)

- **RevenueCat subscription messaging.** When subscriptions ship, the deletion dialog must include: *"Your subscription doesn't cancel automatically. Manage it in Settings → Apple ID → Subscriptions."* Apple specifically checks for this language. Moot for MVP (pre-subscription).
- **Data export ("download my data").** GDPR allows it; Apple doesn't require it for deletion compliance. Post-launch consideration if EU users request it.
- **Deletion audit logging.** Explicitly NOT building. Clean break, simplest GDPR posture.

---

## Build flags (MVP 1.14 or earlier — ship blocker)

| Surface | Scope |
|---|---|
| Frontend | Settings screen + Delete Account dialog + remote-first deletion flow |
| Edge Function | `arnold-delete-account` (new) with JWT verification + service-role auth deletion |
| Database | Schema migration: add `ON DELETE CASCADE` FK constraints on every user-scoped table |

The schema migration is easy to forget — must be in the same build, not a separate task.

---

## Changelog stub (for v2.5 merge)

**v2.4.2 → v2.4.3 | May 2026**

**Added:**
- §15.1 Account Deletion — single-screen, remote-first, fail-loud flow
- §15.1 `arnold-delete-account` Edge Function — JWT-verified, service-role privileged
- §15.1 Settings Screen — minimum MVP contents
- Schema commitment: `ON DELETE CASCADE` on all user-scoped FK constraints

**Driver:** Apple guideline 5.1.1(v) compliance — TestFlight/App Store ship blocker.

**Deferred to §17:**
- RevenueCat subscription-cancellation messaging (post-subscription)
- Data export (post-launch)
