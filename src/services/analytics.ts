// =============================================================================
// ARNOLD — Analytics wrapper (PostHog, metadata-only)
//
// Privacy contract — enforced by the function shapes below, not by discipline:
//
//   * No function in this file accepts a `text`, `message`, `content`, or
//     `note` parameter. Chat messages, pain reports, and free-form notes are
//     STRUCTURALLY impossible to log through this module.
//
//   * Users are identified by their Supabase UUID via `identify()`. Email,
//     name, and any other PII are never passed to PostHog from here.
//
//   * Each event takes a single typed `props` object whose keys are listed
//     in TS. Adding a new event requires adding a new function — there is no
//     generic `track(name, props)` escape hatch.
//
// If you find yourself wanting to log free text or PII, the answer is "no";
// reach for `console.log` (dev only) or design a categorical/count-based
// event instead.
// =============================================================================

import { usePostHog } from "posthog-react-native";

// ── Shared prop shapes ──────────────────────────────────────────────────────

type ProgramPath = "street_lifter" | "skill_builder" | "hybrid_athlete" | "endurance";
type SessionTier = "compact" | "standard" | "recommended";
type ChatContext = "mid_session" | "post_session" | "home";
type WarmupSkipMode = "all" | "single";
type AdaptationResponse = "accepted" | "asked_why" | "kept_same";

/**
 * The hook the wrappers reach through. We resolve the singleton via
 * `usePostHog()` (the same instance PostHogProvider supplies) and cache it on
 * a module-level reference so non-hook call sites (engine helpers, store
 * actions) can still capture without touching React.
 *
 * Set in `useBindAnalytics()` below — call it once from App.tsx inside the
 * PostHogProvider subtree.
 */
let _client: ReturnType<typeof usePostHog> | null = null;

/**
 * Bind the PostHog client to this module. Mount once at the root of the
 * provider subtree (App.tsx). After this fires, every `capture*` function in
 * this file becomes a no-op-or-send depending on whether PostHog has been
 * configured (no key → no client → silent no-op).
 */
export function useBindAnalytics(): void {
  const client = usePostHog();
  if (client && _client !== client) {
    _client = client;
  }
}

// ── User identity ───────────────────────────────────────────────────────────

/**
 * Identify the active user. **Always pass the Supabase UUID, never the email.**
 * Call from successful login + signup paths.
 */
export function identify(supabaseUserId: string): void {
  if (!_client || !supabaseUserId) return;
  _client.identify(supabaseUserId);
}

/**
 * Drop the identity binding. Call on sign-out so subsequent anonymous events
 * aren't attributed to the previous user's distinct id.
 */
export function reset(): void {
  if (!_client) return;
  _client.reset();
}

// ── Capture helpers ─────────────────────────────────────────────────────────

function send(event: string, props: Record<string, unknown> = {}): void {
  if (!_client) return;
  // Cast to satisfy PostHog's branded properties type. Each public capture
  // function above types its own `props` argument exactly, so by the time
  // we get here the shape is already validated by TS at the call site.
  _client.capture(event, props as Record<string, any>);
}

// ── Events (one function per event; props shapes are exact) ─────────────────

export function captureOnboardingStarted(): void {
  send("onboarding_started");
}

export function capturePathSelected(props: { path: ProgramPath }): void {
  send("path_selected", props);
}

export function captureScheduleSet(props: { days_per_week: number }): void {
  send("schedule_set", props);
}

export function captureSessionLengthSelected(props: { tier: SessionTier }): void {
  send("session_length_selected", props);
}

export function captureAssessmentCompleted(): void {
  send("assessment_completed");
}

export function capturePlanGenerated(props: { path: ProgramPath; tier: string }): void {
  send("plan_generated", props);
}

export function captureSessionStarted(props: {
  path: ProgramPath;
  session_type: string;
  tier: string;
}): void {
  send("session_started", props);
}

export function captureSessionCompleted(props: {
  duration_seconds: number;
  exercises_completed: number;
  total_exercises: number;
  completion_pct: number;
}): void {
  send("session_completed", props);
}

export function captureSessionAbandoned(props: {
  exercise_index: number;
  section: string;
}): void {
  send("session_abandoned", props);
}

export function captureWarmupSkipped(props: { mode: WarmupSkipMode }): void {
  send("warmup_skipped", props);
}

export function captureChatOpened(props: { context: ChatContext }): void {
  send("chat_opened", props);
}

/**
 * Fire when the user sends a chat message. **No text content.** We only know
 * which surface they were on.
 */
export function captureChatMessageSent(props: { context: ChatContext }): void {
  send("chat_message_sent", props);
}

export function captureAdaptationSurfaced(props: { adaptation_type: string }): void {
  send("adaptation_surfaced", props);
}

export function captureAdaptationResponse(props: {
  response: AdaptationResponse;
  adaptation_type: string;
}): void {
  send("adaptation_response", props);
}
