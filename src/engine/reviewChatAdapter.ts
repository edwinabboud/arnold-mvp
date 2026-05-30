// =============================================================================
// ARNOLD — Review Orchestrator ↔ ChatWidget adapter (v2.4.8)
//
// Bridges the engine concept (`ReviewQuestion` from reviewOrchestrator) to
// the UI concept (`ChatMessage` from types/logging). The orchestrator stays
// UI-unaware; ChatWidget stays orchestrator-unaware. This adapter is the
// single translation point.
//
// Per v2.4.8 §5.1, the `inputMode` it sets on the message drives whether
// ChatWidget shows the free-text composer or hides it for pure-tappable
// turns (the §1.6 RPE calibration set).
// =============================================================================

import type { ChatMessage, ChatOption } from "../types/logging";
import type { ReviewQuestion } from "./reviewOrchestrator";

/**
 * Convert a `ReviewQuestion` produced by the orchestrator into a `ChatMessage`
 * ready for `ChatWidget`. Pure function — caller supplies the message id and
 * (optionally) a timestamp so the adapter stays deterministic for tests.
 *
 * Mapping per v2.4.8 §5:
 * - kind "open"         → chips empty (or whatever q.chips contains), composer visible
 * - kind "hybrid"       → chips + composer visible (§5.2 default)
 * - kind "tappable_rpe" → chips only, composer hidden ("tappable_only")
 */
export function reviewQuestionToChatMessage(
  q: ReviewQuestion,
  id: string,
  timestamp: string = new Date().toISOString(),
): ChatMessage {
  const options: ChatOption[] | undefined = (q.chips ?? []).length > 0
    ? (q.chips as string[]).map((label, i) => ({
        id: `${id}_opt_${i}`,
        label,
        action: "followup" as const,
        value: label,
      }))
    : undefined;

  const inputMode: ChatMessage["inputMode"] =
    q.kind === "tappable_rpe" ? "tappable_only" : q.kind === "hybrid" ? "hybrid" : "open";

  return {
    id,
    role: "arnold",
    text: q.text,
    timestamp,
    source: "rules",
    options,
    inputMode,
  };
}
