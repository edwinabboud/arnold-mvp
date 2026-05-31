// =============================================================================
// ARNOLD — Persona Automated Checks (v2.4.8 §6.2)
//
// Three pure functions that flag generic or off-persona replies BEFORE the
// LLM-graded blind test (§6.3). Cheap, deterministic, run on every agent
// output against the eval set:
//
//   1. checkLengthCap   — §3.2 hard caps per reply context.
//   2. checkBlocklist   — §3.3 regex scan for banned constructions.
//   3. checkSpecificity — §3.4 + §6.2: does the reply name a token from
//                         the coaching context, or could it have been
//                         written by a generic chatbot?
//
// These are NOT silver bullets — they catch the cheap failure modes early
// so the human-blind set focuses on the harder ones. A reply that passes
// all three can still be bad coaching; one that fails any is wrong.
// =============================================================================

import type { ConversationContextPacket } from "../types";

// ── 1. Length cap (§3.2) ─────────────────────────────────────────────────────

export type ReplyContext =
  | "mid_session"
  | "adaptation_surfacing"
  | "review_question"
  | "explanation"
  | "plan_change";

/**
 * Hard caps from v2.4.8 §3.2 (sentences). Below the soft cap is preferred
 * but not enforced — only the HARD cap fails the check, matching the spec's
 * "exceed the hard cap and the reply must be cut" framing.
 */
const HARD_CAP_SENTENCES: Record<ReplyContext, number> = {
  mid_session: 2,
  adaptation_surfacing: 1,
  review_question: 2,
  explanation: 4,
  plan_change: 3,
};

const SOFT_CAP_SENTENCES: Record<ReplyContext, number> = {
  mid_session: 1,
  adaptation_surfacing: 1,
  review_question: 1,
  explanation: 2,
  plan_change: 2,
};

/**
 * Count sentences via terminal punctuation (`.`, `!`, `?`) followed by
 * whitespace or end-of-string. The lookahead is what prevents decimal
 * separators like `+27.5kg` from being counted as a sentence break — the
 * `.` there is followed by a digit, not whitespace.
 *
 * Approximation: abbreviations ("e.g.") still split incorrectly, but for
 * short coaching replies that almost never happens.
 */
export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (trimmed.length === 0) return 0;
  const parts = trimmed.split(/[.!?]+(?=\s|$)/).filter((s) => s.trim().length > 0);
  return Math.max(1, parts.length);
}

export interface LengthCheckResult {
  pass: boolean;
  sentences: number;
  hardCap: number;
  softCap: number;
  context: ReplyContext;
  /** Populated when over the hard cap. */
  reason?: string;
}

export function checkLengthCap(text: string, context: ReplyContext): LengthCheckResult {
  const sentences = countSentences(text);
  const hardCap = HARD_CAP_SENTENCES[context];
  const softCap = SOFT_CAP_SENTENCES[context];
  const overHard = sentences > hardCap;
  return {
    pass: !overHard,
    sentences,
    hardCap,
    softCap,
    context,
    reason: overHard ? `${sentences} sentences exceeds hard cap of ${hardCap} for ${context}` : undefined,
  };
}

// ── 2. Blocklist (§3.3) ──────────────────────────────────────────────────────

export type BlocklistCategory =
  | "medical_claim"
  | "hedging"
  | "empty_praise"
  | "apology"
  | "user_decides_program"
  | "ai_mention"
  | "filler"
  | "emoji";

/**
 * Patterns are case-insensitive and word-boundary aware where appropriate.
 * Notes per category:
 * - `medical_claim`: diagnostic phrasing ("you have tendinitis"). Pain referral
 *   to a physio is OK and not on the list.
 * - `empty_praise`: matches the standalone reactions named in §3.3. A
 *   "Great job — third clean session at +25kg" carries the praise WITH a
 *   specific reference; the regex still matches but `checkSpecificity` lets
 *   the second half rescue it. The CI flow grades both checks together —
 *   a praise-only reply with no specificity is the failure mode we want.
 * - `filler`: the "trust the process / listen to your body / no pain no gain"
 *   standalone shrugs. Tied to a specific phase reason these can be allowed;
 *   the regex flags every occurrence and the human reviewer judges context.
 */
const BLOCKLIST: Array<{ category: BlocklistCategory; pattern: RegExp; note: string }> = [
  // Medical diagnosis
  { category: "medical_claim", pattern: /\byou\s+have\s+(tendinitis|tendonitis|impingement|bursitis|a\s+strain|a\s+tear)\b/i, note: "diagnostic claim" },
  { category: "medical_claim", pattern: /\bthat'?s\s+(an?\s+)?(impingement|tendinitis|tendonitis|bursitis|rotator\s+cuff\s+tear)\b/i, note: "diagnostic claim" },

  // Hedging (§3.1 rule 2)
  { category: "hedging", pattern: /\byou\s+might\s+want\s+to\s+consider\b/i, note: "hedge: 'you might want to consider'" },
  { category: "hedging", pattern: /\bperhaps\b/i, note: "hedge: 'perhaps'" },
  { category: "hedging", pattern: /\bit\s+could\s+be\s+a\s+good\s+idea\s+to\b/i, note: "hedge phrase" },
  { category: "hedging", pattern: /\beveryone'?s\s+different\b/i, note: "hedge: deflection" },

  // Empty praise (§3.3 — note these match even when paired with specifics; the
  // specificity check is what differentiates earned vs empty praise).
  { category: "empty_praise", pattern: /\bgreat\s+job\b/i, note: "empty praise: 'Great job'" },
  { category: "empty_praise", pattern: /\bawesome\s+work\b/i, note: "empty praise: 'Awesome work'" },
  { category: "empty_praise", pattern: /\byou\s+crushed\s+it\b/i, note: "empty praise: 'You crushed it'" },
  { category: "empty_praise", pattern: /\bnice\s+work\b/i, note: "empty praise: 'Nice work'" },

  // Apology for the program
  { category: "apology", pattern: /\bsorry\s+(if|that)\s+that'?s\b/i, note: "apologizing for the program" },
  { category: "apology", pattern: /\bsorry\s+(if|that)\s+(it'?s|that\s+is)\s+(hard|tough|too\s+hard)\b/i, note: "apologizing for difficulty" },

  // Asking the user to do Arnold's job
  { category: "user_decides_program", pattern: /\bwhat\s+weight\s+do\s+you\s+want\b/i, note: "user-decides-program" },
  { category: "user_decides_program", pattern: /\bhow\s+many\s+sets\s+do\s+you\s+think\b/i, note: "user-decides-program" },

  // AI mention in-character (§3.3)
  { category: "ai_mention", pattern: /\bas\s+an?\s+ai\b/i, note: "AI mention" },
  { category: "ai_mention", pattern: /\bi'?m\s+(an?\s+)?(ai|llm|language\s+model|chatbot|model)\b/i, note: "AI/model self-reference" },

  // Generic filler (when standalone — human reviewer applies context per §3.3)
  { category: "filler", pattern: /\blisten\s+to\s+your\s+body\b/i, note: "standalone filler" },
  { category: "filler", pattern: /\bno\s+pain[, ]\s*no\s+gain\b/i, note: "standalone filler" },
  { category: "filler", pattern: /\btrust\s+the\s+process\b/i, note: "standalone filler unless tied to a phase reason" },

  // Emoji (any Unicode emoji)
  { category: "emoji", pattern: /\p{Extended_Pictographic}/u, note: "emoji (any)" },
];

export interface BlocklistViolation {
  category: BlocklistCategory;
  pattern: string;
  match: string;
  note: string;
}

export interface BlocklistCheckResult {
  pass: boolean;
  violations: BlocklistViolation[];
}

export function checkBlocklist(text: string): BlocklistCheckResult {
  const violations: BlocklistViolation[] = [];
  for (const rule of BLOCKLIST) {
    const m = text.match(rule.pattern);
    if (m) {
      violations.push({
        category: rule.category,
        pattern: rule.pattern.toString(),
        match: m[0],
        note: rule.note,
      });
    }
  }
  return { pass: violations.length === 0, violations };
}

// ── 3. Specificity (§3.4 / §6.2) ─────────────────────────────────────────────

/**
 * Extract the set of "concrete tokens" the agent could reference for this
 * conversation — exercise names, weights, week / phase identifiers, the
 * active PR target, finisher trend numbers, pain areas, etc. Case is
 * preserved here; the matcher lowercases at compare time.
 *
 * Empty tokens set means "no concrete data to anchor to" — in that rare
 * case `checkSpecificity` returns pass=true with a note. The check fails
 * loud when data exists but the reply doesn't use any of it.
 */
export function extractPacketTokens(packet: ConversationContextPacket): string[] {
  const tokens = new Set<string>();

  // User block. Phase + week number + bodyweight + e1rms are the §3.1 rule-1
  // concrete tokens ("a weight, a rep count, a session number, a hold time,
  // a trend, a phase"). Tier and path are intentionally NOT added — they're
  // too coarse to count as a "specific reference" by themselves.
  tokens.add(packet.user.phase);
  if (packet.user.weekInMeso > 0) tokens.add(`week ${packet.user.weekInMeso}`);
  if (packet.user.bodyweightKg != null) tokens.add(`${packet.user.bodyweightKg}kg`);
  for (const [lift, e1rm] of Object.entries(packet.user.e1rm)) {
    if (e1rm != null) tokens.add(`${e1rm}kg`);
    // The lift slug (e.g. "pull_up" → "pull up") is added only when there's
    // a numeric e1RM to anchor it; an empty-e1rm record contributes nothing.
    if (e1rm != null) tokens.add(lift.replace(/_/g, " "));
  }

  // Goals
  if (packet.goals.activePR) {
    tokens.add(packet.goals.activePR.lift_or_skill);
    tokens.add(packet.goals.activePR.targetValue);
  }
  for (const g of packet.goals.pathGoals) tokens.add(g);

  // Just-completed session
  if (packet.completedSession) {
    tokens.add(packet.completedSession.primaryPurposeMovement);
    for (const ex of packet.completedSession.exercises) {
      tokens.add(ex.name);
      tokens.add(ex.target);
      tokens.add(ex.achieved);
    }
    if (packet.completedSession.finisherReps != null) {
      tokens.add(`${packet.completedSession.finisherReps} reps`);
    }
  }

  // Recent history
  for (const s of packet.recentHistoryFull) {
    for (const ex of s.exercises) tokens.add(ex.name);
  }
  for (const c of packet.recentHistoryCompressed) {
    tokens.add(c.headlineOutcome);
  }

  // Finisher trend
  for (const n of packet.finisherTrend) tokens.add(`${n} reps`);

  // Recovery
  for (const p of packet.recovery.openPainFlags) tokens.add(p.area);

  // Pending adaptations
  for (const a of packet.pendingAdaptations) {
    tokens.add(a.summary);
    tokens.add(a.progressionId);
  }

  // Knowledge
  if (packet.knowledge.phaseGuidance) tokens.add(packet.knowledge.phaseGuidance);

  // Strip empties + very short tokens that would match everything ("a", "1").
  return Array.from(tokens).filter((t) => t.trim().length >= 2);
}

export interface SpecificityCheckResult {
  pass: boolean;
  matchedTokens: string[];
  /** Up to 8 suggestions the reply could have anchored to. */
  suggestedTokens: string[];
  /** True when the packet was too sparse to fairly evaluate. */
  noDataToCheck: boolean;
}

/**
 * Does the reply reference at least one concrete token from the packet?
 * This is the deterministic version of the §3.4 one-line persona test
 * ("Could a generic fitness chatbot with no knowledge of this user have
 * written this sentence?"). If no tokens exist (sparse packet), the check
 * abstains — we can't fail a reply for not citing data that wasn't there.
 */
export function checkSpecificity(
  text: string,
  packet: ConversationContextPacket,
): SpecificityCheckResult {
  const tokens = extractPacketTokens(packet);
  if (tokens.length === 0) {
    return { pass: true, matchedTokens: [], suggestedTokens: [], noDataToCheck: true };
  }
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const t of tokens) {
    if (lower.includes(t.toLowerCase())) matched.push(t);
  }
  return {
    pass: matched.length > 0,
    matchedTokens: matched,
    suggestedTokens: tokens.slice(0, 8),
    noDataToCheck: false,
  };
}
