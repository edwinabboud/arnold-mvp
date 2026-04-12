// =============================================================================
// ARNOLD — Global Store (Zustand)
// =============================================================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Mesocycle,
  PainReport,
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
  setStreaks: (streaks: StreakData) => void;

  // Session history
  sessionHistory: SessionLog[];
  addSessionLog: (log: SessionLog) => void;
  setSessionHistory: (history: SessionLog[]) => void;

  // Onboarding (hydration only)
  setOnboardingState: (state: OnboardingState) => void;

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

      startSession: (planned, warmUp) =>
        set({
          activeSession: {
            plannedSession: planned,
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
        }),

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
        const session = get().activeSession;
        if (session) {
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

              const adaptationResult = processSessionForAdaptation(
                latestLog,
                state.sessionHistory.slice(0, -1),
                state.activeMesocycle,
                state.userProgressions
              );

              console.log("[ARNOLD] Silent adaptation:", adaptationResult.internalLog);

              if (adaptationResult.decisions.length > 0) {
                const { updatedMesocycle, updatedProgressions, changesApplied } =
                  applyAdaptationDecisions(adaptationResult, state.activeMesocycle, state.userProgressions);

                set({
                  activeMesocycle: updatedMesocycle,
                  userProgressions: updatedProgressions,
                });

                console.log("[ARNOLD] Adaptation applied:", changesApplied);
              } else {
                console.log("[ARNOLD] No adaptation decisions this session.");
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

      // ── History ─────────────────────────────────────────────────────────
      sessionHistory: [],
      addSessionLog: (log) =>
        set((s) => ({ sessionHistory: [...s.sessionHistory, log] })),
      setSessionHistory: (history) => set({ sessionHistory: history }),
      setStreaks: (streaks) => set({ streaks }),
      setOnboardingState: (onboarding) => set((s) => ({
        onboarding: { ...initialOnboarding, ...s.onboarding, ...(onboarding || {}) },
      })),

      resetStore: () => {
        set({
          profile: null,
          onboarding: initialOnboarding,
          activeMesocycle: null,
          userProgressions: [],
          activeSession: null,
          sessionHistory: [],
          streaks: initialStreaks,
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
      }),
    }
  )
);
