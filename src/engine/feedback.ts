// =============================================================================
// ARNOLD — Post-Session Feedback Flow
// Not a form. A multi-step chat conversation with plan change proposals.
// User can blow through in 10 seconds or type freely.
// =============================================================================

import { ChatMessage, ChatOption, FeedbackFlow, FeedbackStep } from "../types/logging";
import { CoachingDecision, PlannedSession, SessionLog, PainReport } from "../types";
import { handleTooEasy, handleCouldntFinish, handlePainReport } from "./rules";

// ── Feedback Flow State Machine ──────────────────────────────────────────────

export function initFeedbackFlow(sessionId: string): FeedbackFlow {
  return {
    sessionId,
    currentStep: "overall",
    responses: { overall: null, drill_down: null, pain_check: null, plan_proposal: null, confirmation: null, done: null },
    proposedChanges: [],
    accepted: null,
  };
}

/** Generate the next Arnold message based on current feedback step */
export function getFeedbackMessage(
  flow: FeedbackFlow,
  session: PlannedSession,
  sessionLog: SessionLog
): ChatMessage {
  const now = new Date().toISOString();
  const id = `fb_${Date.now()}`;

  switch (flow.currentStep) {
    case "overall":
      return {
        id, role: "arnold", timestamp: now, source: "rules",
        text: "How did today feel?",
        options: [
          { id: "fb_great", label: "Great", action: "followup", value: "great" },
          { id: "fb_good", label: "Good", action: "followup", value: "good" },
          { id: "fb_tough", label: "Tough", action: "followup", value: "tough" },
          { id: "fb_bad", label: "Bad", action: "followup", value: "bad" },
          { id: "fb_explain", label: "Let me explain", action: "followup", value: "explain" },
        ],
      };

    case "drill_down": {
      const feeling = flow.responses.overall;
      if (feeling === "great" || feeling === "good") {
        return {
          id, role: "arnold", timestamp: now, source: "rules",
          text: feeling === "great"
            ? "Solid. Any exercise feel too easy? I might need to push you harder."
            : "Good to hear. Anything specific stand out?",
          options: [
            ...session.exercises.slice(0, 4).map(e => ({
              id: `dd_${e.id}`, label: e.name, action: "followup" as const, value: e.id,
            })),
            { id: "dd_none", label: "Nope, all good", action: "followup", value: "none" },
          ],
        };
      }
      if (feeling === "tough" || feeling === "bad") {
        return {
          id, role: "arnold", timestamp: now, source: "rules",
          text: feeling === "tough"
            ? "What made it tough? Pick the exercise that gave you the most trouble."
            : "Sorry to hear that. Let's figure out what happened.",
          options: [
            ...session.exercises.slice(0, 4).map(e => ({
              id: `dd_${e.id}`, label: e.name, action: "followup" as const, value: e.id,
            })),
            { id: "dd_general", label: "Just a bad day overall", action: "followup", value: "general" },
          ],
        };
      }
      // "explain" — open ended, no options
      return {
        id, role: "arnold", timestamp: now, source: "rules",
        text: "Tell me what's on your mind. Type it out.",
      };
    }

    case "pain_check": {
      // Check if user logged any pain during the session
      if (sessionLog.painReports.length > 0) {
        const areas = [...new Set(sessionLog.painReports.map(p => p.bodyArea))];
        return {
          id, role: "arnold", timestamp: now, source: "rules",
          text: `I noticed you flagged discomfort in ${areas.join(" and ")} during the session. Is it still bothering you?`,
          options: [
            { id: "pc_better", label: "It's fine now", action: "followup", value: "better" },
            { id: "pc_same", label: "Still there", action: "followup", value: "same" },
            { id: "pc_worse", label: "Got worse", action: "followup", value: "worse" },
          ],
        };
      }
      return {
        id, role: "arnold", timestamp: now, source: "rules",
        text: "Anything hurting or feeling off?",
        options: [
          { id: "pc_no", label: "All good", action: "followup", value: "no" },
          { id: "pc_yes", label: "Something's bugging me", action: "followup", value: "yes" },
        ],
      };
    }

    case "plan_proposal": {
      if (flow.proposedChanges.length === 0) {
        return {
          id, role: "arnold", timestamp: now, source: "rules",
          text: "Plan stays as is. See you next session.",
          options: [
            { id: "pp_ok", label: "Sounds good", action: "dismiss", value: "ok" },
          ],
        };
      }
      return {
        id, role: "arnold", timestamp: now, source: "rules",
        text: `Based on today, I'd recommend: ${flow.proposedChanges.join(". ")}. Want me to update the plan?`,
        options: [
          { id: "pp_yes", label: "Yes, update it", action: "decision", value: "accept" },
          { id: "pp_no", label: "No, keep as is", action: "decision", value: "reject" },
          { id: "pp_show", label: "Show me what changes", action: "followup", value: "details" },
        ],
      };
    }

    case "confirmation":
      return {
        id, role: "arnold", timestamp: now, source: "rules",
        text: flow.accepted
          ? "Done. Plan updated. Changes ripple through the next few weeks. Rest up."
          : "Got it. Keeping the plan as is. See you next session.",
        options: [
          { id: "conf_ok", label: "Thanks Arnold", action: "dismiss", value: "ok" },
        ],
      };

    case "done":
    default:
      return {
        id, role: "arnold", timestamp: now, source: "rules",
        text: "Session logged. Get some rest.",
      };
  }
}

/** Process user's response and advance the flow */
export function advanceFeedback(
  flow: FeedbackFlow,
  response: string,
  session: PlannedSession,
  sessionLog: SessionLog
): { flow: FeedbackFlow; decisions: CoachingDecision[] } {
  const updated = { ...flow };
  const decisions: CoachingDecision[] = [];

  switch (flow.currentStep) {
    case "overall":
      updated.responses.overall = response;
      updated.currentStep = "drill_down";
      break;

    case "drill_down": {
      updated.responses.drill_down = response;

      // Generate coaching decisions based on drill-down
      if (response !== "none" && response !== "general") {
        const exercise = session.exercises.find(e => e.id === response);
        if (exercise) {
          const feeling = updated.responses.overall;
          if (feeling === "great" || feeling === "good") {
            // Too easy — rules engine handles
            const decision = handleTooEasy(exercise, session.phase);
            decisions.push(decision);
            if (decision.type !== "no_change") {
              updated.proposedChanges.push(
                `Adjust ${exercise.name}: ${decision.type === "progress_exercise" ? "progress to next level" : "add more volume"}`
              );
            }
          } else {
            // Couldn't finish / hard — rules engine handles
            const decision = handleCouldntFinish(exercise, [], { progressionId: exercise.progressionId, status: "active", consecutiveSuccesses: 0 });
            decisions.push(decision);
            if (decision.type !== "no_change") {
              updated.proposedChanges.push(
                `Adjust ${exercise.name}: ${decision.type === "regress_exercise" ? "step back one level" : "reduce volume"}`
              );
            }
          }
        }
      }

      updated.currentStep = "pain_check";
      break;
    }

    case "pain_check":
      updated.responses.pain_check = response;
      if (response === "worse" || response === "same") {
        updated.proposedChanges.push(
          "Add targeted prehab to warm-ups for the next 2 sessions"
        );
      }
      updated.currentStep = updated.proposedChanges.length > 0 ? "plan_proposal" : "done";
      break;

    case "plan_proposal":
      if (response === "accept") {
        updated.accepted = true;
        updated.currentStep = "confirmation";
      } else if (response === "reject") {
        updated.accepted = false;
        updated.currentStep = "confirmation";
      } else {
        // "details" — stay on same step, but next message should show details
        updated.currentStep = "plan_proposal";
      }
      break;

    case "confirmation":
      updated.currentStep = "done";
      break;
  }

  return { flow: updated, decisions };
}
