// =============================================================================
// ARNOLD — Global Store (Zustand)
// =============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Mesocycle,
  PainReport,
  PlannedExercise,
  PlannedSession,
  ProgramPath,
  Schedule,
  SessionLog,
  SessionTier,
  StreakData,
  TrainerTier,
  UserGoalTarget,
  UserProfile,
  UserProgression,
  WarmUpLength,
  CompletedSet,
} from "../types";
import { processSessionForAdaptation } from "../engine/silentAdaptation";
import { applyAdaptationDecisions } from "../engine/applyAdaptation";
import {
  rebalanceMesocycleToSchedule,
  applyTierCutsToMesocycle,
} from "../engine/planGenerator";
import { syncProfile, syncMesocycle, syncProgressions, syncStreaks, syncSessionLog } from '../services/supabaseSync';
import {
  AdaptationQueue,
  createEmptyQueue,
  addToQueue,
  getWeightAdjustmentWithSources,
  markAsApplied,
} from "../engine/adaptationQueue";

// ── Onboarding State ────────────────────────────────────────────────────────

interface OnboardingState {
  step: "goals" | "ranking" | "schedule" | "targets" | "assessment_intro" | "done";
  selectedGoals: string[];
  rankedGoals: Array<{ goal: string; rank: number }>; // deprecated — kept for compat
  programPath: ProgramPath | null;
  tier: TrainerTier | null;
  schedule: Schedule | null;
  targets: UserGoalTarget[];
}

// ── Session State ───────────────────────────────────────────────────────────

interface ActiveSession {
  plannedSession: PlannedSession;
  currentExerciseIndex: number;
  currentSetIndex: number;
  warmUpChoice: WarmUpLength;
  cooldownChoice: WarmUpLength;
  completedSets: CompletedSet[];
  painReports: PainReport[];
  startedAt: string;
  isResting: boolean;
  restSecondsRemaining: number;
}

// ── Store ───────────────────────────────────────────────────────────────────

interface ArnoldStore {
  // User
  profile: UserProfile | null;
  setProfile: (profile: UserProfile) => void;
  /** Granular schedule-only update — preserves the rest of profile, rebalances
   *  uncompleted mesocycle sessions to the new preferredDays/daysPerWeek. */
  setProfileSchedule: (schedule: Schedule) => void;
  /** v2.4.7 (MVP 1.18) — change session-length tier. Writes profile.schedule
   *  and re-applies path-specific cuts to uncompleted sessions in the active
   *  mesocycle. Subject to the one-way ratchet documented on `applyCutsForTier`. */
  setSessionTier: (tier: SessionTier) => void;

  // Onboarding
  onboarding: OnboardingState;
  setOnboardingStep: (step: OnboardingState["step"]) => void;
  toggleGoal: (goalId: string) => void;
  /** @deprecated — kept for onboarding compat */
  setRankedGoals: (goals: Array<{ goal: string; rank: number }>) => void;
  setSchedule: (schedule: Schedule) => void;
  addTarget: (target: UserGoalTarget) => void;
  completeOnboarding: () => void;

  // Plan
  activeMesocycle: Mesocycle | null;
  setActiveMesocycle: (plan: Mesocycle) => void;

  // Progressions
  userProgressions: UserProgression[];
  setUserProgressions: (progressions: UserProgression[]) => void;
  updateProgression: (id: string, updates: Partial<UserProgression>) => void;

  // Active session
  activeSession: ActiveSession | null;
  startSession: (planned: PlannedSession, warmUp: WarmUpLength) => void;
  logSet: (set: CompletedSet) => void;
  logPain: (pain: PainReport) => void;
  advanceExercise: () => void;
  endSession: () => void;

  // Streaks
  streaks: StreakData;
  /** Tracks which Mon-Sun week the increment/reset check last ran. ISO date string of that week's Monday (e.g. "2026-05-04"). Prevents double-firing. */
  lastStreakCheckWeek: string | null;
  /** v2.4.9 Part 1 — true once the one-time migration message has been
   *  enqueued for an existing compact/standard user. Persisted so it fires
   *  exactly once per install. New users (post-onboarding) don't get the
   *  message — useChatService gates on tier === "compact" | "standard". */
  v249MigrationShown: boolean;
  /** v2.4.9 Part 1 — mark the migration message as shown. */
  markV249MigrationShown: () => void;
  /** Arnold-approved drops per week from Plan Realignment Option 2. Key = ISO date of week's Monday. Populated by Plan Realignment dialog (not yet built). */
  weeklyDrops: Record<string, number>;
  incrementStreak: () => void;
  /** Resets currentDaily/currentWeekly to 0 if previous Mon-Sun week was fully missed AND user has sessions before that week. Idempotent. */
  checkAndResetWeeklyStreak: () => void;
  /** Full weekly evaluation: increments currentWeekly if ≥ 100% adjusted sessions completed last week; resets to 0 otherwise. Runs once per calendar week (gated by lastStreakCheckWeek). */
  checkAndIncrementWeekly: () => void;
  setStreaks: (streaks: StreakData) => void;

  // Session history
  sessionHistory: SessionLog[];
  addSessionLog: (log: SessionLog) => void;
  setSessionHistory: (history: SessionLog[]) => void;

  // Onboarding (hydration only)
  setOnboardingState: (state: OnboardingState) => void;

  // Adaptation queue
  adaptationQueue: AdaptationQueue;
  /** Dev-only: log of the last applied adjustments on session start. Empty if none applied yet. */
  lastAppliedAdjustments: string[];
  setAdaptationQueue: (queue: AdaptationQueue) => void;
  clearAdaptationQueue: () => void;

  // Full reset
  resetStore: () => void;
  /** Wipes all in-memory store state for account deletion. Same as resetStore;
   *  named separately so the call site reads intent. AsyncStorage clearing and
   *  Supabase sign-out are handled by the caller (DeleteAccountDialog). */
  resetForAccountDeletion: () => void;
}

const initialOnboarding: OnboardingState = {
  step: "goals",
  selectedGoals: [],
  rankedGoals: [],
  programPath: null,
  tier: null,
  schedule: null,
  targets: [],
};

const initialStreaks: StreakData = {
  currentDaily: 0,
  longestDaily: 0,
  currentWeekly: 0,
  longestWeekly: 0,
  totalSessions: 0,
  streakFreezes: 2,
  milestones: [],
};

/** Returns the ISO date string (YYYY-MM-DD) of the Monday that starts the calendar week containing `date`. Used to key lastStreakCheckWeek. */
function getIsoWeekKey(date: Date): string {
  const d = new Date(date);
  const dow = d.getDay();
  const daysBackToMonday = dow === 0 ? 6 : dow - 1;
  d.setDate(d.getDate() - daysBackToMonday);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10); // e.g. "2026-05-04"
}

// Fire-and-forget sync — never blocks, never throws
function bgSync(fn: () => Promise<void>) {
  fn().catch(e => console.warn('[ARNOLD] Background sync error:', e));
}

export const useStore = create<ArnoldStore>()(
  persist(
    (set, get) => ({
      // ── User ────────────────────────────────────────────────────────────
      profile: null,
      setProfile: (profile) => {
        set({ profile });
        bgSync(() => syncProfile(profile));
      },

      // MVP 1.17 — schedule editing post-onboarding. Updates profile.schedule,
      // rebalances the active mesocycle's uncompleted sessions to the new
      // preferredDays, and syncs both. Completed sessions are preserved
      // (history is immutable, identified via sessionHistory).
      setProfileSchedule: (schedule) => {
        set((s) => {
          if (!s.profile) return s;
          return { profile: { ...s.profile, schedule } };
        });
        const state = get();
        if (state.activeMesocycle) {
          const rebalanced = rebalanceMesocycleToSchedule(
            state.activeMesocycle,
            schedule,
            state.sessionHistory,
          );
          set({ activeMesocycle: rebalanced });
          bgSync(() => syncMesocycle(rebalanced));
        }
        const finalProfile = get().profile;
        if (finalProfile) bgSync(() => syncProfile(finalProfile));
      },

      // v2.4.7 (MVP 1.18) — session-length tier. See applyCutsForTier JSDoc
      // for the cut tables AND the ratchet limitation (upgrading mid-mesocycle
      // does not restore previously-dropped exercises).
      setSessionTier: (tier) => {
        const state = get();
        if (!state.profile) return;
        const newSchedule: Schedule = { ...state.profile.schedule, sessionTier: tier };
        set({ profile: { ...state.profile, schedule: newSchedule } });

        if (state.activeMesocycle) {
          const completedIds = new Set(state.sessionHistory.map((h) => h.plannedSessionId));
          const newMeso = applyTierCutsToMesocycle(
            state.activeMesocycle,
            tier,
            state.profile.programPath,
            completedIds,
          );
          set({ activeMesocycle: newMeso });
          bgSync(() => syncMesocycle(newMeso));
        }
        const updated = get().profile;
        if (updated) bgSync(() => syncProfile(updated));
      },

      // ── Onboarding ──────────────────────────────────────────────────────
      onboarding: initialOnboarding,
      setOnboardingStep: (step) =>
        set((s) => ({ onboarding: { ...initialOnboarding, ...s.onboarding, step } })),

      toggleGoal: (goalId) =>
        set((s) => {
          const current = s.onboarding?.selectedGoals || [];
          const next = current.includes(goalId)
            ? current.filter((g) => g !== goalId)
            : [...current, goalId];
          return { onboarding: { ...initialOnboarding, ...s.onboarding, selectedGoals: next } };
        }),

      setRankedGoals: (goals) =>
        set((s) => ({ onboarding: { ...initialOnboarding, ...s.onboarding, rankedGoals: goals } })),

      setSchedule: (schedule) =>
        set((s) => ({ onboarding: { ...initialOnboarding, ...s.onboarding, schedule } })),

      addTarget: (target) =>
        set((s) => ({
          onboarding: {
            ...initialOnboarding,
            ...s.onboarding,
            targets: [...(s.onboarding?.targets || []), target],
          },
        })),

      completeOnboarding: () => {
        set((s) => ({
          onboarding: { ...s.onboarding, step: "done" },
          profile: s.profile
            ? { ...s.profile, onboardingComplete: true }
            : null,
        }));
        const state = get();
        if (state.profile) {
          bgSync(() => syncProfile(state.profile!, state.onboarding));
        }
      },

      // ── Plan ────────────────────────────────────────────────────────────
      activeMesocycle: null,
      setActiveMesocycle: (plan) => {
        set({ activeMesocycle: plan });
        bgSync(() => syncMesocycle(plan));
      },

      // ── Progressions ────────────────────────────────────────────────────
      userProgressions: [],
      setUserProgressions: (progressions) => {
        set({ userProgressions: progressions });
        bgSync(() => syncProgressions(progressions));
      },
      updateProgression: (id, updates) => {
        set((s) => ({
          userProgressions: s.userProgressions.map((p) =>
            p.progressionId === id ? { ...p, ...updates } : p
          ),
        }));
        bgSync(() => syncProgressions(get().userProgressions));
      },

      // ── Active Session ──────────────────────────────────────────────────
      activeSession: null,

      startSession: (planned, warmUp) => {
        if (__DEV__) {
          console.log("[ARNOLD ACTIVESESSION] startSession called, will overwrite existing:", !!get().activeSession);
        }
        // Close the autoregulation loop. The user's feedback was about how
        // the MAIN working set felt. Apply the queued delta to the main
        // exercise, then scale every other exercise sharing the same
        // progressionId (ramps, volume, finisher) by the same RATIO so they
        // stay proportional.
        const queue = get().adaptationQueue;
        const appliedIds: string[] = [];
        const appliedLog: string[] = [];

        // Step 1: figure out the new main weight for each progressionId
        //         that has a queued delta, by finding its main exercise.
        const allExercises = [
          ...planned.exercises,
          ...planned.warmUpExercises,
          ...planned.cooldownExercises,
        ];
        const ratiosByProgressionId = new Map<
          string,
          { ratio: number; mainOldKg: number; mainNewKg: number }
        >();
        const seenProgressionIds = new Set<string>();
        for (const ex of allExercises) {
          if (seenProgressionIds.has(ex.progressionId)) continue;
          const { delta, itemIds } = getWeightAdjustmentWithSources(queue, ex.progressionId);
          if (delta === 0 || itemIds.length === 0) continue;
          seenProgressionIds.add(ex.progressionId);
          const mainEx = allExercises.find(
            e => e.progressionId === ex.progressionId && e.exerciseRole === "main",
          );
          if (!mainEx) {
            console.warn(
              `[ARNOLD] No 'main' exercise found for progressionId "${ex.progressionId}". Skipping ratio scaling.`,
            );
            ratiosByProgressionId.set(ex.progressionId, {
              ratio: 1, mainOldKg: 0, mainNewKg: 0,
            });
            appliedIds.push(...itemIds);
            continue;
          }
          const mainOldKg = mainEx.addedWeightKg ?? 0;
          const mainNewKg = Math.max(0, mainOldKg + delta);
          const ratio = mainOldKg > 0 ? mainNewKg / mainOldKg : 1;
          ratiosByProgressionId.set(ex.progressionId, { ratio, mainOldKg, mainNewKg });
          appliedIds.push(...itemIds);
        }

        // Step 2: walk every exercise. For ones whose progressionId is in
        // the ratio map, scale proportionally.
        const applyToExercise = (ex: PlannedExercise): PlannedExercise => {
          const ratioEntry = ratiosByProgressionId.get(ex.progressionId);
          if (!ratioEntry) return ex;

          const prev = ex.addedWeightKg ?? 0;

          if (ratioEntry.ratio === 1 && ratioEntry.mainOldKg === 0) {
            return ex; // fallback: no main found or main was 0
          }

          const scaled = prev * ratioEntry.ratio;
          const next = Math.max(0, Math.round(scaled / 1.25) * 1.25);

          if (next === prev) return ex;

          appliedLog.push(`${ex.name}: ${prev}kg → ${next}kg`);
          return { ...ex, addedWeightKg: next === 0 ? undefined : next };
        };

        const mutatedSession: PlannedSession = {
          ...planned,
          exercises: planned.exercises.map(applyToExercise),
          warmUpExercises: planned.warmUpExercises.map(applyToExercise),
          cooldownExercises: planned.cooldownExercises.map(applyToExercise),
        };

        const updatedQueue = markAsApplied(queue, appliedIds);

        if (appliedLog.length > 0) {
          console.log("[ARNOLD] Applied queued weight adjustments:", appliedLog);
        } else {
          console.log("[ARNOLD] No queued adjustments to apply.");
        }

        set({
          activeSession: {
            plannedSession: mutatedSession,
            currentExerciseIndex: 0,
            currentSetIndex: 0,
            warmUpChoice: warmUp,
            cooldownChoice: "skip",
            completedSets: [],
            painReports: [],
            startedAt: new Date().toISOString(),
            isResting: false,
            restSecondsRemaining: 0,
          },
          adaptationQueue: updatedQueue,
          lastAppliedAdjustments: appliedLog,
        });
      },

      logSet: (completedSet) => {
        if (__DEV__) {
          console.log("[ARNOLD ACTIVESESSION] logSet called, exId:", completedSet.exerciseId, "setNum:", completedSet.setNumber);
        }
        set((s) => {
          if (!s.activeSession) return s;
          return {
            activeSession: {
              ...s.activeSession,
              completedSets: [...s.activeSession.completedSets, completedSet],
              currentSetIndex: s.activeSession.currentSetIndex + 1,
              isResting: true,
            },
          };
        });
      },

      logPain: (pain) =>
        set((s) => {
          if (!s.activeSession) return s;
          return {
            activeSession: {
              ...s.activeSession,
              painReports: [...s.activeSession.painReports, pain],
            },
          };
        }),

      advanceExercise: () =>
        set((s) => {
          if (!s.activeSession) return s;
          return {
            activeSession: {
              ...s.activeSession,
              currentExerciseIndex:
                s.activeSession.currentExerciseIndex + 1,
              currentSetIndex: 0,
              isResting: false,
            },
          };
        }),

      endSession: () => {
        console.log("[ARNOLD DEBUG] endSession called");
        const session = get().activeSession;
        if (session) {
          console.log("[ARNOLD DEBUG] activeSession exists. completedSets:", session.completedSets.length);
          const log: SessionLog = {
            id: `session_${Date.now()}`,
            plannedSessionId: session.plannedSession.id,
            userId: get().profile?.id || "",
            startedAt: session.startedAt,
            completedAt: new Date().toISOString(),
            status: "completed",
            warmUpChoice: session.warmUpChoice,
            cooldownChoice: session.cooldownChoice,
            completedSets: session.completedSets,
            painReports: session.painReports,
            swaps: [],
          };
          set((s) => ({
            activeSession: null,
            sessionHistory: [...s.sessionHistory, log],
          }));
          get().incrementStreak();

          // Run silent adaptation
          try {
            const state = get();
            if (state.activeMesocycle && state.sessionHistory.length > 0) {
              const latestLog = state.sessionHistory[state.sessionHistory.length - 1];

              console.log("[ARNOLD DEBUG] Processing session for adaptation. Sets:", latestLog.completedSets.length,
                "perceivedDifficulty sample:", latestLog.completedSets[0]?.perceivedDifficulty);

              const adaptationResult = processSessionForAdaptation(
                latestLog,
                state.sessionHistory.slice(0, -1),
                state.activeMesocycle,
                state.userProgressions
              );

              console.log("[ARNOLD DEBUG] Adaptation result:", {
                decisions: adaptationResult.decisions.length,
                weightAdaptations: adaptationResult.weightAdaptations?.length,
                flags: adaptationResult.flags.length,
              });
              console.log("[ARNOLD] Silent adaptation:", adaptationResult.internalLog);

              // Apply progression decisions immediately (advance/regress)
              if (adaptationResult.decisions.length > 0) {
                const { updatedMesocycle, updatedProgressions, changesApplied } =
                  applyAdaptationDecisions(adaptationResult, state.activeMesocycle, state.userProgressions);

                set({
                  activeMesocycle: updatedMesocycle,
                  userProgressions: updatedProgressions,
                });

                console.log("[ARNOLD] Progression changes applied:", changesApplied);
              }

              // Queue weight adaptations (surfaced in chat, applied on next session)
              if (adaptationResult.weightAdaptations && adaptationResult.weightAdaptations.length > 0) {
                let queue = get().adaptationQueue;
                for (const item of adaptationResult.weightAdaptations) {
                  queue = addToQueue(queue, item, latestLog.id);
                }
                set({ adaptationQueue: queue });
                console.log("[ARNOLD] Weight adaptations queued:", adaptationResult.weightAdaptations.map(a => a.change));
              }

              if (adaptationResult.flags.length > 0) {
                console.log("[ARNOLD] Flags:", adaptationResult.flags.map(f => f.detail));
              }
            }
          } catch (error) {
            console.error("[ARNOLD] Silent adaptation error:", error);
          }

          // Sync session log + updated state to Supabase
          bgSync(async () => {
            await syncSessionLog(log);
            const s = get();
            await syncStreaks(s.streaks);
            if (s.activeMesocycle) await syncMesocycle(s.activeMesocycle);
            await syncProgressions(s.userProgressions);
          });
        }
      },

      // ── Streaks ─────────────────────────────────────────────────────────
      streaks: initialStreaks,
      lastStreakCheckWeek: null,
      weeklyDrops: {},
      v249MigrationShown: false,
      markV249MigrationShown: () => set({ v249MigrationShown: true }),
      incrementStreak: () => {
        set((s) => {
          const newDaily = s.streaks.currentDaily + 1;
          return {
            streaks: {
              ...s.streaks,
              currentDaily: newDaily,
              longestDaily: Math.max(newDaily, s.streaks.longestDaily),
              totalSessions: s.streaks.totalSessions + 1,
            },
          };
        });
        bgSync(() => syncStreaks(get().streaks));
      },

      checkAndResetWeeklyStreak: () => {
        const state = get();
        if (state.sessionHistory.length === 0) return;
        if (state.streaks.currentDaily === 0 && state.streaks.currentWeekly === 0) return;

        const sixtySecAgo = Date.now() - 60 * 1000;
        const recentSession = state.sessionHistory.some(h => {
          if (!h.completedAt) return false;
          return new Date(h.completedAt).getTime() > sixtySecAgo;
        });
        if (recentSession) return;

        // Calendar Mon-Sun week boundaries
        const now = new Date();
        const dow = now.getDay();
        const daysBackToMonday = dow === 0 ? 6 : dow - 1;
        const thisMonStart = new Date(now);
        thisMonStart.setDate(thisMonStart.getDate() - daysBackToMonday);
        thisMonStart.setHours(0, 0, 0, 0);
        const lastMonStart = new Date(thisMonStart);
        lastMonStart.setDate(lastMonStart.getDate() - 7);

        const thisMon = thisMonStart.getTime();
        const lastMon = lastMonStart.getTime();

        let hasSessionLastWeek = false;
        let hasSessionBeforeLastWeek = false;
        for (const log of state.sessionHistory) {
          if (!log.completedAt) continue;
          const t = new Date(log.completedAt).getTime();
          if (t >= lastMon && t < thisMon) {
            hasSessionLastWeek = true;
          } else if (t < lastMon) {
            hasSessionBeforeLastWeek = true;
          }
        }

        if (!hasSessionLastWeek && hasSessionBeforeLastWeek) {
          set({
            streaks: {
              ...state.streaks,
              currentDaily: 0,
              currentWeekly: 0,
            },
          });
          console.log("[ARNOLD] Streak reset: previous Mon-Sun week had zero sessions.");
          bgSync(() => syncStreaks(get().streaks));
        }
      },

      checkAndIncrementWeekly: () => {
        const state = get();

        // Guard 1: no history at all — nothing to evaluate
        if (state.sessionHistory.length === 0) return;

        // Guard 2: only run once per calendar week
        const now = new Date();
        const currentWeekKey = getIsoWeekKey(now);
        if (state.lastStreakCheckWeek === currentWeekKey) return;

        // Guard 3: 60-second recent-session guard (same as checkAndResetWeeklyStreak)
        // Prevents false evaluation during hot re-renders immediately after endSession
        const sixtySecAgo = Date.now() - 60 * 1000;
        const recentSession = state.sessionHistory.some(h => {
          if (!h.completedAt) return false;
          return new Date(h.completedAt).getTime() > sixtySecAgo;
        });
        if (recentSession) return;

        // Compute last Mon-Sun week boundaries
        const dow = now.getDay();
        const daysBackToMonday = dow === 0 ? 6 : dow - 1;
        const thisMonStart = new Date(now);
        thisMonStart.setDate(thisMonStart.getDate() - daysBackToMonday);
        thisMonStart.setHours(0, 0, 0, 0);
        const lastMonStart = new Date(thisMonStart);
        lastMonStart.setDate(lastMonStart.getDate() - 7);

        const thisMon = thisMonStart.getTime();
        const lastMon = lastMonStart.getTime();

        // Count sessions completed last week; check for any session before last week
        let sessionsLastWeek = 0;
        let hasSessionBeforeLastWeek = false;
        for (const log of state.sessionHistory) {
          if (!log.completedAt) continue;
          const t = new Date(log.completedAt).getTime();
          if (t >= lastMon && t < thisMon) {
            sessionsLastWeek++;
          } else if (t < lastMon) {
            hasSessionBeforeLastWeek = true;
          }
        }

        // Guard 4: fresh account — don't penalise a user who has never trained before last week
        if (sessionsLastWeek === 0 && !hasSessionBeforeLastWeek) return;

        // Adjusted scheduled sessions for last week
        // Original schedule minus any Arnold-approved drops (Plan Realignment Option 2).
        // weeklyDrops is populated by the Plan Realignment dialog (not yet built — always 0 for now).
        const scheduledPerWeek = state.profile?.schedule?.daysPerWeek ?? 0;
        const lastWeekKey = getIsoWeekKey(lastMonStart);
        const drops = state.weeklyDrops[lastWeekKey] ?? 0;
        const adjustedScheduled = Math.max(0, scheduledPerWeek - drops);

        // Mark this week as evaluated (do this before the early return so we
        // don't re-evaluate if the mesocycle isn't set yet)
        set({ lastStreakCheckWeek: currentWeekKey });

        if (adjustedScheduled === 0) {
          // No active mesocycle or schedule not set — can't evaluate, skip quietly
          return;
        }

        if (sessionsLastWeek >= adjustedScheduled) {
          // ✅ Hit 100%+ of adjusted schedule — increment week streak
          const newWeekly = state.streaks.currentWeekly + 1;
          set({
            streaks: {
              ...state.streaks,
              currentWeekly: newWeekly,
              longestWeekly: Math.max(newWeekly, state.streaks.longestWeekly),
            },
          });
          console.log(`[ARNOLD] Week streak +1 → ${newWeekly} (${sessionsLastWeek}/${adjustedScheduled} sessions last week)`);
        } else {
          // ❌ Missed sessions — reset week streak
          set({
            streaks: {
              ...state.streaks,
              currentWeekly: 0,
            },
          });
          console.log(`[ARNOLD] Week streak reset (${sessionsLastWeek}/${adjustedScheduled} sessions last week)`);
        }
        bgSync(() => syncStreaks(get().streaks));
      },

      // ── History ─────────────────────────────────────────────────────────
      sessionHistory: [],
      addSessionLog: (log) =>
        set((s) => ({ sessionHistory: [...s.sessionHistory, log] })),
      setSessionHistory: (history) => set({ sessionHistory: history }),
      setStreaks: (streaks) => set({ streaks }),
      setOnboardingState: (onboarding) => set((s) => ({
        onboarding: { ...initialOnboarding, ...s.onboarding, ...(onboarding || {}) },
      })),

      // ── Adaptation Queue ───────────────────────────────────────────────
      adaptationQueue: createEmptyQueue(),
      lastAppliedAdjustments: [],
      setAdaptationQueue: (queue) => set({ adaptationQueue: queue }),
      clearAdaptationQueue: () => set({ adaptationQueue: createEmptyQueue() }),

      resetStore: () => {
        if (__DEV__) {
          console.log("[ARNOLD ACTIVESESSION] activeSession being set to null by resetStore. Stack:", new Error().stack);
        }
        set({
          profile: null,
          onboarding: initialOnboarding,
          activeMesocycle: null,
          userProgressions: [],
          activeSession: null,
          sessionHistory: [],
          streaks: initialStreaks,
          lastStreakCheckWeek: null,
          weeklyDrops: {},
          adaptationQueue: createEmptyQueue(),
          lastAppliedAdjustments: [],
        });
      },
      resetForAccountDeletion: () => {
        if (__DEV__) {
          console.log("[ARNOLD ACTIVESESSION] activeSession being set to null by resetForAccountDeletion. Stack:", new Error().stack);
        }
        set({
          profile: null,
          onboarding: initialOnboarding,
          activeMesocycle: null,
          userProgressions: [],
          activeSession: null,
          sessionHistory: [],
          streaks: initialStreaks,
          lastStreakCheckWeek: null,
          weeklyDrops: {},
          adaptationQueue: createEmptyQueue(),
          lastAppliedAdjustments: [],
        });
      },
    }),
    {
      name: "arnold-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        profile: state.profile,
        onboarding: state.onboarding,
        activeMesocycle: state.activeMesocycle,
        userProgressions: state.userProgressions,
        // MVP 1.16.3 — persist activeSession so a session in progress survives
        // a hard close + cold start. HomeScreen's 24h stale rule prevents an
        // abandoned session from offering Resume indefinitely; endSession
        // already clears activeSession to null on completion.
        activeSession: state.activeSession,
        streaks: state.streaks,
        lastStreakCheckWeek: state.lastStreakCheckWeek,
        weeklyDrops: state.weeklyDrops,
        v249MigrationShown: state.v249MigrationShown,
        sessionHistory: state.sessionHistory,
        adaptationQueue: state.adaptationQueue,
        lastAppliedAdjustments: state.lastAppliedAdjustments,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (__DEV__) {
          if (error) {
            console.log("[ARNOLD ACTIVESESSION] rehydration ERROR:", error);
          } else {
            console.log(
              "[ARNOLD ACTIVESESSION] rehydrated from disk. activeSession exists:",
              !!state?.activeSession,
              "completedSets count:",
              state?.activeSession?.completedSets?.length ?? "N/A",
            );
          }
        }
        // v2.4.7 (MVP 1.18) migration — runs in production. The diagnostic
        // [ARNOLD MIGRATE] log was dropped per MVP 1.18.1 cleanup; the field
        // is still backfilled the same way.
        if (state?.profile?.schedule && !state.profile.schedule.sessionTier) {
          state.profile.schedule.sessionTier = "recommended";
        }
      },
    }
  )
);
