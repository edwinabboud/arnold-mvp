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
  /** When set, this session was cascaded forward from a missed earlier day this week. */
  cascadedFromDayLabel?: string;
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
  sessionHistory: Array<{ plannedSessionId: string; completedAt?: string }> = [],
  options: { skipCascade?: boolean } = {}
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

  // Check if the user completed ANY session today (e.g. "Train anyway" on a rest day).
  // If so, show that session as completed for today regardless of dayOfWeek match.
  const completedTodayEntry = sessionHistory.find(
    h => h.completedAt && isCompletedToday(h.completedAt)
  );
  if (completedTodayEntry) {
    // Find the planned session that was completed
    const allSessions = mesocycle.weeks.flatMap(w =>
      w.sessions.map(s => ({ session: s, weekNumber: w.weekNumber }))
    );
    const match = allSessions.find(s => s.session.id === completedTodayEntry.plannedSessionId);
    if (match) {
      return buildSessionInfo(match.session, match.weekNumber, true, "Today", true);
    }
  }

  // Cascade: today is a non-training day with no completed session yet. If
  // the user missed exactly ONE scheduled session earlier this calendar
  // (Mon–Sun) week, surface it as "today's" session so the user can just
  // train. Two or more missed → fall through to "next upcoming" (Plan
  // Realignment lives in Spec v2.3 and isn't built yet).
  if (!options.skipCascade) {
    const missed = getMissedSessionsThisWeek(mesocycle, sessionHistory);
    if (missed.length === 1) {
      const m = missed[0];
      return buildSessionInfo(
        m,
        week.weekNumber,
        true,
        "Today",
        false,
        DAY_NAMES[m.dayOfWeek]
      );
    }
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
  isCompleted: boolean,
  cascadedFromDayLabel?: string
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
    cascadedFromDayLabel,
  };
}

export function getSessionSummary(info: SessionInfo): string {
  const parts: string[] = [];
  if (info.warmUpCount > 0) parts.push(`${info.warmUpCount} warm-up`);
  parts.push(`${info.exerciseCount} exercises`);
  if (info.cooldownCount > 0) parts.push(`${info.cooldownCount} cooldown`);
  return parts.join(" · ");
}

/**
 * Returns every session in the user's current week, flagged with whether
 * they've already been completed this week. Used by the swap picker so
 * users can pick any remaining session to train today.
 */
export function getWeekSessions(
  mesocycle: Mesocycle,
  sessionHistory: Array<{ plannedSessionId: string; completedAt?: string }> = []
): Array<{ session: PlannedSession; completedThisWeek: boolean; dayLabel: string }> {
  if (!mesocycle.weeks.length) return [];

  const startDate = new Date(mesocycle.createdAt);
  const daysSinceStart = Math.floor(
    (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weekIndex = Math.floor(daysSinceStart / 7) % mesocycle.weeks.length;
  const week = mesocycle.weeks[weekIndex];
  if (!week?.sessions) return [];

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const completedIds = new Set(
    sessionHistory
      .filter(h =>
        h.completedAt && new Date(h.completedAt).getTime() >= sevenDaysAgo
      )
      .map(h => h.plannedSessionId)
  );

  return week.sessions.map(s => ({
    session: s,
    completedThisWeek: completedIds.has(s.id),
    dayLabel: DAY_NAMES[s.dayOfWeek] ?? "",
  }));
}

/**
 * Returns scheduled sessions in the current mesocycle week whose calendar
 * day has already passed in this calendar (Mon–Sun) week and were NOT
 * completed within this calendar week.
 *
 * Used for cascade detection: if exactly one is returned, surface it as
 * today's session so the user can train it on the next non-training day.
 */
export function getMissedSessionsThisWeek(
  mesocycle: Mesocycle,
  sessionHistory: Array<{ plannedSessionId: string; completedAt?: string }> = [],
  now: Date = new Date()
): PlannedSession[] {
  if (!mesocycle.weeks.length) return [];

  const startDate = new Date(mesocycle.createdAt);
  const daysSinceStart = Math.floor(
    (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const weekIndex = Math.floor(daysSinceStart / 7) % mesocycle.weeks.length;
  const week = mesocycle.weeks[weekIndex];
  if (!week?.sessions) return [];

  // Calendar Mon–Sun week boundary
  const monSunStart = new Date(now);
  const dow = monSunStart.getDay();
  const daysBackToMonday = dow === 0 ? 6 : dow - 1;
  monSunStart.setDate(monSunStart.getDate() - daysBackToMonday);
  monSunStart.setHours(0, 0, 0, 0);
  const monSunEnd = new Date(monSunStart);
  monSunEnd.setDate(monSunEnd.getDate() + 7);

  // Map dayOfWeek to Mon-first ordering: Mon=0, Tue=1, ..., Sun=6
  const monFirst = (d: number) => (d === 0 ? 6 : d - 1);
  const todayPos = monFirst(now.getDay());

  // Sessions completed within current calendar Mon–Sun week
  const completedIds = new Set(
    sessionHistory
      .filter(h => {
        if (!h.completedAt) return false;
        const t = new Date(h.completedAt).getTime();
        return t >= monSunStart.getTime() && t < monSunEnd.getTime();
      })
      .map(h => h.plannedSessionId)
  );

  return week.sessions.filter(s => {
    const earlierThisWeek = monFirst(s.dayOfWeek) < todayPos;
    return earlierThisWeek && !completedIds.has(s.id);
  });
}
