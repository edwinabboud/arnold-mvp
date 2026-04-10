// =============================================================================
// ARNOLD — Supabase Sync Service
// Fire-and-forget sync from Zustand/AsyncStorage to Supabase.
// AsyncStorage remains the primary read source. Supabase is remote persistence.
// =============================================================================

import { supabase } from "../config/supabase";
import {
  GoalPriority,
  Mesocycle,
  Schedule,
  SessionLog,
  StreakData,
  UserGoalTarget,
  UserProfile,
  UserProgression,
} from "../types";

// ── Helper ─────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

// ── Sync Functions ─────────────────────────────────────────────────────────

export async function syncProfile(
  profile: UserProfile,
  onboardingState?: {
    step: string;
    selectedGoals: string[];
    rankedGoals: GoalPriority[];
    schedule: Schedule | null;
    targets: UserGoalTarget[];
  }
): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      display_name: profile.displayName,
      goals: profile.goals,
      schedule: profile.schedule,
      targets: profile.targets,
      assessment_complete: profile.assessmentComplete,
      onboarding_complete: profile.onboardingComplete,
      onboarding_state: onboardingState ?? {},
    }, { onConflict: "id" });

    if (error) throw error;
    console.log("[ARNOLD SYNC] profiles synced");
  } catch (error) {
    console.warn("[ARNOLD SYNC] profiles sync failed:", error);
  }
}

export async function syncMesocycle(mesocycle: Mesocycle): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase.from("mesocycles").upsert({
      id: mesocycle.id,
      user_id: userId,
      duration_weeks: mesocycle.durationWeeks,
      primary_goal: mesocycle.primaryGoal,
      plan_data: mesocycle,
    }, { onConflict: "id,user_id" });

    if (error) throw error;
    console.log("[ARNOLD SYNC] mesocycles synced");
  } catch (error) {
    console.warn("[ARNOLD SYNC] mesocycles sync failed:", error);
  }
}

export async function syncProgressions(progressions: UserProgression[]): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase.from("user_progressions").upsert({
      user_id: userId,
      progressions,
    }, { onConflict: "user_id" });

    if (error) throw error;
    console.log("[ARNOLD SYNC] user_progressions synced");
  } catch (error) {
    console.warn("[ARNOLD SYNC] user_progressions sync failed:", error);
  }
}

export async function syncStreaks(streaks: StreakData): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase.from("streaks").upsert({
      user_id: userId,
      current_daily: streaks.currentDaily,
      longest_daily: streaks.longestDaily,
      current_weekly: streaks.currentWeekly,
      longest_weekly: streaks.longestWeekly,
      total_sessions: streaks.totalSessions,
      streak_freezes: streaks.streakFreezes,
      milestones: streaks.milestones,
    }, { onConflict: "user_id" });

    if (error) throw error;
    console.log("[ARNOLD SYNC] streaks synced");
  } catch (error) {
    console.warn("[ARNOLD SYNC] streaks sync failed:", error);
  }
}

export async function syncSessionLog(log: SessionLog): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;

    const { error } = await supabase.from("session_logs").upsert({
      id: log.id,
      user_id: userId,
      planned_session_id: log.plannedSessionId,
      started_at: log.startedAt,
      completed_at: log.completedAt,
      log_data: log,
    }, { onConflict: "id,user_id" });

    if (error) throw error;
    console.log("[ARNOLD SYNC] session_logs synced");
  } catch (error) {
    console.warn("[ARNOLD SYNC] session_logs sync failed:", error);
  }
}

export async function syncFullState(state: {
  profile: UserProfile | null;
  onboarding?: {
    step: string;
    selectedGoals: string[];
    rankedGoals: GoalPriority[];
    schedule: Schedule | null;
    targets: UserGoalTarget[];
  };
  activeMesocycle: Mesocycle | null;
  userProgressions: UserProgression[];
  streaks: StreakData;
  sessionHistory: SessionLog[];
}): Promise<void> {
  try {
    const userId = await getUserId();
    if (!userId) return;

    const promises: Promise<void>[] = [];

    if (state.profile) {
      promises.push(syncProfile(state.profile, state.onboarding));
    }
    if (state.activeMesocycle) {
      promises.push(syncMesocycle(state.activeMesocycle));
    }
    if (state.userProgressions.length > 0) {
      promises.push(syncProgressions(state.userProgressions));
    }
    promises.push(syncStreaks(state.streaks));
    for (const log of state.sessionHistory) {
      promises.push(syncSessionLog(log));
    }

    await Promise.all(promises);
    console.log("[ARNOLD SYNC] full state synced");
  } catch (error) {
    console.warn("[ARNOLD SYNC] full state sync failed:", error);
  }
}

// ── Hydrate ────────────────────────────────────────────────────────────────

export async function hydrateFromSupabase(): Promise<{
  profile: UserProfile | null;
  onboardingState: any | null;
  activeMesocycle: Mesocycle | null;
  userProgressions: UserProgression[];
  streaks: StreakData | null;
  sessionHistory: SessionLog[];
} | null> {
  try {
    const userId = await getUserId();
    if (!userId) return null;

    const [profileRes, mesocycleRes, progressionsRes, streaksRes, logsRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("mesocycles").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).single(),
      supabase.from("user_progressions").select("*").eq("user_id", userId).single(),
      supabase.from("streaks").select("*").eq("user_id", userId).single(),
      supabase.from("session_logs").select("*").eq("user_id", userId).order("started_at", { ascending: true }),
    ]);

    // Map profile
    let profile: UserProfile | null = null;
    let onboardingState: any | null = null;
    if (profileRes.data) {
      const p = profileRes.data;
      profile = {
        id: userId,
        createdAt: p.created_at,
        displayName: p.display_name || "",
        goals: p.goals || [],
        schedule: p.schedule || { daysPerWeek: 3, split: "full_body", preferredDays: [], sessionDurationMin: 60 },
        targets: p.targets || [],
        assessmentComplete: p.assessment_complete ?? false,
        onboardingComplete: p.onboarding_complete ?? false,
      };
      onboardingState = p.onboarding_state ?? null;
    }

    // Map mesocycle — stored as full object in plan_data
    let activeMesocycle: Mesocycle | null = null;
    if (mesocycleRes.data?.plan_data) {
      activeMesocycle = mesocycleRes.data.plan_data as Mesocycle;
    }

    // Map progressions — stored as full array in progressions column
    let userProgressions: UserProgression[] = [];
    if (progressionsRes.data?.progressions) {
      userProgressions = progressionsRes.data.progressions as UserProgression[];
    }

    // Map streaks
    let streaks: StreakData | null = null;
    if (streaksRes.data) {
      const s = streaksRes.data;
      streaks = {
        currentDaily: s.current_daily ?? 0,
        longestDaily: s.longest_daily ?? 0,
        currentWeekly: s.current_weekly ?? 0,
        longestWeekly: s.longest_weekly ?? 0,
        totalSessions: s.total_sessions ?? 0,
        streakFreezes: s.streak_freezes ?? 2,
        milestones: s.milestones ?? [],
      };
    }

    // Map session logs — stored as full objects in log_data
    const sessionHistory: SessionLog[] = (logsRes.data || [])
      .filter((row: any) => row.log_data)
      .map((row: any) => row.log_data as SessionLog);

    console.log("[ARNOLD SYNC] hydrated from Supabase");
    return { profile, onboardingState, activeMesocycle, userProgressions, streaks, sessionHistory };
  } catch (error) {
    console.warn("[ARNOLD SYNC] hydrate failed:", error);
    return null;
  }
}
