// =============================================================================
// ARNOLD — Session Finder
// Finds today's session or the next upcoming session from the mesocycle.
// =============================================================================

import { Mesocycle, PlannedSession } from "../types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export interface SessionInfo {
  session: PlannedSession;
  dayLabel: string;
  isToday: boolean;
  isCompleted: boolean;
  weekNumber: number;
  phase: string;
  exerciseCount: number;
  warmUpCount: number;
  cooldownCount: number;
}

function isCompletedToday(completedAt: string): boolean {
  const completed = new Date(completedAt);
  const now = new Date();
  return completed.getFullYear() === now.getFullYear()
    && completed.getMonth() === now.getMonth()
    && completed.getDate() === now.getDate();
}

export function findCurrentSession(
  mesocycle: Mesocycle,
  sessionHistory: Array<{ plannedSessionId: string; completedAt?: string }> = []
): SessionInfo | null {
  if (!mesocycle.weeks.length) return null;

  const today = new Date().getDay();
  const startDate = new Date(mesocycle.createdAt);
  const daysSinceStart = Math.floor(
    (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const rawWeekIndex = Math.floor(daysSinceStart / 7);
  const weekIndex = rawWeekIndex % mesocycle.weeks.length;
  const week = mesocycle.weeks[weekIndex];

  if (!week.sessions.length) return null;

  const todaySession = week.sessions.find(s => s.dayOfWeek === today);
  if (todaySession) {
    const completedEntry = sessionHistory.find(
      h => h.plannedSessionId === todaySession.id && h.completedAt && isCompletedToday(h.completedAt)
    );
    return buildSessionInfo(todaySession, week.weekNumber, true, "Today", !!completedEntry);
  }

  for (let offset = 1; offset <= 6; offset++) {
    const checkDay = (today + offset) % 7;
    const nextSession = week.sessions.find(s => s.dayOfWeek === checkDay);
    if (nextSession) {
      return buildSessionInfo(nextSession, week.weekNumber, false, DAY_NAMES[checkDay], false);
    }
  }

  const nextWeekIndex = (weekIndex + 1) % mesocycle.weeks.length;
  const nextWeek = mesocycle.weeks[nextWeekIndex];
  if (nextWeek.sessions.length > 0) {
    const firstNext = nextWeek.sessions[0];
    return buildSessionInfo(firstNext, nextWeek.weekNumber, false, DAY_NAMES[firstNext.dayOfWeek], false);
  }

  return null;
}

function buildSessionInfo(
  session: PlannedSession,
  weekNumber: number,
  isToday: boolean,
  dayLabel: string,
  isCompleted: boolean
): SessionInfo {
  return {
    session,
    dayLabel,
    isToday,
    isCompleted,
    weekNumber,
    phase: session.phase.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    exerciseCount: session.exercises.length,
    warmUpCount: session.warmUpExercises.length,
    cooldownCount: session.cooldownExercises.length,
  };
}

export function getSessionSummary(info: SessionInfo): string {
  const parts: string[] = [];
  if (info.warmUpCount > 0) parts.push(`${info.warmUpCount} warm-up`);
  parts.push(`${info.exerciseCount} exercises`);
  if (info.cooldownCount > 0) parts.push(`${info.cooldownCount} cooldown`);
  return parts.join(" · ");
}
