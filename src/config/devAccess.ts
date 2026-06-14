/**
 * Email-gated DEV affordances (v2.4.4)
 *
 * Returns true when:
 * - __DEV__ is true (simulator + dev client behavior unchanged), OR
 * - The currently authenticated user's email matches DEV_ALLOWLIST
 *
 * Match is performed on normalized email (lowercase + trimmed) for safety
 * against Gmail-style case variants and stray whitespace.
 *
 * Caveat: if Edwin changes his Supabase account email, the allowlist
 * breaks until the next build. Acceptable today.
 */

import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

const DEV_ALLOWLIST: readonly string[] = [
  "edwinabboudblanco@gmail.com",
];

function normalizeEmail(email: string | null | undefined): string {
  return (email ?? "").trim().toLowerCase();
}

// Supabase v2 doesn't expose a public synchronous session accessor, so we
// cache the latest session via onAuthStateChange. Subscribed once at module
// load; the listener stays for the app lifetime.
let cachedSession: Session | null = null;

supabase.auth.getSession().then(({ data }) => {
  cachedSession = data.session;
});

supabase.auth.onAuthStateChange((_event, session) => {
  cachedSession = session;
});

let warned = false;

/**
 * Synchronous check using the latest cached Supabase session.
 * Safe to call in render paths. Returns false if no session yet.
 */
export function isDevUser(): boolean {
  if (__DEV__) return true;

  const email = normalizeEmail(cachedSession?.user?.email);
  if (!email) return false;

  const match = DEV_ALLOWLIST.some(
    (allowed) => normalizeEmail(allowed) === email
  );

  // Defensive: log once per app session if DEV affordances activate in
  // a non-development build. Catches accidental wildcard / empty-string
  // bugs that would otherwise expose tools silently.
  if (match && !__DEV__ && !warned) {
    warned = true;
    console.log(`[arnold] DEV affordances active for user ${email}`);
  }

  return match;
}

/**
 * For test scaffolding only — exported so unit tests can verify
 * normalization + exact-match behavior.
 */
export const __testing__ = { normalizeEmail, DEV_ALLOWLIST };

// ── Real-user mode toggle (v2.4.12) ──────────────────────────────────────────
// Dev conveniences (pre-filled weight/height/benchmarks, skipped experience
// filter) are gated on (__DEV__ || isDevUser()), always on for the dev account.
// This flag lets a dev flip those OFF at runtime to walk the real new-user
// onboarding flow without a separate build. Module-level, no persistence; DEV
// RESET deliberately does NOT reset it. Defaults ON so existing behavior is
// unchanged — gate sites read (__DEV__ || isDevUser()) && DEV_PREFILL.
export let DEV_PREFILL = true;

export function setDevPrefill(on: boolean): void {
  DEV_PREFILL = on;
}

export function toggleDevPrefill(): boolean {
  DEV_PREFILL = !DEV_PREFILL;
  return DEV_PREFILL;
}
