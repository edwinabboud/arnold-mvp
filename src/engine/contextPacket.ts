// =============================================================================
// ARNOLD — Context Packet Builder
// Reads knowledge JSONs, selects relevant snippets based on user state,
// assembles context packets for agent calls.
// Phase 1: basic structure. Phase 3: full {{KNOWLEDGE_CONTEXT}} injection.
// =============================================================================

import type { ProgramPath, TrainerTier, PlanPhase, PlannedSession } from "../types";
import type { E1RMProfile } from "./weightEngine";

// ── Load Knowledge Base ─────────────────────────────────────────────────────

const streetLifterKB = require("../knowledge/periodization/streetLifter.json");
const skillBuilderKB = require("../knowledge/periodization/skillBuilder.json");
const hybridAthleteKB = require("../knowledge/periodization/hybridAthlete.json");
const principlesKB = require("../knowledge/periodization/principles.json");
const autoregulationKB = require("../knowledge/autoregulation/weightProgression.json");

const PATH_KNOWLEDGE: Record<string, any> = {
  street_lifter: streetLifterKB,
  skill_builder: skillBuilderKB,
  hybrid_athlete: hybridAthleteKB,
};

// ── Context Packet Type ─────────────────────────────────────────────────────

export interface ContextPacket {
  /** User state summary for the agent */
  user: {
    path: ProgramPath;
    tier: TrainerTier;
    phase: PlanPhase;
    weekNumber: number;
    dayType: string;
    bodyweightKg: number;
    e1rm: {
      dip: { totalE1RM: number; addedE1RM: number } | null;
      pullUp: { totalE1RM: number; addedE1RM: number } | null;
      squat: { totalE1RM: number; addedE1RM: number } | null;
    };
  };
  /** Current session info */
  currentSession: {
    label: string;
    exerciseCount: number;
    phase: PlanPhase;
  };
  /** Phase-specific coaching guidance from the knowledge base */
  phaseGuidance: string;
  /** Autoregulation context */
  autoregulation: {
    table: Array<{ condition: string; adjustment: string; notes: string }>;
    rampUpNote: string;
  };
  /** Day-type-specific notes (e.g. "Peak singles day — always peaking intensity") */
  dayTypeNotes: string;
  /** Path-specific knowledge snippets relevant to current context */
  knowledgeSnippets: string[];
}

// ── Builder ─────────────────────────────────────────────────────────────────

export function buildContextPacket(params: {
  path: ProgramPath;
  tier: TrainerTier;
  phase: PlanPhase;
  weekNumber: number;
  session: PlannedSession;
  bodyweightKg: number;
  e1rmProfile: E1RMProfile | null;
}): ContextPacket {
  const { path, tier, phase, weekNumber, session, bodyweightKg, e1rmProfile } = params;
  const pathKB = PATH_KNOWLEDGE[path] ?? streetLifterKB;

  const dayType = detectDayType(session, path);
  const phaseGuidance = getPhaseGuidance(pathKB, tier, phase);
  const dayTypeNotes = getDayTypeNotes(pathKB, tier, dayType);
  const snippets = selectKnowledgeSnippets(pathKB, path, tier, phase, dayType);

  return {
    user: {
      path,
      tier,
      phase,
      weekNumber,
      dayType,
      bodyweightKg,
      e1rm: {
        dip: e1rmProfile?.dip ? { totalE1RM: e1rmProfile.dip.totalE1RM, addedE1RM: e1rmProfile.dip.addedE1RM } : null,
        pullUp: e1rmProfile?.pullUp ? { totalE1RM: e1rmProfile.pullUp.totalE1RM, addedE1RM: e1rmProfile.pullUp.addedE1RM } : null,
        squat: e1rmProfile?.squat ? { totalE1RM: e1rmProfile.squat.totalE1RM, addedE1RM: e1rmProfile.squat.addedE1RM } : null,
      },
    },
    currentSession: {
      label: session.label,
      exerciseCount: session.exercises.length,
      phase: session.phase,
    },
    phaseGuidance,
    autoregulation: {
      table: autoregulationKB.autoregulationTable,
      rampUpNote: autoregulationKB.rampUpPercentages.notes,
    },
    dayTypeNotes,
    knowledgeSnippets: snippets,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function detectDayType(session: PlannedSession, path: ProgramPath): string {
  const label = session.label.toLowerCase();

  if (path === "street_lifter" || path === "hybrid_athlete") {
    if (label.includes("peak") || label.includes("singles")) return "peak_singles";
    if (label.includes("dip") || label.includes("push")) return "heavy_dips";
    if (label.includes("pull")) return "heavy_pullups";
    if (label.includes("skill")) return "skill_day";
    if (label.includes("leg")) return "leg_day";
  }

  if (path === "skill_builder") {
    if (label.includes("push")) return "skill_push";
    if (label.includes("pull")) return "skill_pull";
    if (label.includes("strength")) return "strength_upper";
    if (label.includes("leg")) return "legs_core";
  }

  return "general";
}

function getPhaseGuidance(pathKB: any, tier: TrainerTier, phase: PlanPhase): string {
  const tierData = pathKB[tier];
  if (!tierData?.phases) return "";

  const phaseData = tierData.phases.find((p: any) => p.name === phase);
  return phaseData?.guidance ?? "";
}

function getDayTypeNotes(pathKB: any, tier: TrainerTier, dayType: string): string {
  const tierData = pathKB[tier];
  if (!tierData?.dayTypes) return "";

  const dt = tierData.dayTypes.find((d: any) => d.name === dayType);
  return dt?.notes ?? "";
}

function selectKnowledgeSnippets(
  pathKB: any,
  path: ProgramPath,
  tier: TrainerTier,
  phase: PlanPhase,
  dayType: string,
): string[] {
  const snippets: string[] = [];

  // 1. Path description
  if (pathKB.description) {
    snippets.push(`Path: ${pathKB.description}`);
  }

  // 2. Core rule (hybrid)
  if (pathKB.coreRule) {
    snippets.push(`Core rule: ${pathKB.coreRule}`);
  }

  // 3. Variation cycling info (street lifter / hybrid in accumulation or strength)
  if (pathKB[tier]?.variationCycling && (phase === "accumulation" || phase === "strength")) {
    snippets.push("Back-off variations rotate weekly within each phase block.");
  }

  // 4. Skill rules (skill builder / hybrid)
  if (path === "skill_builder" && pathKB.coreRules) {
    snippets.push(`Skill rules: ${pathKB.coreRules.join(". ")}`);
  }

  // 5. Volume targets
  const volTargets = pathKB[tier]?.weeklyVolumeTargets?.[phase];
  if (volTargets) {
    snippets.push(`Volume targets (${phase}): Pull ${volTargets.pull}, Push ${volTargets.push}, Legs ${volTargets.legs}`);
  }

  // 6. Day-type-specific intensity override
  if (dayType === "peak_singles") {
    snippets.push("Peak singles day: always uses peaking intensity regardless of mesocycle phase. Weekly max expression.");
  }

  // 7. Universal principle relevant to phase
  const relevantPrinciple = getRelevantPrinciple(phase);
  if (relevantPrinciple) {
    snippets.push(`Training principle: ${relevantPrinciple}`);
  }

  return snippets;
}

function getRelevantPrinciple(phase: PlanPhase): string {
  switch (phase) {
    case "accumulation":
    case "base_building":
    case "hypertrophy":
      return principlesKB.principles.find((p: any) => p.name === "Progressive Overload")?.application ?? "";
    case "deload":
      return principlesKB.principles.find((p: any) => p.name === "Fatigue Management")?.application ?? "";
    case "peaking":
    case "test":
    case "skill_peaking":
      return principlesKB.principles.find((p: any) => p.name === "Specificity")?.application ?? "";
    case "strength":
    case "intensity":
      return principlesKB.principles.find((p: any) => p.name === "SRA Curve")?.application ?? "";
    default:
      return "";
  }
}

// ── Stringify for injection ─────────────────────────────────────────────────

/**
 * Returns the context packet as a formatted string for injection into agent prompts.
 * Phase 3 will use this with {{KNOWLEDGE_CONTEXT}} template variables.
 */
export function contextPacketToString(packet: ContextPacket): string {
  const lines: string[] = [];

  lines.push(`=== COACHING CONTEXT ===`);
  lines.push(`Path: ${packet.user.path} | Tier: ${packet.user.tier} | Phase: ${packet.user.phase} | Week: ${packet.user.weekNumber}`);
  lines.push(`Day: ${packet.currentSession.label} (${packet.user.dayType})`);
  lines.push(`BW: ${packet.user.bodyweightKg}kg`);

  if (packet.user.e1rm.dip) {
    lines.push(`Dip e1RM: ${packet.user.e1rm.dip.totalE1RM}kg total (${packet.user.e1rm.dip.addedE1RM}kg added)`);
  }
  if (packet.user.e1rm.pullUp) {
    lines.push(`Pull-up e1RM: ${packet.user.e1rm.pullUp.totalE1RM}kg total (${packet.user.e1rm.pullUp.addedE1RM}kg added)`);
  }

  if (packet.phaseGuidance) {
    lines.push(`\nPhase guidance: ${packet.phaseGuidance}`);
  }

  if (packet.dayTypeNotes) {
    lines.push(`Day notes: ${packet.dayTypeNotes}`);
  }

  if (packet.knowledgeSnippets.length > 0) {
    lines.push(`\nKnowledge:`);
    packet.knowledgeSnippets.forEach(s => lines.push(`- ${s}`));
  }

  return lines.join("\n");
}
