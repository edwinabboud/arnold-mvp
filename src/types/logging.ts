// =============================================================================
// ARNOLD — Interaction Logging Schema (Section 8, Week 1)
// Every user interaction from day 1. This is the future fine-tuning dataset.
// =============================================================================

export type InteractionType =
  | "chat_message"         // free text from user
  | "option_tap"           // tapped a structured option
  | "pain_report"          // logged pain through chat
  | "session_feedback"     // post-session how-did-it-feel
  | "exercise_swap"        // requested or accepted exercise swap
  | "plan_change_proposal" // Arnold proposed a change
  | "plan_change_accepted" // user accepted plan change
  | "plan_change_rejected" // user rejected plan change
  | "set_completed"        // tapped DONE
  | "rest_skipped"         // skipped rest timer
  | "warmup_choice"        // short/long/skip
  | "assessment_response"; // response during assessment week

export interface InteractionLog {
  id: string;
  userId: string;
  sessionId?: string;
  timestamp: string;
  type: InteractionType;

  /** What the user said/did */
  userInput: {
    text?: string;
    optionSelected?: string;
    metadata?: Record<string, unknown>;
  };

  /** What Arnold responded with */
  arnoldResponse: {
    message: string;
    options?: string[];          // tappable options shown
    decision?: string;           // rules engine decision type
    agentUsed?: string;          // which agent handled this
    latencyMs?: number;          // response time
    skippedLLM?: boolean;        // true if quick response bypass
  };

  /** Snapshot of context at interaction time */
  context: {
    currentExercise?: string;
    currentSet?: number;
    trainingPhase?: string;
    difficultyIntent?: string;
    streakDays?: number;
    sessionNumber?: number;      // how many sessions total
  };
}

/** Chat message types for the interactive chat widget */
export type ChatRole = "arnold" | "user" | "system";

export interface ChatOption {
  id: string;
  label: string;
  /** What happens when tapped — can trigger a follow-up or a decision */
  action: "followup" | "decision" | "dismiss" | "navigate";
  value?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  timestamp: string;
  /** Tappable options below this message (Arnold messages only) */
  options?: ChatOption[];
  /** Was this a quick response (no LLM) or AI-generated? */
  source: "quick" | "rules" | "llm";
  /** Has the user interacted with the options? */
  optionSelected?: string;
  /**
   * v2.4.8 §5 input-mode hint. Drives whether the chat composer is visible
   * while this message is awaiting a response.
   * - `"open"`           — chips (if any) + free-text. Default when omitted.
   * - `"hybrid"`         — open-text question with quick chips, free-text
   *                        still visible (§5.2 review default).
   * - `"tappable_only"`  — pure tappable per §5.1 (RPE scale, pain severity,
   *                        approval). Composer hidden until a chip is tapped.
   */
  inputMode?: "open" | "hybrid" | "tappable_only";
}

/** Post-session feedback flow state */
export type FeedbackStep =
  | "overall"           // How did today feel?
  | "drill_down"        // Any specific exercise?
  | "pain_check"        // Anything hurt?
  | "plan_proposal"     // Arnold proposes changes
  | "confirmation"      // User accepts/rejects
  | "done";

export interface FeedbackFlow {
  sessionId: string;
  currentStep: FeedbackStep;
  responses: Record<FeedbackStep, string | null>;
  proposedChanges: string[];    // human-readable change descriptions
  accepted: boolean | null;
}
