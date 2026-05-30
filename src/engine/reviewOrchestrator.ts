// =============================================================================
// ARNOLD — Post-Session Review Orchestrator (spec amendment v2.4.8 §1)
//
// Pure functions that drive the post-session review:
//
// - §1.2 priority resolver: select the FIRST question.
// - §1.4 difficulty-intent framing.
// - §1.5 second-question gate (engagement + value).
// - §1.6 RPE calibration tappable structure.
// - §1.7 disengagement fallback.
//
// Engine-only. No UI. No side effects. Prompt C wires these into the chat
// surface; this module just answers "what does Arnold ask next?".
//
// Hard cap: at most 2 questions per review (§1.1). The orchestrator enforces
// this by design — every code path here emits at most one question, and the
// gate function (`shouldAskSecondQuestion`) is the only way to get a second.
// =============================================================================

import type {
  ConversationContextPacket,
  DifficultyIntent,
  SessionSummaryExercise,
} from "../types";
import type { ResolvedSessionType } from "./conversationContext";

// ── Public types ─────────────────────────────────────────────────────────────

export type ReviewPriority = 1 | 2 | 3 | 4 | 5;

/**
 * The shape of the user-facing turn.
 * - "open"          → open text only.
 * - "hybrid"        → open text + 2–3 quick chips per §5.2 default.
 * - "tappable_rpe"  → the §1.6 four-option calibration set.
 */
export type ReviewQuestionKind = "open" | "hybrid" | "tappable_rpe";

export interface ReviewQuestion {
  priority: ReviewPriority;
  /** What Arnold says. */
  text: string;
  /** Movement the question references; null for the rare degraded case. */
  target: string | null;
  kind: ReviewQuestionKind;
  /** Quick chips for hybrid turns (free text is always still available). */
  chips?: string[];
}

// ── §1.6 RPE calibration — fixed, structured ─────────────────────────────────

export const RPE_CALIBRATION_PROMPT = "Last hard set — how close to failure?";

/**
 * Four taps per §1.6. Order matters — maps to RPE ~7 / ~8–9 / ~10 / failure
 * per the §9.6 source hierarchy.
 */
export const RPE_CALIBRATION_CHIPS: readonly string[] = [
  "Had 3+ left",
  "1–2 left",
  "Last rep I could do",
  "Failed a rep",
];

// ── §1.4 difficulty-intent framing (table) ───────────────────────────────────

/**
 * Returns Arnold's stance + the question framing for a given intent.
 * Per §1.4. Applied to Priority 2 / 4 / 5 questions that target a working
 * movement. The framing makes the user's answer interpretable against intent.
 *
 * Mandatory use per the amendment — Priority 2's question text is derived
 * from `framing` here, with the movement name substituted in.
 */
export function getDifficultyIntentFraming(intent: DifficultyIntent | null): {
  stance: string;
  framing: string;
} {
  switch (intent) {
    case "challenging":
      return {
        stance: "Struggle is the point. Don't alarm.",
        framing: "That top set was meant to be a grind — did you get all the reps, or did it break down?",
      };
    case "moderate":
      return {
        stance: "Yellow flag — could be a bad day or a real overestimate.",
        framing: "That should've been controlled today — how'd it move?",
      };
    case "easy":
      return {
        stance: "Red flag — likely a miscalibration.",
        framing: "That's a weight you should own — anything feel off?",
      };
    case null:
    default:
      return {
        stance: "No intent flagged — open question.",
        framing: "How'd it feel?",
      };
  }
}

// ── §1.3 secondary-movement lookup (text for §1.5 second question) ───────────

/**
 * §1.3 "Secondary" column condensed to one short phrase per session type.
 * Used by §1.5 when the second question targets a secondary movement (i.e.
 * the user is engaged and RPE isn't the missing piece). Null = no secondary
 * for this type ("—" in the §1.3 table) → no secondary question available.
 */
const SECONDARY_BY_TYPE: Record<ResolvedSessionType, string | null> = {
  heavy_compound: "back-off / volume feel",
  peak_singles: "bar speed and confidence",
  legs: "knee/hip comfort",
  upper_volume: "pump and fatigue — not load",
  skill_push_pull: "complementary lift feel",
  pure_skill: "wrist/shoulder comfort",
  strength_volume: "skill carryover",
  heavy_skill_bolt_on: "whichever you didn't address — skill or main",
  dedicated_skill: "supporting strength feel",
  endurance_circuit: "where it broke down — which movement gassed first",
  general: null,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function findExerciseByName(
  exercises: SessionSummaryExercise[],
  name: string,
): SessionSummaryExercise | undefined {
  if (!name) return undefined;
  const target = name.toLowerCase();
  return exercises.find((ex) => ex.name.toLowerCase() === target);
}

function nameFromFlag(flag: string): { kind: "skipped" | "low-completion"; name: string } | null {
  const [kind, ...rest] = flag.split(":");
  const name = rest.join(":");
  if ((kind === "skipped" || kind === "low-completion") && name.length > 0) {
    return { kind, name };
  }
  return null;
}

function rpeMissingFor(ex: SessionSummaryExercise | undefined): boolean {
  if (!ex) return false;
  return ex.rpeReported == null && ex.rpeInferred == null;
}

// ── §1.2 priority resolver ───────────────────────────────────────────────────

/**
 * Walk the §1.2 priority order and return the first review question.
 *
 * Returns `null` when the packet is not in a post-session context
 * (`completedSession === null`) — the orchestrator never invents a review.
 *
 * Priority order:
 *   1. Skip-derived behavioral flag → ask about the flagged movement.
 *   2. Headline (primary purpose) movement missed its target → frame by intent.
 *   3. PR / test attempt scheduled this session → ask the outcome.
 *   4. Primary purpose movement (path × session-type aware via §1.3).
 *   5. Default — clean session, open check on the primary movement.
 *
 * The clarification merged into §1.2 keeps Priority 5 as a SINGLE question
 * (open check only). RPE, if missing, surfaces as the conditional SECOND
 * question via `buildSecondQuestion` — never bundled in here.
 */
export function selectFirstReviewQuestion(
  packet: ConversationContextPacket,
): ReviewQuestion | null {
  const cs = packet.completedSession;
  if (!cs) return null;

  // ── Priority 1 — behavioralFlags (MVP: skip-derived only per §2.5) ────────
  if (cs.behavioralFlags.length > 0) {
    const parsed = nameFromFlag(cs.behavioralFlags[0]);
    if (parsed) {
      return {
        priority: 1,
        text: `Your ${parsed.name} looked off today — anything bother you?`,
        target: parsed.name,
        kind: "open",
      };
    }
  }

  // ── Priority 2 — headline (primary purpose) missed target ─────────────────
  const primaryExercise = findExerciseByName(cs.exercises, cs.primaryPurposeMovement);
  const headlineMissed = primaryExercise != null && primaryExercise.completionRate < 1;
  if (headlineMissed && primaryExercise) {
    const framing = getDifficultyIntentFraming(primaryExercise.difficultyIntent).framing;
    return {
      priority: 2,
      // The §1.4 framing already implies the movement; we prepend a deictic
      // anchor so the question doesn't read like a context-free aphorism.
      text: `${primaryExercise.name}: ${framing}`,
      target: primaryExercise.name,
      kind: "hybrid",
      chips: ["Smooth", "Grind but got them", "Missed reps"],
    };
  }

  // ── Priority 3 — PR / test scheduled this session ─────────────────────────
  const pr = packet.goals.activePR;
  if (pr && pr.scheduledWeek === packet.user.weekInMeso) {
    const prExercise = findExerciseByName(cs.exercises, pr.lift_or_skill);
    if (prExercise) {
      return {
        priority: 3,
        text: `How'd the ${pr.lift_or_skill} attempt go?`,
        target: pr.lift_or_skill,
        kind: "hybrid",
        chips: ["Landed it", "Got close", "Missed"],
      };
    }
  }

  // ── Priority 4 / 5 — primary purpose movement (default check) ─────────────
  if (primaryExercise) {
    const framing = getDifficultyIntentFraming(primaryExercise.difficultyIntent).framing;
    return {
      priority: 4,
      text: `${primaryExercise.name}: ${framing}`,
      target: primaryExercise.name,
      kind: "hybrid",
      chips: ["Smooth", "Grind but got them", "Missed reps"],
    };
  }

  // Degraded — resolver couldn't pin a movement. Priority 5 generic open check.
  return {
    priority: 5,
    text: "How'd the session feel overall?",
    target: null,
    kind: "open",
  };
}

// ── §1.5 second-question gate ────────────────────────────────────────────────

/**
 * Decide whether to ask a second question per §1.5.
 *
 * Requires BOTH:
 *   1. The user engaged with the first question — engagement is judged by
 *      the caller (typically: not flagged as a disengagement response).
 *   2. There's a genuinely valuable secondary signal — either RPE is still
 *      missing on the headline movement (and would change autoregulation),
 *      OR the session type has a §1.3 secondary movement defined.
 *
 * Never bundles a third — the hard cap of 2 per review (§1.1) lives here.
 */
export function shouldAskSecondQuestion(
  packet: ConversationContextPacket,
  firstAnswerEngaged: boolean,
  firstQuestionPriority: ReviewPriority | null,
): boolean {
  if (!firstAnswerEngaged) return false;
  if (firstQuestionPriority == null) return false; // first was a no-op
  const cs = packet.completedSession;
  if (!cs) return false;

  const primaryExercise = findExerciseByName(cs.exercises, cs.primaryPurposeMovement);

  // RPE gap on the headline movement — almost always worth capturing.
  if (rpeMissingFor(primaryExercise)) return true;

  // Otherwise, a meaningful secondary in the §1.3 table for this session type.
  const sessionType = cs.sessionType as ResolvedSessionType;
  const secondary = SECONDARY_BY_TYPE[sessionType] ?? null;
  return secondary != null;
}

/**
 * Build the second question. Per §1.5: RPE first when missing, otherwise
 * secondary-movement. Never both.
 */
export function buildSecondQuestion(
  packet: ConversationContextPacket,
  firstQuestion: ReviewQuestion,
): ReviewQuestion | null {
  const cs = packet.completedSession;
  if (!cs) return null;

  const primaryExercise = findExerciseByName(cs.exercises, cs.primaryPurposeMovement);

  // RPE calibration takes precedence per §1.5 ("If RPE is the gap…").
  if (rpeMissingFor(primaryExercise)) {
    return {
      priority: firstQuestion.priority,
      text: RPE_CALIBRATION_PROMPT,
      target: primaryExercise?.name ?? null,
      kind: "tappable_rpe",
      chips: [...RPE_CALIBRATION_CHIPS],
    };
  }

  // Otherwise the §1.3 secondary movement / signal.
  const sessionType = cs.sessionType as ResolvedSessionType;
  const secondary = SECONDARY_BY_TYPE[sessionType] ?? null;
  if (!secondary) return null;

  return {
    priority: firstQuestion.priority,
    text: `And the ${secondary} — anything to flag?`,
    target: secondary,
    kind: "open",
  };
}

// ── §1.7 disengagement detection ─────────────────────────────────────────────

/**
 * Detect the "one-word / closing answer" case from §1.7. When this returns
 * true, the orchestrator must NOT ask a second question — Arnold accepts
 * the answer with a one-line acknowledgement and ends the review.
 *
 * Conservative: better to skip a second question than to push past a user
 * who's clearly done. The agent always logs the answer either way.
 */
export function isDisengagementResponse(userText: string): boolean {
  const normalized = userText.trim().toLowerCase();
  if (normalized.length === 0) return true; // silence is disengagement
  if (normalized.endsWith("?")) return false; // questions = engagement

  const tokens = normalized
    .replace(/[.!,;]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 0);

  // Single-word closers.
  const singleWordClosers = new Set([
    "fine",
    "good",
    "ok",
    "okay",
    "yep",
    "yeah",
    "sure",
    "k",
    "kk",
    "great",
    "alright",
    "all",
    "done",
    "nope",
    "no",
    "yes",
    "y",
    "n",
  ]);
  if (tokens.length === 1 && singleWordClosers.has(tokens[0])) return true;

  // 2–3-word closing phrases.
  if (tokens.length <= 3) {
    const joined = tokens.join(" ");
    const phraseClosers = new Set([
      "all good",
      "all done",
      "no issues",
      "no probs",
      "no problem",
      "yeah good",
      "fine thanks",
      "good thanks",
      "all fine",
      "felt fine",
      "felt good",
      "felt ok",
      "felt okay",
      "im good",
      "i'm good",
      "im fine",
      "i'm fine",
    ]);
    if (phraseClosers.has(joined)) return true;
  }

  return false;
}
