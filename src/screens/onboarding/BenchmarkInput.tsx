// =============================================================================
// ARNOLD — Benchmark Input Component
// Two-branch flow: "I'm new" (immediate) or "I know my numbers" (question steps)
// =============================================================================

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { colors } from "../../theme";
import type { UserBenchmarks, FrontLeverLevel, PlancheLevel } from "../../types";

// ── Props ───────────────────────────────────────────────────────────────────

interface BenchmarkInputProps {
  programPath: "street_lifter" | "skill_builder" | "hybrid_athlete";
  onComplete: (result: {
    experienceLevel: "new" | "experienced";
    benchmarks: UserBenchmarks;
  }) => void;
  onBack?: () => void;
}

// ── NumberField Sub-Component ───────────────────────────────────────────────

interface NumberFieldProps {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  maxValue?: number;
  allowDecimal?: boolean;
  suffix?: string;
}

function NumberField({
  label,
  value,
  onChangeText,
  placeholder = "",
  maxValue,
  allowDecimal = true,
  suffix,
}: NumberFieldProps) {
  const [focused, setFocused] = useState(false);

  const handleChange = (raw: string) => {
    let cleaned = raw.replace(",", ".");
    if (allowDecimal) {
      cleaned = cleaned.replace(/[^0-9.]/g, "");
      const parts = cleaned.split(".");
      if (parts.length > 2) {
        cleaned = parts[0] + "." + parts.slice(1).join("");
      }
      if (parts[1]?.length > 1) {
        cleaned = parts[0] + "." + parts[1].slice(0, 1);
      }
    } else {
      cleaned = cleaned.replace(/[^0-9]/g, "");
    }
    if (cleaned.length > 1 && cleaned.startsWith("0") && !cleaned.startsWith("0.")) {
      cleaned = cleaned.replace(/^0+/, "");
    }
    if (maxValue !== undefined && cleaned !== "" && cleaned !== ".") {
      const num = parseFloat(cleaned);
      if (!isNaN(num) && num > maxValue) {
        return; // reject keystroke — keeps previous valid value
      }
    }
    onChangeText(cleaned);
  };

  return (
    <View style={nf.container}>
      {label ? <Text style={nf.label}>{label}</Text> : null}
      <View style={nf.inputRow}>
        <TextInput
          style={[nf.input, focused && nf.inputFocused]}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          keyboardType={allowDecimal ? "decimal-pad" : "number-pad"}
          returnKeyType="done"
          maxLength={allowDecimal ? 6 : 3}
          autoCorrect={false}
          autoCapitalize="none"
          blurOnSubmit={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {suffix ? <Text style={nf.suffix}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

const nf = StyleSheet.create({
  container: {
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.12)",
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    padding: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "rgba(255,255,255,0.015)",
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  inputFocused: {
    borderColor: `${colors.accent}40`,
  },
  suffix: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.25)",
    minWidth: 24,
  },
});

// ── Question Definitions ────────────────────────────────────────────────────

type QuestionType = "reps_weight" | "seconds" | "seconds_toggle" | "level_select" | "number";

interface Question {
  id: string;
  title: string;
  subtitle?: string;
  type: QuestionType;
  repsLabel?: string;
  repsMax?: number;
  weightLabel?: string;
  weightMax?: number;
  unit?: string;
  min?: number;
  max?: number;
  toggleLabel?: string;
  levels?: Array<{ id: string; label: string }>;
}

const STREET_LIFTER_QUESTIONS: Question[] = [
  {
    id: "pullups",
    title: "What's your best set of pull-ups?",
    subtitle: "Strict pull-ups, full range of motion",
    type: "reps_weight",
    repsLabel: "Reps",
    repsMax: 50,
    weightLabel: "Added weight",
    weightMax: 150,
  },
  {
    id: "dips",
    title: "What's your best set of dips?",
    subtitle: "Parallel bar dips, full depth",
    type: "reps_weight",
    repsLabel: "Reps",
    repsMax: 50,
    weightLabel: "Added weight",
    weightMax: 150,
  },
  {
    id: "squat",
    title: "What's your best set of squats?",
    subtitle: "Bodyweight or weighted squats, below parallel",
    type: "reps_weight",
    repsLabel: "Reps",
    repsMax: 50,
    weightLabel: "Added weight",
    weightMax: 150,
  },
];

const SKILL_BUILDER_QUESTIONS: Question[] = [
  {
    id: "handstand",
    title: "Longest free handstand hold?",
    subtitle: "Freestanding or wall-supported",
    type: "seconds_toggle",
    unit: "sec",
    min: 0,
    max: 300,
    toggleLabel: "Wall only",
  },
  {
    id: "frontLever",
    title: "Front lever progression?",
    subtitle: "Pick the hardest variation you can hold 3+ seconds",
    type: "level_select",
    levels: [
      { id: "none", label: "Can't yet" },
      { id: "tuck", label: "Tuck" },
      { id: "adv_tuck", label: "Advanced tuck" },
      { id: "straddle", label: "Straddle" },
      { id: "full", label: "Full" },
    ],
  },
  {
    id: "lsit",
    title: "Longest L-sit hold?",
    subtitle: "On the floor or parallettes",
    type: "number",
    unit: "sec",
    min: 0,
    max: 300,
  },
  {
    id: "planche",
    title: "Planche progression?",
    subtitle: "Pick the hardest variation you can hold 3+ seconds",
    type: "level_select",
    levels: [
      { id: "none", label: "Can't yet" },
      { id: "lean", label: "Planche lean" },
      { id: "tuck", label: "Tuck" },
      { id: "adv_tuck", label: "Advanced tuck" },
      { id: "straddle", label: "Straddle" },
      { id: "full", label: "Full" },
    ],
  },
];

const HYBRID_QUESTIONS: Question[] = [
  STREET_LIFTER_QUESTIONS[0], // pullups
  STREET_LIFTER_QUESTIONS[1], // dips
  SKILL_BUILDER_QUESTIONS[0], // handstand
  SKILL_BUILDER_QUESTIONS[1], // frontLever
];

const QUESTIONS_BY_PATH: Record<string, Question[]> = {
  street_lifter: STREET_LIFTER_QUESTIONS,
  skill_builder: SKILL_BUILDER_QUESTIONS,
  hybrid_athlete: HYBRID_QUESTIONS,
};

// ── Helpers ─────────────────────────────────────────────────────────────────

const parseNum = (s: string): number | undefined => {
  if (s.trim() === "") return undefined;
  const n = parseFloat(s);
  return isNaN(n) ? undefined : n;
};

const isValidNumber = (s: string): boolean => {
  if (s.trim() === "") return false;
  const n = parseFloat(s);
  return !isNaN(n) && n >= 0;
};

// ── Component ───────────────────────────────────────────────────────────────

export default function BenchmarkInput({ programPath, onComplete, onBack }: BenchmarkInputProps) {
  const [step, setStep] = useState<"filter" | number>("filter");

  // All numeric state is string — parsed only on final submit
  const [repsValues, setRepsValues] = useState<Record<string, string>>({});
  const [weightValues, setWeightValues] = useState<Record<string, string>>({});
  const [numberValues, setNumberValues] = useState<Record<string, string>>({});
  const [toggleValues, setToggleValues] = useState<Record<string, boolean>>({});
  const [levelValues, setLevelValues] = useState<Record<string, string>>({});

  const questions = QUESTIONS_BY_PATH[programPath] || HYBRID_QUESTIONS;
  const currentQuestion = typeof step === "number" ? questions[step] : null;
  const totalQuestions = questions.length;

  const isCurrentValid = (): boolean => {
    if (!currentQuestion) return false;
    const q = currentQuestion;
    switch (q.type) {
      case "reps_weight":
        return isValidNumber(repsValues[q.id] || "");
      case "seconds":
      case "seconds_toggle":
      case "number":
        return isValidNumber(numberValues[q.id] || "");
      case "level_select":
        return !!levelValues[q.id];
      default:
        return false;
    }
  };

  const advance = () => {
    if (typeof step === "number" && step < totalQuestions - 1) {
      setStep(step + 1);
    } else {
      finishExperienced();
    }
  };

  const goBackStep = () => {
    if (typeof step === "number") {
      if (step === 0) {
        setStep("filter");
      } else {
        setStep(step - 1);
      }
    } else {
      onBack?.();
    }
  };

  const handleCantDoThis = () => {
    if (!currentQuestion) return;
    const q = currentQuestion;
    switch (q.type) {
      case "reps_weight":
        setRepsValues(v => ({ ...v, [q.id]: "0" }));
        setWeightValues(v => ({ ...v, [q.id]: "0" }));
        break;
      case "seconds":
      case "seconds_toggle":
      case "number":
        setNumberValues(v => ({ ...v, [q.id]: "0" }));
        break;
      case "level_select":
        setLevelValues(v => ({ ...v, [q.id]: "none" }));
        break;
    }
    advance();
  };

  const handleSkip = () => {
    advance();
  };

  // ── Build benchmarks from collected string data ─────────────────────────

  const finishExperienced = () => {
    const benchmarks: UserBenchmarks = {
      collectedAt: new Date().toISOString(),
      source: "onboarding",
    };

    if (repsValues["pullups"] !== undefined && repsValues["pullups"] !== "") {
      benchmarks.pullUpMaxReps = parseNum(repsValues["pullups"]);
      benchmarks.pullUpAddedKg = parseNum(weightValues["pullups"] || "") ?? 0;
    }
    if (repsValues["dips"] !== undefined && repsValues["dips"] !== "") {
      benchmarks.dipMaxReps = parseNum(repsValues["dips"]);
      benchmarks.dipAddedKg = parseNum(weightValues["dips"] || "") ?? 0;
    }
    if (repsValues["squat"] !== undefined && repsValues["squat"] !== "") {
      benchmarks.squatMaxReps = parseNum(repsValues["squat"]);
      benchmarks.squatAddedKg = parseNum(weightValues["squat"] || "") ?? 0;
    }
    if (numberValues["handstand"] !== undefined && numberValues["handstand"] !== "") {
      benchmarks.handstandHoldSec = parseNum(numberValues["handstand"]);
      benchmarks.handstandWallOnly = !!toggleValues["handstand"];
    }
    if (levelValues["frontLever"]) {
      benchmarks.frontLeverLevel = levelValues["frontLever"] as FrontLeverLevel;
    }
    if (numberValues["lsit"] !== undefined && numberValues["lsit"] !== "") {
      benchmarks.lSitHoldSec = parseNum(numberValues["lsit"]);
    }
    if (levelValues["planche"]) {
      benchmarks.plancheLevel = levelValues["planche"] as PlancheLevel;
    }

    onComplete({ experienceLevel: "experienced", benchmarks });
  };

  // ── Render: Filter Step ─────────────────────────────────────────────────

  if (step === "filter") {
    return (
      <View style={s.container}>
        {onBack && (
          <TouchableOpacity style={s.backBtn} onPress={onBack}>
            <Text style={s.backBtnText}>←</Text>
          </TouchableOpacity>
        )}

        <View style={s.filterContent}>
          <Text style={s.filterTitle}>Where are you starting from?</Text>

          <TouchableOpacity
            style={s.branchCard}
            onPress={() => {
              onComplete({
                experienceLevel: "new",
                benchmarks: {
                  collectedAt: new Date().toISOString(),
                  source: "onboarding",
                },
              });
            }}
            activeOpacity={0.7}
          >
            <Text style={s.branchLabel}>I'm new to calisthenics</Text>
            <Text style={s.branchSub}>
              Arnold will start you at the foundation and adapt from session 1.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.branchCard}
            onPress={() => setStep(0)}
            activeOpacity={0.7}
          >
            <Text style={s.branchLabel}>I know my numbers</Text>
            <Text style={s.branchSub}>
              Tell Arnold your current level for a tailored program.
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Render: Question Step ───────────────────────────────────────────────

  if (!currentQuestion) return null;
  const q = currentQuestion;
  const questionIdx = step as number;

  return (
    <View style={s.container}>
      <TouchableOpacity style={s.backBtn} onPress={goBackStep}>
        <Text style={s.backBtnText}>←</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
        <Text style={s.skipBtnText}>Skip</Text>
      </TouchableOpacity>

      <View style={s.progressRow}>
        {questions.map((_, i) => (
          <View
            key={i}
            style={[
              s.progressDot,
              {
                width: i === questionIdx ? 16 : 5,
                backgroundColor: i <= questionIdx ? colors.accent : "rgba(255,255,255,0.05)",
              },
            ]}
          />
        ))}
      </View>

      <Text style={s.title}>{q.title}</Text>
      {q.subtitle && <Text style={s.subtitle}>{q.subtitle}</Text>}

      <ScrollView style={s.inputArea} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {q.type === "reps_weight" && (
          <View style={s.repsWeightRow}>
            <NumberField
              label={q.repsLabel || "REPS"}
              value={repsValues[q.id] || ""}
              onChangeText={(v) => setRepsValues(prev => ({ ...prev, [q.id]: v }))}
              maxValue={q.repsMax || 50}
              allowDecimal={false}
            />
            <NumberField
              label={q.weightLabel || "Added weight"}
              value={weightValues[q.id] || ""}
              onChangeText={(v) => setWeightValues(prev => ({ ...prev, [q.id]: v }))}
              maxValue={q.weightMax || 150}
              allowDecimal={true}
              suffix="kg"
            />
          </View>
        )}

        {q.type === "number" && (
          <View style={s.singleNumberRow}>
            <NumberField
              label=""
              value={numberValues[q.id] || ""}
              onChangeText={(v) => setNumberValues(prev => ({ ...prev, [q.id]: v }))}
              maxValue={q.max}
              allowDecimal={true}
              suffix={q.unit}
            />
          </View>
        )}

        {(q.type === "seconds" || q.type === "seconds_toggle") && (
          <View style={s.singleNumberRow}>
            <NumberField
              label=""
              value={numberValues[q.id] || ""}
              onChangeText={(v) => setNumberValues(prev => ({ ...prev, [q.id]: v }))}
              maxValue={q.max}
              allowDecimal={false}
              suffix={q.unit || "sec"}
            />
          </View>
        )}

        {q.type === "seconds_toggle" && q.toggleLabel && (
          <TouchableOpacity
            style={[s.toggleBtn, toggleValues[q.id] && s.toggleBtnActive]}
            onPress={() => setToggleValues(prev => ({ ...prev, [q.id]: !prev[q.id] }))}
            activeOpacity={0.7}
          >
            <Text style={[s.toggleBtnText, toggleValues[q.id] && s.toggleBtnTextActive]}>
              {q.toggleLabel}
            </Text>
          </TouchableOpacity>
        )}

        {q.type === "level_select" && q.levels && (
          <View style={s.levelList}>
            {q.levels.map((level) => {
              const isSelected = levelValues[q.id] === level.id;
              return (
                <TouchableOpacity
                  key={level.id}
                  style={[s.levelCard, isSelected && s.levelCardSelected]}
                  onPress={() => setLevelValues(v => ({ ...v, [q.id]: level.id }))}
                  activeOpacity={0.7}
                >
                  <Text style={[s.levelText, isSelected && s.levelTextSelected]}>
                    {level.label}
                  </Text>
                  {isSelected && (
                    <View style={s.levelCheck}>
                      <Text style={s.levelCheckText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={s.cantDoBtn} onPress={handleCantDoThis}>
        <Text style={s.cantDoText}>Can't do this yet</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[s.primaryBtn, !isCurrentValid() && s.primaryBtnDisabled]}
        onPress={advance}
        disabled={!isCurrentValid()}
      >
        <Text style={[s.primaryBtnText, !isCurrentValid() && s.primaryBtnTextDisabled]}>
          {questionIdx === totalQuestions - 1 ? "Create my program" : "Continue"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: 44,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    position: "absolute",
    top: 14,
    left: 14,
    width: 30,
    height: 30,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  backBtnText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 16,
    fontWeight: "600",
  },
  skipBtn: {
    position: "absolute",
    top: 18,
    right: 20,
    zIndex: 5,
  },
  skipBtnText: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 13,
    fontWeight: "600",
  },
  progressRow: {
    flexDirection: "row",
    gap: 4,
    justifyContent: "center",
    marginBottom: 20,
  },
  progressDot: {
    height: 5,
    borderRadius: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    marginBottom: 24,
  },
  filterContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  filterTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: 32,
  },
  branchCard: {
    padding: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(255,255,255,0.02)",
    marginBottom: 12,
  },
  branchLabel: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  branchSub: {
    fontSize: 13,
    color: "rgba(255,255,255,0.35)",
    lineHeight: 19,
  },
  inputArea: {
    flex: 1,
    marginBottom: 12,
  },
  repsWeightRow: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  singleNumberRow: {
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 40,
    marginTop: 24,
  },
  toggleBtn: {
    alignSelf: "center",
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  toggleBtnActive: {
    borderColor: `${colors.accent}80`,
    backgroundColor: `${colors.accent}15`,
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
  },
  toggleBtnTextActive: {
    color: colors.accent,
  },
  levelList: {
    gap: 8,
    marginTop: 8,
  },
  levelCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.04)",
    backgroundColor: "rgba(255,255,255,0.015)",
  },
  levelCardSelected: {
    borderColor: `${colors.accent}40`,
    backgroundColor: `${colors.accent}08`,
  },
  levelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
  },
  levelTextSelected: {
    color: colors.text,
  },
  levelCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  levelCheckText: {
    color: colors.bg,
    fontSize: 12,
    fontWeight: "700",
  },
  cantDoBtn: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  cantDoText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.2)",
    fontWeight: "500",
  },
  primaryBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.bg,
    letterSpacing: -0.3,
  },
  primaryBtnTextDisabled: {
    color: "rgba(255,255,255,0.12)",
  },
});
