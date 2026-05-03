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
  incrementStreak: () => void;
  /** Resets currentDaily/currentWeekly to 0 if previous Mon-Sun week was fully missed AND user has sessions before that week. Idempotent. */
  checkAndResetWeeklyStreak: () => void;
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

      logSet: (completedSet) =>
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
        }),

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
        set({
          profile: null,
          onboarding: initialOnboarding,
          activeMesocycle: null,
          userProgressions: [],
          activeSession: null,
          sessionHistory: [],
          streaks: initialStreaks,
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
        streaks: state.streaks,
        sessionHistory: state.sessionHistory,
        adaptationQueue: state.adaptationQueue,
        lastAppliedAdjustments: state.lastAppliedAdjustments,
      }),
    }
  )
);
