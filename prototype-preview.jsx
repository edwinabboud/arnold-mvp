import { useState, useEffect, useRef } from "react";

// ── AI Config (for demo testing) ────────────────────────────────────────────
const DEMO_API_KEY = ''; // Paste your Anthropic key here for live testing
const DEMO_AI_ENABLED = true;

const GOALS = [
  { id: "street_lifting", label: "Street Lifting", desc: "Weighted calisthenics — progressive overload", color: "#E63946", icon: "M6.5 6.5h-2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1zm13 0h-2a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1zM7.5 11h9v2h-9zM1 9v6h1.5V9zm21.5 0V15H24V9z", info: "Heavy calisthenics with added weight — weighted pull-ups, weighted dips, heavy muscle-ups. Programming uses progressive overload with dip belts and weighted vests. Structured like a strength program with periodized intensity waves and PR attempts." },
  { id: "endurance", label: "Endurance", desc: "High-rep circuits, AMRAP, conditioning", color: "#F77F00", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z", info: "High-rep sets, circuit-style work, minimal rest. Targets muscular endurance and cardiovascular conditioning through calisthenics. Includes timed sets, AMRAP rounds, and volume accumulation over time." },
  { id: "skill_acquisition", label: "Skill Acquisition", desc: "Muscle-ups, handstands, planche, levers", color: "#2A9D8F", icon: "M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z", info: "Focuses on unlocking specific movements — muscle-ups, handstands, planche, front lever, back lever. Programming is technique-heavy with dedicated skill practice blocks and supporting strength work." },
  { id: "mobility", label: "Mobility", desc: "Active mobility, stretching, movement quality", color: "#7C5CBF", icon: "M12 4a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm-1 2.5L7.5 9l1.4 1.4L11 8.3V13l-4.5 7.5 1.7 1L12 14l3.8 7.5 1.7-1L13 13V8.3l2.1 2.1L16.5 9z", info: "Active mobility work, stretching routines, and movement quality. Can be a standalone goal or layered into other goals as warm-up and cooldown protocols. Improves range of motion and reduces injury risk." },
];

const TARGETS_LIST = ["10 clean muscle-ups", "30s free handstand", "Full front lever", "20 strict pull-ups", "Full pistol squat", "50 push-ups unbroken"];
const SPLIT_OPTIONS = [{ id: "ppl", label: "Push / Pull / Legs", sub: "Best for 4–6 days" }, { id: "ul", label: "Upper / Lower", sub: "Best for 3–4 days" }, { id: "fb", label: "Full Body", sub: "Best for 2–3 days" }];
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const VOL_LABELS = ["Primary — ~60%", "Secondary — ~30%", "Tertiary — ~10%"];

// ── Progression Trees (from data/progressions.ts) ────────────────────────────
const PROG_TREES = {
  pull: [
    { id:"pull_01",name:"Australian Rows",sets:3,reps:12,iso:false,cues:["Straight body","Chest to bar"],muscles:"Lats, Rhomboids, Biceps" },
    { id:"pull_02",name:"Negative Pull-ups",sets:3,reps:8,iso:false,cues:["5-second descent","Full ROM"],muscles:"Lats, Biceps" },
    { id:"pull_03",name:"Band-Assisted Pull-ups",sets:3,reps:8,iso:false,cues:["Dead hang start","Chin over bar"],muscles:"Lats, Biceps, Forearms" },
    { id:"pull_04",name:"Full Pull-ups",sets:3,reps:8,iso:false,cues:["Dead hang start","Controlled descent"],muscles:"Lats, Biceps, Core" },
    { id:"pull_05",name:"Chest-to-Bar Pull-ups",sets:3,reps:6,iso:false,cues:["Pull higher","Touch chest to bar"],muscles:"Lats, Rhomboids, Biceps" },
    { id:"pull_06",name:"Archer Pull-ups",sets:3,reps:5,iso:false,cues:["One arm pulls","Full extension assist"],muscles:"Lats, Biceps, Core" },
    { id:"pull_07",name:"L-Sit Pull-ups",sets:3,reps:5,iso:false,cues:["Hold L-sit","No swinging"],muscles:"Lats, Core, Hip Flexors" },
    { id:"pull_08",name:"Weighted Pull-ups",sets:4,reps:5,iso:false,cues:["Add weight progressively","Same form"],muscles:"Lats, Biceps, Forearms" },
  ],
  push: [
    { id:"push_01",name:"Wall Push-ups",sets:3,reps:15,iso:false,cues:["Straight body","Elbows at 45°"],muscles:"Chest, Triceps" },
    { id:"push_02",name:"Incline Push-ups",sets:3,reps:12,iso:false,cues:["Lower surface gradually","Core tight"],muscles:"Chest, Triceps, Front Delts" },
    { id:"push_03",name:"Full Push-ups",sets:3,reps:10,iso:false,cues:["Chest to floor","Full lockout"],muscles:"Chest, Triceps, Shoulders" },
    { id:"push_04",name:"Diamond Push-ups",sets:3,reps:10,iso:false,cues:["Hands together","Elbows close"],muscles:"Triceps, Chest" },
    { id:"push_05",name:"Archer Push-ups",sets:3,reps:6,iso:false,cues:["One arm pushes","Full depth"],muscles:"Chest, Triceps, Shoulders" },
    { id:"push_06",name:"Pseudo Planche Push-ups",sets:3,reps:6,iso:false,cues:["Hands by hips","Lean forward"],muscles:"Chest, Front Delts, Triceps" },
    { id:"push_07",name:"Dips",sets:3,reps:8,iso:false,cues:["Shoulders below elbows","Forward lean"],muscles:"Chest, Triceps, Front Delts" },
    { id:"push_08",name:"Ring Dips",sets:3,reps:6,iso:false,cues:["Stabilize rings","Turn out at top"],muscles:"Chest, Triceps, Shoulders" },
  ],
  legs: [
    { id:"legs_01",name:"Bodyweight Squats",sets:3,reps:15,iso:false,cues:["Below parallel","Knees track toes"],muscles:"Quads, Glutes" },
    { id:"legs_02",name:"Split Squats",sets:3,reps:10,iso:false,cues:["Back knee to floor","Upright torso"],muscles:"Quads, Glutes, Hip Flexors" },
    { id:"legs_03",name:"Bulgarian Split Squats",sets:3,reps:8,iso:false,cues:["Rear foot elevated","Full depth"],muscles:"Quads, Glutes, Core" },
    { id:"legs_04",name:"Pistol Squat Negatives",sets:3,reps:5,iso:false,cues:["5-second descent","Leg extended"],muscles:"Quads, Glutes, Core" },
    { id:"legs_05",name:"Assisted Pistol Squats",sets:3,reps:5,iso:false,cues:["Hold support","Full range"],muscles:"Quads, Glutes, Core" },
    { id:"legs_06",name:"Full Pistol Squats",sets:3,reps:5,iso:false,cues:["No support","Full depth"],muscles:"Quads, Glutes, Core, Balance" },
  ],
  core: [
    { id:"core_01",name:"Dead Bugs",sets:3,reps:12,iso:false,cues:["Back pressed to floor","Opposite arm/leg"],muscles:"Core, Hip Flexors" },
    { id:"core_02",name:"Hollow Body Hold",sets:3,reps:30,iso:true,cues:["Lower back flat","Arms overhead"],muscles:"Core, Hip Flexors" },
    { id:"core_03",name:"Hanging Knee Raises",sets:3,reps:10,iso:false,cues:["No swinging","Curl pelvis up"],muscles:"Lower Abs, Hip Flexors" },
    { id:"core_04",name:"Hanging Leg Raises",sets:3,reps:8,iso:false,cues:["Straight legs","No momentum"],muscles:"Core, Hip Flexors, Lats" },
    { id:"core_05",name:"Toes to Bar",sets:3,reps:6,iso:false,cues:["Touch toes to bar","Controlled"],muscles:"Core, Lats, Hip Flexors" },
    { id:"core_06",name:"L-Sit",sets:3,reps:20,iso:true,cues:["Locked elbows","Depress shoulders"],muscles:"Core, Hip Flexors, Triceps" },
    { id:"core_07",name:"Dragon Flag Negatives",sets:3,reps:5,iso:false,cues:["Straight body","5-second descent"],muscles:"Full Core Chain" },
  ],
  skill: [
    { id:"skill_01",name:"Crow Pose",sets:3,reps:15,iso:true,cues:["Knees on triceps","Lean forward"],muscles:"Shoulders, Core, Wrists" },
    { id:"skill_02",name:"Frogstand",sets:3,reps:20,iso:true,cues:["Hands shoulder width","Hold balance"],muscles:"Shoulders, Core, Wrists" },
    { id:"skill_03",name:"Wall Handstand",sets:3,reps:30,iso:true,cues:["Chest to wall","Push through shoulders"],muscles:"Shoulders, Traps, Core" },
    { id:"skill_04",name:"Free Handstand",sets:5,reps:15,iso:true,cues:["Balance through fingers","Tight core"],muscles:"Shoulders, Core, Wrists" },
    { id:"skill_05",name:"Planche Lean",sets:3,reps:20,iso:true,cues:["Lean forward on hands","Straight arms"],muscles:"Front Delts, Core, Wrists" },
    { id:"skill_06",name:"Tuck Planche",sets:3,reps:10,iso:true,cues:["Tuck knees","Round upper back"],muscles:"Front Delts, Core, Chest" },
  ],
};

// ── Goal → Pattern mapping for volume distribution ──────────────────────────
const GOAL_TO_PATTERNS = {
  street_lifting: ["pull","push","legs"],
  skill_acquisition: ["skill","push","core"],
  endurance: ["pull","push","legs","core"],
  mobility: ["core","legs"],
};

// ── Session generator — produces real exercises from user config ─────────────
function generateSessionPlan(goalIds, rankedIds, splitId, entryPathId) {
  // Determine user's level on each tree based on entry path
  const levels = {};
  Object.keys(PROG_TREES).forEach(pattern => {
    if (entryPathId === "beginner") levels[pattern] = 0;
    else if (entryPathId === "self_report") levels[pattern] = 2; // mid-level guess
    else levels[pattern] = 1; // assessment places at 1, will adjust
  });

  // Figure out which patterns this session needs
  const splitPatterns = splitId === "ppl"
    ? [{ label: "Push Day A", patterns: ["push","skill"] }, { label: "Pull Day A", patterns: ["pull","core"] }, { label: "Leg Day", patterns: ["legs","core"] }]
    : splitId === "ul"
    ? [{ label: "Upper A", patterns: ["push","pull"] }, { label: "Lower + Core", patterns: ["legs","core"] }]
    : [{ label: "Full Body A", patterns: ["push","pull","legs","core","skill"] }];

  // Get volume multipliers from ranked goals
  const volMap = {};
  (rankedIds || goalIds || []).forEach((id, i) => {
    const patterns = GOAL_TO_PATTERNS[id] || [];
    patterns.forEach(p => {
      const rank = i + 1;
      const vol = rank === 1 ? 0.6 : rank === 2 ? 0.3 : 0.1;
      if (!volMap[p] || vol > volMap[p]) volMap[p] = vol;
    });
  });

  // Generate all sessions (one per split group)
  return splitPatterns.map(sp => {
    const mainExercises = [];
    sp.patterns.forEach(pattern => {
      const tree = PROG_TREES[pattern];
      if (!tree) return;
      const level = Math.min(levels[pattern] || 0, tree.length - 1);
      const prog = tree[level];
      const vol = volMap[pattern] || 0.15;

      // Main exercise
      mainExercises.push({
        id: prog.id + "_main",
        name: prog.name,
        sets: Math.max(2, Math.round(prog.sets * vol * 1.2)),
        reps: prog.reps,
        rest: 90,
        intent: "moderate",
        isHold: prog.iso,
        note: prog.cues[0],
        muscles: prog.muscles,
        cues: prog.cues,
        mistakes: [],
      });

      // Supporting exercise (one level below) for primary/secondary patterns
      if (vol >= 0.3 && level > 0) {
        const sup = tree[Math.max(0, level - 1)];
        mainExercises.push({
          id: sup.id + "_sup",
          name: sup.name,
          sets: Math.max(2, Math.round(sup.sets * vol)),
          reps: sup.iso ? sup.reps : sup.reps + 2,
          rest: 60,
          intent: "easy",
          isHold: sup.iso,
          note: sup.cues[0],
          muscles: sup.muscles,
          cues: sup.cues,
          mistakes: [],
        });
      }
    });
    return { label: sp.label, patterns: sp.patterns, exercises: mainExercises };
  });
}

// Generate warm-up based on session patterns
function generateSessionWarmUp(patterns) {
  const wu = [];
  wu.push({ id: "w_jj", name: "Jumping Jacks", sets: 1, reps: 30, rest: 0, intent: "easy", note: "General activation", isWarmup: true });
  wu.push({ id: "w_ac", name: "Arm Circles", sets: 1, reps: 20, rest: 0, intent: "easy", note: "10 forward, 10 backward", isWarmup: true });
  if (patterns.includes("push")) {
    wu.push({ id: "w_sd", name: "Shoulder Dislocates", sets: 1, reps: 15, rest: 0, intent: "easy", note: "Band or towel, wide grip, slow", isWarmup: true });
    wu.push({ id: "w_sp", name: "Scapular Push-ups", sets: 2, reps: 10, rest: 0, intent: "easy", note: "Protract and retract at top", isWarmup: true });
  }
  if (patterns.includes("pull")) {
    wu.push({ id: "w_bp", name: "Band Pull-Aparts", sets: 2, reps: 15, rest: 0, intent: "easy", note: "Squeeze shoulder blades together", isWarmup: true });
    wu.push({ id: "w_dh", name: "Dead Hang", sets: 1, reps: 30, rest: 0, intent: "easy", note: "Decompress spine, relax", isWarmup: true, isHold: true });
  }
  if (patterns.includes("legs")) {
    wu.push({ id: "w_ls", name: "Leg Swings", sets: 1, reps: 20, rest: 0, intent: "easy", note: "10 each leg, front-to-back", isWarmup: true });
    wu.push({ id: "w_ds", name: "Deep Squat Hold", sets: 1, reps: 30, rest: 0, intent: "easy", note: "Hold at bottom, push knees out", isWarmup: true, isHold: true });
  }
  if (patterns.includes("skill") || patterns.includes("core")) {
    wu.push({ id: "w_wc", name: "Wrist Circles", sets: 1, reps: 10, rest: 0, intent: "easy", note: "Both directions + stretches", isWarmup: true });
  }
  return wu;
}

function generateSessionCooldown(patterns) {
  const cd = [];
  if (patterns.includes("push") || patterns.includes("pull")) {
    cd.push({ id: "c_cs", name: "Chest & Shoulder Stretch", sets: 1, reps: "30s each side", rest: 0, intent: "easy", note: "Doorway stretch", isStretch: true });
    cd.push({ id: "c_ls", name: "Lat Stretch", sets: 1, reps: "30s", rest: 0, intent: "easy", note: "Hang from bar, decompress", isStretch: true });
  }
  if (patterns.includes("legs")) {
    cd.push({ id: "c_hf", name: "Hip Flexor Stretch", sets: 1, reps: "30s each", rest: 0, intent: "easy", note: "Half-kneeling, hips forward", isStretch: true });
  }
  if (patterns.includes("core") || patterns.includes("skill")) {
    cd.push({ id: "c_cc", name: "Cat-Cow Stretch", sets: 1, reps: 10, rest: 0, intent: "easy", note: "Spine decompression", isStretch: true });
  }
  cd.push({ id: "c_ph", name: "Passive Hang", sets: 1, reps: "30s", rest: 0, intent: "easy", note: "Decompress spine, breathe", isStretch: true });
  return cd;
}

// ── These are now populated dynamically per session ──
let WARMUP_EXERCISES = [];
let WORKOUT_EXERCISES = [];
let STRETCH_EXERCISES = [];
let ALL_SESSION_EXERCISES = [];
let CURRENT_SESSION_LABEL = "Push Day A";

const INTENT_COLORS = { challenging: "#E63946", moderate: "#F5A623", easy: "#34C759" };
const PHASE_COLORS = { assessment: "#64D2FF", base_building: "#2A9D8F", strength: "#F5A623", intensity: "#E63946", deload: "#7C5CBF", peaking: "#F77F00" };
const PHASE_NAMES = { assessment: "Assessment", base_building: "Base Building", strength: "Strength", intensity: "Intensity", deload: "Deload", peaking: "Peaking" };
const CLR = { bg: "#0A0A0B", card: "#111113", accent: "#F5A623", text: "#F5F5F7", t2: "#8E8E93", t3: "#5A5A5E" };

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function formatDate(date) { const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]; return `${months[date.getMonth()]} ${date.getDate()}`; }

function generateMesocycle(daysPerWeek, splitType, preferredDays) {
  const phaseList = [{ phase: "assessment", weeks: 1 }, { phase: "base_building", weeks: 3 }, { phase: "strength", weeks: 3 }, { phase: "intensity", weeks: 2 }, { phase: "deload", weeks: 1 }, { phase: "peaking", weeks: 2 }, { phase: "deload", weeks: 1 }];
  const typeMap = splitType === "ppl" ? ["Push","Pull","Legs","Push","Pull","Legs"] : splitType === "ul" ? ["Upper","Lower","Upper","Lower"] : ["Full Body","Full Body","Full Body","Full Body"];
  const trainingDayIndices = (preferredDays && preferredDays.length > 0) ? preferredDays.sort((a,b) => a - b) : [1, 2, 3, 5]; // default Mon,Tue,Wed,Fri
  const result = [];
  let weekCount = 0;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - startDate.getDay()); // align to Sunday
  const dayNames = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dayShort = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  for (const phaseItem of phaseList) {
    for (let w = 0; w < phaseItem.weeks; w++) {
      weekCount++;
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (weekCount - 1) * 7);

      // Build a 7-day grid for this week
      const calendarDays = [];
      let sessionCounter = 0;
      for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + dayOfWeek);
        const isTrainingDay = trainingDayIndices.includes(dayOfWeek);

        if (isTrainingDay && sessionCounter < daysPerWeek) {
          const sessionType = typeMap[sessionCounter % typeMap.length];
          const exerciseList = phaseItem.phase === "assessment"
            ? [{ name: `Baseline: ${sessionType} patterns`, sets: 3, reps: "max", intent: "moderate" }]
            : sessionType === "Push"
            ? [{ name: "Pseudo Planche Push-ups", sets: 4, reps: 6, intent: "challenging" }, { name: "Ring Dips", sets: 3, reps: 8, intent: "moderate" }, { name: "Diamond Push-ups", sets: 3, reps: 12, intent: "easy" }, { name: "Wall Handstand", sets: 4, reps: "30s", intent: "challenging" }]
            : sessionType === "Pull"
            ? [{ name: "Full Pull-ups", sets: 4, reps: 8, intent: "moderate" }, { name: "Archer Pull-ups", sets: 3, reps: 5, intent: "challenging" }, { name: "Toes to Bar", sets: 3, reps: 8, intent: "moderate" }]
            : sessionType === "Legs"
            ? [{ name: "Bulgarian Split Squats", sets: 3, reps: 8, intent: "moderate" }, { name: "Pistol Squat Negatives", sets: 3, reps: 5, intent: "challenging" }, { name: "Shrimp Squats", sets: 3, reps: 5, intent: "challenging" }]
            : sessionType === "Upper"
            ? [{ name: "Pull-ups", sets: 4, reps: 8, intent: "moderate" }, { name: "Dips", sets: 3, reps: 8, intent: "moderate" }, { name: "Archer Push-ups", sets: 3, reps: 6, intent: "challenging" }]
            : sessionType === "Lower"
            ? [{ name: "Pistol Squats", sets: 3, reps: 5, intent: "challenging" }, { name: "Dragon Flags", sets: 3, reps: 5, intent: "challenging" }]
            : [{ name: "Pull-ups", sets: 3, reps: 8, intent: "moderate" }, { name: "Push-ups", sets: 3, reps: 12, intent: "easy" }, { name: "Squats", sets: 3, reps: 15, intent: "easy" }, { name: "Hollow Body Hold", sets: 3, reps: "45s", intent: "moderate" }];

          calendarDays.push({
            dayOfWeek,
            dayName: dayNames[dayOfWeek],
            dayShort: dayShort[dayOfWeek],
            date: dayDate,
            isTraining: true,
            isRest: false,
            session: {
              id: `ses_${weekCount}_${sessionCounter}`,
              label: `${sessionType} ${String.fromCharCode(65 + sessionCounter % 3)}`,
              type: sessionType,
              intent: phaseItem.phase === "deload" ? "easy" : phaseItem.phase === "intensity" || phaseItem.phase === "peaking" ? "challenging" : "moderate",
              exercises: exerciseList,
              isPR: phaseItem.phase === "peaking" && sessionCounter === 0 && w === phaseItem.weeks - 1,
              estimatedMinutes: exerciseList.length * 8 + 15,
            },
          });
          sessionCounter++;
        } else {
          calendarDays.push({
            dayOfWeek,
            dayName: dayNames[dayOfWeek],
            dayShort: dayShort[dayOfWeek],
            date: dayDate,
            isTraining: false,
            isRest: true,
            session: null,
          });
        }
      }

      result.push({ weekNum: weekCount, phase: phaseItem.phase, startDate: weekStart, calendarDays, isCurrentWeek: weekCount === 1 });
    }
  }
  return result;
}

function WaveformCanvas({ speaking, compact }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const ampRef = useRef(0);
  const canvasWidth = compact ? 200 : 340;
  const canvasHeight = compact ? 36 : 80;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    ctx.scale(dpr, dpr);
    let running = true;
    const colors = [[245,166,35],[230,126,34],[200,80,60],[245,190,80],[180,120,50]];
    const animate = () => {
      if (!running) return;
      frameRef.current++;
      const time = frameRef.current * 0.008;
      ampRef.current += ((speaking ? 1 : 0.18) - ampRef.current) * 0.04;
      const amplitude = ampRef.current;
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      const centerY = canvasHeight / 2;
      colors.forEach((col, waveIndex) => {
        const waveAmp = amplitude * (compact ? 6 + waveIndex * 3 : 14 + waveIndex * 5) * (speaking ? 1 + Math.sin(time * 2 + waveIndex) * 0.4 : 1);
        const freq = 0.012 + waveIndex * 0.003;
        const speed = time * (1.8 + waveIndex * 0.5);
        const phase = waveIndex * 1.2;
        const alpha = speaking ? 0.35 + amplitude * 0.25 - waveIndex * 0.04 : 0.06 + amplitude * 0.1;
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        for (let x = 0; x <= canvasWidth; x += 2) {
          const envelope = Math.sin(x / canvasWidth * Math.PI) ** 1.5;
          ctx.lineTo(x, centerY + Math.sin(x * freq + speed + phase) * waveAmp * envelope + Math.sin(x * freq * 2.3 + speed * 1.4 + phase) * waveAmp * 0.3 * envelope);
        }
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${alpha})`;
        ctx.lineWidth = speaking ? 2.2 - waveIndex * 0.2 : 1.5;
        ctx.lineCap = "round";
        ctx.stroke();
      });
      if (amplitude > 0.3) {
        const grd = ctx.createRadialGradient(canvasWidth / 2, centerY, 0, canvasWidth / 2, centerY, canvasWidth * 0.3);
        grd.addColorStop(0, `rgba(245,166,35,${(amplitude - 0.3) * 0.1})`);
        grd.addColorStop(1, "rgba(245,166,35,0)");
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      }
      requestAnimationFrame(animate);
    };
    animate();
    return () => { running = false; };
  }, [speaking, compact, canvasWidth, canvasHeight]);
  return <canvas ref={canvasRef} style={{ width: canvasWidth, height: canvasHeight, display: "block" }} />;
}

function GoalIcon({ path, color, size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={color}><path d={path} /></svg>;
}

export default function ArnoldApp() {
  const [screen, setScreen] = useState("onboarding");
  const [onboardStep, setOnboardStep] = useState(0);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [rankedGoals, setRankedGoals] = useState([]);
  const [trainingDays, setTrainingDays] = useState(4);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedSplit, setSelectedSplit] = useState(null);
  const [sessionDuration, setSessionDuration] = useState(60);
  const [selectedTargets, setSelectedTargets] = useState([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [expandedGoalInfo, setExpandedGoalInfo] = useState(null);
  const [userWeight, setUserWeight] = useState("");
  const [userHeight, setUserHeight] = useState("");
  const [useMetric, setUseMetric] = useState(true);
  const [entryPath, setEntryPath] = useState(null); // null | "assessment" | "self_report" | "beginner"

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [setIndex, setSetIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);
  const [restTimeTotal, setRestTimeTotal] = useState(0);
  const [arnoldMessage, setArnoldMessage] = useState("");
  const [completedSetCount, setCompletedSetCount] = useState(0);
  const [isSessionDone, setIsSessionDone] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([{ from: "arnold", text: "I'm here. Ask me anything." }]);
  const [chatInputText, setChatInputText] = useState("");
  const [detailExercise, setDetailExercise] = useState(null);
  const [focusedMode, setFocusedMode] = useState(false); // focused single-exercise training view
  const [streakCount, setStreakCount] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [mesocycleData, setMesocycleData] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);
  const [selectedCalendarDay, setSelectedCalendarDay] = useState(null);
  const [programZoomed, setProgramZoomed] = useState(false);
  const [sessionDayIndex, setSessionDayIndex] = useState(0); // which session in the split rotation
  const chatScrollRef = useRef(null);
  const restTimerRef = useRef(null);

  const goToStep = (nextStep) => { setAnimating(true); setTimeout(() => { setOnboardStep(nextStep); setAnimating(false); setIsSpeaking(true); setTimeout(() => setIsSpeaking(false), 1500); }, 200); };
  const arnoldSay = (text) => { setArnoldMessage(text); setIsSpeaking(true); setTimeout(() => setIsSpeaking(false), text.length * 30 + 500); };

  useEffect(() => {
    if (isResting && restTimeLeft > 0) { restTimerRef.current = setTimeout(() => setRestTimeLeft(prev => prev - 1), 1000); }
    else if (isResting && restTimeLeft === 0) { setIsResting(false); arnoldSay(`Set ${setIndex + 1}. Go.`); }
    return () => clearTimeout(restTimerRef.current);
  }, [isResting, restTimeLeft]);

  const currentExercise = ALL_SESSION_EXERCISES[exerciseIndex] || { sets: 1, reps: 1, rest: 0, name: "", isHold: false };
  const totalSetsInSession = ALL_SESSION_EXERCISES.length > 0 ? ALL_SESSION_EXERCISES.reduce((acc, ex) => acc + (ex.sets || 1), 0) : 1;

  const handleSetDone = () => {
    const isLastSet = setIndex >= currentExercise.sets - 1;
    const isLastExercise = exerciseIndex >= ALL_SESSION_EXERCISES.length - 1;
    setCompletedSetCount(prev => prev + 1);
    if (isLastSet && isLastExercise) { setIsSessionDone(true); arnoldSay("Session done. Good work."); setStreakCount(prev => prev + 1); setSessionCount(prev => prev + 1); return; }
    if (isLastSet) { arnoldSay(pickRandom(["Done. Moving on.", "Next exercise."])); setExerciseIndex(prev => prev + 1); setSetIndex(0); const nextEx = ALL_SESSION_EXERCISES[exerciseIndex + 1]; if (nextEx?.rest > 0) { setIsResting(true); setRestTimeTotal(nextEx.rest); setRestTimeLeft(nextEx.rest); } }
    else { const restSecs = currentExercise.rest || 0; if (restSecs > 0) { arnoldSay(setIndex === currentExercise.sets - 2 ? pickRandom(["Last set — make it count.", "Final set."]) : pickRandom(["Good. Rest up.", "Solid set.", "Locked in."])); setSetIndex(prev => prev + 1); setIsResting(true); setRestTimeTotal(restSecs); setRestTimeLeft(restSecs); } else { setSetIndex(prev => prev + 1); } }
  };

  const startNewSession = () => {
    // Generate real session from user's goals, split, and entry path
    const sessionPlan = generateSessionPlan(selectedGoals, rankedGoals, selectedSplit || "ppl", entryPath || "beginner");
    const dayIdx = sessionDayIndex % sessionPlan.length;
    const todaysSession = sessionPlan[dayIdx];

    // Set exercises for this session
    WARMUP_EXERCISES = generateSessionWarmUp(todaysSession.patterns);
    WORKOUT_EXERCISES = todaysSession.exercises;
    STRETCH_EXERCISES = generateSessionCooldown(todaysSession.patterns);
    ALL_SESSION_EXERCISES = [...WARMUP_EXERCISES, ...WORKOUT_EXERCISES, ...STRETCH_EXERCISES];
    CURRENT_SESSION_LABEL = todaysSession.label;

    setSessionDayIndex(prev => prev + 1);
    setScreen("session"); setExerciseIndex(0); setSetIndex(0); setCompletedSetCount(0); setIsSessionDone(false); setIsResting(false); setFocusedMode(false);
    arnoldSay(`${todaysSession.label}. Let's go.`);
    setChatMessages([{ from: "arnold", text: "Session loaded. Ask me anything." }]);
  };

  const sendChatMessage = async () => {
    if (!chatInputText.trim()) return;
    const userText = chatInputText.trim();
    setChatInputText("");
    setChatMessages(prev => [...prev, { from: "user", text: userText }]);

    if (DEMO_AI_ENABLED && DEMO_API_KEY) {
      // Real Claude API call
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": DEMO_API_KEY,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 300,
            system: "You are Arnold, a direct no-BS calisthenics coach. Respond in JSON format: {\"message\": \"your response\"}. Max 2 sentences. No emoji. No fake praise. No hedging.",
            messages: [{ role: "user", content: userText }],
          }),
        });
        const data = await res.json();
        const raw = data.content?.[0]?.text || "Got it.";
        let reply;
        try {
          const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
          reply = parsed.message || raw;
        } catch {
          reply = raw;
        }
        setChatMessages(prev => [...prev, { from: "arnold", text: reply }]);
      } catch {
        keywordFallback(userText);
      }
    } else {
      keywordFallback(userText);
    }

    setTimeout(() => chatScrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 100);
  };

  const keywordFallback = (userText) => {
    const lower = userText.toLowerCase();
    let reply = "Got it.";
    if (lower.includes("left")) reply = `${currentExercise.sets - setIndex} sets on ${currentExercise.name}.`;
    else if (lower.includes("swap")) reply = "I can step it back. Want me to?";
    else if (lower.includes("hurt") || lower.includes("pain")) reply = "Where? Shoulder, elbow, wrist, lower back, knee?";
    else if (lower.includes("easy")) reply = "Noted. Bumping next session.";
    setTimeout(() => {
      setChatMessages(prev => [...prev, { from: "arnold", text: reply }]);
      setTimeout(() => chatScrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" }), 50);
    }, 500);
  };

  const primaryBtn = (label, onClick) => <button onClick={onClick} style={{ padding: 14, borderRadius: 14, border: "none", background: CLR.accent, color: CLR.bg, fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%", letterSpacing: "-0.02em" }}>{label}</button>;
  const fadeStyle = animating ? { opacity: 0, transform: "translateY(8px)", transition: "all 0.3s ease" } : { opacity: 1, transform: "translateY(0)", transition: "all 0.3s ease" };
  const intentToRPE = (intent) => intent === "challenging" ? "RPE 8-10" : intent === "moderate" ? "RPE 6-7" : "RPE 4-5";

  const stepDots = <div style={{ display: "flex", gap: 4, justifyContent: "center", marginBottom: 20 }}>{[0,1,2,3,4,5,6,7,8,9].map(idx => <div key={idx} style={{ width: idx === onboardStep ? 16 : 5, height: 5, borderRadius: 3, background: idx <= onboardStep ? CLR.accent : "rgba(255,255,255,0.05)", transition: "all 0.3s" }} />)}</div>;
  const backButton = onboardStep > 0 && <button onClick={() => { if (onboardStep === 9 && entryPath) { setEntryPath(null); return; } if (onboardStep === 4 && selectedGoals.length === 1) goToStep(2); else goToStep(onboardStep - 1); }} style={{ position: "absolute", top: 14, left: 14, width: 30, height: 30, borderRadius: 9, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5 }}><svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M8.5 2.5L4 7L8.5 11.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>;

  // ── ONBOARDING ─────────────────────────────────────────────────────────────
  const renderOnboarding = () => {
    switch (onboardStep) {
      case 0: return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 32, ...fadeStyle }}>
          <WaveformCanvas speaking={isSpeaking} />
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 4, color: `${CLR.accent}60`, margin: "12px 0 6px" }}>ARNOLD</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: CLR.text, textAlign: "center", lineHeight: 1.35, marginBottom: 6 }}>Your AI calisthenics coach</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 1.6, maxWidth: 270, marginBottom: 32 }}>Adaptive training that adjusts every session based on how you perform.</div>
          {primaryBtn("Get started", () => goToStep(1))}
          {/* DEV ONLY — skip onboarding for testing */}
          <button onClick={() => {
            setSelectedGoals(["skill_acquisition", "street_lifting"]);
            setRankedGoals(["skill_acquisition", "street_lifting"]);
            setTrainingDays(4);
            setSelectedDays([1, 2, 4, 5]);
            setSelectedSplit("ppl");
            setSessionDuration(60);
            setMesocycleData(generateMesocycle(4, "ppl", [1, 2, 4, 5]));
            setScreen("home");
          }} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 8, border: "1px dashed rgba(255,255,255,0.1)", background: "none", color: "rgba(255,255,255,0.15)", fontSize: 11, cursor: "pointer" }}>Skip to app (dev)</button>
        </div>
      );
      case 1: return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "44px 20px 20px", ...fadeStyle }}>
          {backButton}{stepDots}
          <div style={{ fontSize: 20, fontWeight: 700, color: CLR.text, marginBottom: 4 }}>About you</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 24 }}>This helps Arnold calibrate your program.</div>

          {/* Unit toggle */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 3 }}>
              {["Metric", "Imperial"].map(unit => (
                <button key={unit} onClick={() => setUseMetric(unit === "Metric")} style={{
                  padding: "6px 20px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: (unit === "Metric" ? useMetric : !useMetric) ? `${CLR.accent}15` : "transparent",
                  color: (unit === "Metric" ? useMetric : !useMetric) ? CLR.accent : "rgba(255,255,255,0.25)",
                  transition: "all 0.2s",
                }}>{unit}</button>
              ))}
            </div>
          </div>

          {/* Weight input */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginBottom: 8 }}>WEIGHT</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="number"
                value={userWeight}
                onChange={ev => setUserWeight(ev.target.value)}
                placeholder={useMetric ? "75" : "165"}
                style={{ flex: 1, padding: "14px 16px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", color: CLR.text, fontSize: 18, fontWeight: 700, outline: "none", fontFamily: "inherit", textAlign: "center" }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.2)", width: 30 }}>{useMetric ? "kg" : "lbs"}</span>
            </div>
          </div>

          {/* Height input */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginBottom: 8 }}>HEIGHT</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input
                type="number"
                value={userHeight}
                onChange={ev => setUserHeight(ev.target.value)}
                placeholder={useMetric ? "178" : "70"}
                style={{ flex: 1, padding: "14px 16px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", color: CLR.text, fontSize: 18, fontWeight: 700, outline: "none", fontFamily: "inherit", textAlign: "center" }}
              />
              <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.2)", width: 30 }}>{useMetric ? "cm" : "in"}</span>
            </div>
          </div>

          <div style={{ flex: 1 }} />
          {userWeight && userHeight ? primaryBtn("Continue", () => goToStep(2)) : <button style={{ padding: 14, borderRadius: 14, border: "none", background: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.12)", fontSize: 15, fontWeight: 700, width: "100%", cursor: "default" }}>Enter weight and height</button>}
        </div>
      );
      case 2: return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "44px 20px 20px", ...fadeStyle }}>
          {backButton}{stepDots}
          <div style={{ fontSize: 20, fontWeight: 700, color: CLR.text, marginBottom: 4 }}>What are you training for?</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>Select one or combine multiple goals.</div>
          <div style={{ flex: 1, overflow: "auto" }}>
            {GOALS.map(goal => { const isSelected = selectedGoals.includes(goal.id); const isExpanded = expandedGoalInfo === goal.id; return (
              <div key={goal.id} style={{ marginBottom: 7 }}>
                <button onClick={() => setSelectedGoals(prev => prev.includes(goal.id) ? prev.filter(gId => gId !== goal.id) : [...prev, goal.id])} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", borderRadius: isExpanded ? "14px 14px 0 0" : 14, border: `1.5px solid ${isSelected ? goal.color + "45" : "rgba(255,255,255,0.04)"}`, borderBottom: isExpanded ? "none" : undefined, background: isSelected ? goal.color + "06" : "rgba(255,255,255,0.015)", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: isSelected ? goal.color + "10" : "rgba(255,255,255,0.025)", border: `1px solid ${isSelected ? goal.color + "18" : "rgba(255,255,255,0.03)"}`, display: "flex", alignItems: "center", justifyContent: "center" }}><GoalIcon path={goal.icon} color={isSelected ? goal.color : "rgba(255,255,255,0.25)"} /></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? goal.color : "rgba(255,255,255,0.75)" }}>{goal.label}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>{goal.desc}</div>
                  </div>
                  {isSelected && <div style={{ width: 18, height: 18, borderRadius: 9, background: goal.color, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div>}
                </button>
                {/* Info toggle */}
                <button onClick={(e) => { e.stopPropagation(); setExpandedGoalInfo(isExpanded ? null : goal.id); }} style={{ width: "100%", padding: "0 14px", cursor: "pointer", background: "none", border: "none", textAlign: "left" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 0" }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}><path d="M3 4.5L6 7.5L9 4.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.15)", fontWeight: 500 }}>{isExpanded ? "Less" : "What is this?"}</span>
                  </div>
                </button>
                {/* Expanded info */}
                {isExpanded && (
                  <div style={{ padding: "0 14px 12px", borderRadius: "0 0 14px 14px", border: `1.5px solid ${isSelected ? goal.color + "45" : "rgba(255,255,255,0.04)"}`, borderTop: "none", background: isSelected ? goal.color + "04" : "rgba(255,255,255,0.01)", marginTop: -1 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>{goal.info}</div>
                  </div>
                )}
              </div>
            ); })}
          </div>
          {selectedGoals.length > 0 && primaryBtn(selectedGoals.length > 1 ? `Rank ${selectedGoals.length} goals` : "Continue", () => { if (selectedGoals.length > 1) goToStep(3); else { setRankedGoals([selectedGoals[0]]); goToStep(4); } })}
        </div>
      );
      case 3: { const unrankedGoals = selectedGoals.filter(gId => !rankedGoals.includes(gId)); return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "44px 20px 20px", ...fadeStyle }}>
          {backButton}{stepDots}
          <div style={{ fontSize: 20, fontWeight: 700, color: CLR.text, marginBottom: 4 }}>Rank your priorities</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>Tap in order. Primary gets ~60% volume.</div>
          <div style={{ flex: 1 }}>
            {rankedGoals.map((goalId, rankIdx) => { const goalData = GOALS.find(g => g.id === goalId); return (
              <button key={goalId} onClick={() => setRankedGoals(rankedGoals.slice(0, rankIdx))} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 14px", borderRadius: 12, border: `1px solid ${goalData.color}30`, background: `${goalData.color}05`, marginBottom: 5, cursor: "pointer", textAlign: "left" }}>
                <span style={{ width: 24, height: 24, borderRadius: 12, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: rankIdx === 0 ? CLR.accent : "rgba(255,255,255,0.2)" }}>{rankIdx + 1}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{goalData.label}</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{VOL_LABELS[rankIdx]}</span>
              </button>); })}
            {unrankedGoals.length > 0 && <><div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.12)", letterSpacing: 2, margin: "12px 0 7px" }}>TAP TO RANK NEXT</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{unrankedGoals.map(goalId => { const goalData = GOALS.find(g => g.id === goalId); return <button key={goalId} onClick={() => setRankedGoals(prev => [...prev, goalId])} style={{ padding: "7px 13px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", cursor: "pointer", fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>{goalData.label}</button>; })}</div></>}
          </div>
          {rankedGoals.length === selectedGoals.length && primaryBtn("Continue", () => goToStep(4))}
        </div>); }
      case 4: return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "44px 20px 20px", ...fadeStyle }}>
          {backButton}{stepDots}
          <div style={{ fontSize: 20, fontWeight: 700, color: CLR.text, marginBottom: 4 }}>How often can you train?</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 24 }}>Days per week</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>{[2,3,4,5,6].map(num => (
            <button key={num} onClick={() => { setTrainingDays(num); setSelectedDays([]); goToStep(5); }} style={{ width: 52, height: 52, borderRadius: 13, border: "1.5px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>{num}</button>
          ))}</div>
        </div>
      );
      case 5: return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "44px 20px 20px", ...fadeStyle }}>
          {backButton}{stepDots}
          <div style={{ fontSize: 20, fontWeight: 700, color: CLR.text, marginBottom: 4 }}>Which days?</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 20 }}>Select {trainingDays} training days</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>{DAY_LABELS.map((dayLabel, dayIdx) => { const isChosen = selectedDays.includes(dayIdx); const isFull = !isChosen && selectedDays.length >= trainingDays; return (
            <button key={dayIdx} onClick={() => { if (isFull) return; setSelectedDays(prev => prev.includes(dayIdx) ? prev.filter(d => d !== dayIdx) : [...prev, dayIdx]); }} style={{ flex: 1, aspectRatio: "1", borderRadius: 12, border: `1.5px solid ${isChosen ? `${CLR.accent}40` : "rgba(255,255,255,0.03)"}`, background: isChosen ? `${CLR.accent}0A` : "rgba(255,255,255,0.01)", color: isChosen ? CLR.accent : isFull ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)", fontSize: 13, fontWeight: 600, cursor: isFull ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{dayLabel}</button>); })}</div>
          <div style={{ flex: 1 }} />
          {selectedDays.length === trainingDays && primaryBtn("Continue", () => goToStep(6))}
        </div>
      );
      case 6: return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "44px 20px 20px", ...fadeStyle }}>
          {backButton}{stepDots}
          <div style={{ fontSize: 20, fontWeight: 700, color: CLR.text, marginBottom: 4 }}>Training split</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 18 }}>How to structure your sessions</div>
          <div style={{ flex: 1 }}>{SPLIT_OPTIONS.map(splitOpt => (
            <button key={splitOpt.id} onClick={() => { setSelectedSplit(splitOpt.id); goToStep(7); }} style={{ width: "100%", padding: "13px 16px", borderRadius: 14, marginBottom: 7, textAlign: "left", border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", cursor: "pointer" }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{splitOpt.label}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>{splitOpt.sub}</div>
            </button>
          ))}</div>
        </div>
      );
      case 7: return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "44px 20px 20px", ...fadeStyle }}>
          {backButton}{stepDots}
          <div style={{ fontSize: 20, fontWeight: 700, color: CLR.text, marginBottom: 4 }}>Session length</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 24 }}>Minutes per session</div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>{[30,45,60,75,90].map(mins => (
            <button key={mins} onClick={() => { setSessionDuration(mins); goToStep(8); }} style={{ padding: "11px 17px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", cursor: "pointer", fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>{mins}m</button>
          ))}</div>
        </div>
      );
      case 8: return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "44px 20px 20px", ...fadeStyle }}>
          {backButton}{stepDots}
          <div style={{ fontSize: 20, fontWeight: 700, color: CLR.text, marginBottom: 4 }}>Set your targets</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>Optional — what do you want to achieve?</div>
          <div style={{ flex: 1, overflow: "auto" }}>
            {selectedTargets.map(targetText => <div key={targetText} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 10, marginBottom: 5, background: `${CLR.accent}06`, border: `1px solid ${CLR.accent}18` }}><span style={{ fontSize: 13, color: CLR.accent, fontWeight: 600 }}>{targetText}</span><button onClick={() => setSelectedTargets(prev => prev.filter(t => t !== targetText))} style={{ border: "none", background: "none", color: `${CLR.accent}40`, fontSize: 16, cursor: "pointer", padding: 4 }}>×</button></div>)}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{TARGETS_LIST.filter(t => !selectedTargets.includes(t)).map(targetText => <button key={targetText} onClick={() => setSelectedTargets(prev => [...prev, targetText])} style={{ padding: "6px 11px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)", fontSize: 12, color: "rgba(255,255,255,0.35)", cursor: "pointer" }}>+ {targetText}</button>)}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {selectedTargets.length > 0 && primaryBtn(`Continue with ${selectedTargets.length} target${selectedTargets.length > 1 ? "s" : ""}`, () => goToStep(9))}
            <button onClick={() => goToStep(9)} style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)", color: "rgba(255,255,255,0.25)", fontSize: 14, fontWeight: 600, cursor: "pointer", width: "100%" }}>{selectedTargets.length > 0 ? "Skip targets" : "No specific goal — just train me"}</button>
          </div>
        </div>
      );
      case 9: {
        const paths = [
          { id: "assessment", label: "Full Assessment", sub: "Recommended", desc: `${trainingDays} sessions of baseline testing. Arnold guides you through each exercise and calibrates your program from real data.`, badge: "Most accurate", color: CLR.accent, steps: [["1", "Test each movement pattern"], ["2", "Arnold asks how it felt"], ["3", "Program built from real data"]] },
          { id: "self_report", label: "I Know My Level", sub: "Experienced", desc: "Tell Arnold what you can do — reps, holds, exercises. He'll place you and the first few sessions will fine-tune if anything's off.", badge: "Quick start", color: "#2A9D8F", steps: null },
          { id: "beginner", label: "Complete Beginner", sub: "New to calisthenics", desc: "Start at the beginning of every progression. Your first sessions double as assessment — Arnold figures out your real level from your feedback.", badge: "Zero pressure", color: "#7C5CBF", steps: null },
        ];

        if (!entryPath) {
          // Path selection screen
          return (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "44px 20px 20px", ...fadeStyle }}>
              {backButton}{stepDots}
              <div style={{ fontSize: 20, fontWeight: 700, color: CLR.text, marginBottom: 4 }}>How should we start?</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 18 }}>Pick how Arnold builds your first program.</div>
              <div style={{ flex: 1, overflow: "auto" }}>
                {paths.map(p => (
                  <button key={p.id} onClick={() => setEntryPath(p.id)} style={{ width: "100%", padding: "14px 16px", borderRadius: 14, marginBottom: 8, textAlign: "left", border: `1px solid ${p.color}20`, background: `${p.color}04`, cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{p.label}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: p.color, background: `${p.color}15`, padding: "2px 7px", borderRadius: 5 }}>{p.badge}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        }

        // Path confirmation screen
        const selected = paths.find(p => p.id === entryPath);
        return (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: 32, ...fadeStyle }}>
            <WaveformCanvas speaking={isSpeaking} />
            <div style={{ fontSize: 20, fontWeight: 700, color: CLR.text, textAlign: "center", margin: "16px 0 6px" }}>
              {entryPath === "assessment" ? "Assessment week" : entryPath === "self_report" ? "Quick setup" : "Starting fresh"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", textAlign: "center", lineHeight: 1.6, maxWidth: 280, marginBottom: 24 }}>
              {entryPath === "assessment" && `${trainingDays} sessions to establish your baseline. Arnold tests each movement pattern, asks how it felt, and builds your program from real performance data.`}
              {entryPath === "self_report" && "Tell Arnold what exercises you can do and your rep counts. He'll place you on each progression tree. The first 2-3 sessions will auto-correct if anything's off."}
              {entryPath === "beginner" && "No test, no pressure. You'll start at the beginning of every movement. Arnold will figure out your real level from your feedback in the first few sessions."}
            </div>

            {entryPath === "assessment" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 270, marginBottom: 28 }}>
                {[["1", "Test each movement pattern"], ["2", "Arnold asks how it felt"], ["3", "Program built from real data"]].map(([num, text]) => (
                  <div key={num} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 13, border: `1.5px solid ${CLR.accent}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: `${CLR.accent}60`, flexShrink: 0 }}>{num}</div>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{text}</span>
                  </div>
                ))}
              </div>
            )}

            {entryPath === "self_report" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 270, marginBottom: 28 }}>
                {[["1", "Input your current abilities"], ["2", "Arnold places you on each tree"], ["3", "First sessions self-correct"]].map(([num, text]) => (
                  <div key={num} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 13, border: "1.5px solid #2A9D8F25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#2A9D8F60", flexShrink: 0 }}>{num}</div>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{text}</span>
                  </div>
                ))}
              </div>
            )}

            {entryPath === "beginner" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%", maxWidth: 270, marginBottom: 28 }}>
                {[["1", "Start at the beginning"], ["2", "First sessions = assessment"], ["3", "Arnold catches your real level"]].map(([num, text]) => (
                  <div key={num} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 26, height: 26, borderRadius: 13, border: "1.5px solid #7C5CBF25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#7C5CBF60", flexShrink: 0 }}>{num}</div>
                    <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{text}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", maxWidth: 280 }}>
              <button onClick={() => { setMesocycleData(generateMesocycle(trainingDays, selectedSplit || "ppl", selectedDays)); setScreen("home"); }} style={{ padding: "14px 48px", borderRadius: 14, border: "none", background: selected?.color || CLR.accent, color: CLR.bg, fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%", boxShadow: `0 0 30px ${selected?.color || CLR.accent}20` }}>
                {entryPath === "assessment" ? "Start assessment week" : entryPath === "self_report" ? "Set up my level" : "Start training"}
              </button>
              <button onClick={() => setEntryPath(null)} style={{ padding: 10, borderRadius: 12, border: "none", background: "none", color: "rgba(255,255,255,0.2)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>← Choose a different path</button>
            </div>
          </div>
        );
      }
      default: return null;
    }
  };

  // ── HOME ───────────────────────────────────────────────────────────────────
  const renderHome = () => {
    const splitLabel = SPLIT_OPTIONS.find(opt => opt.id === selectedSplit)?.label || "Push / Pull / Legs";
    return (
      <div style={{ padding: 18, overflow: "auto", height: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, color: CLR.t2, marginBottom: 2 }}>Ready to train</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: CLR.accent, letterSpacing: -1, marginBottom: 14 }}>Arnold</div>
          </div>
          <button onClick={() => setScreen("settings")} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", marginTop: 4 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/></svg>
          </button>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {[["Streak", streakCount], ["Sessions", sessionCount]].map(([label, value]) => (
            <div key={label} style={{ flex: 1, background: CLR.card, borderRadius: 11, padding: 13, border: "1px solid rgba(255,255,255,0.025)" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 0.5, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: CLR.accent }}>{value}</div>
            </div>
          ))}
        </div>
        <button onClick={startNewSession} style={{ width: "100%", background: CLR.card, borderRadius: 14, padding: 15, border: `1px solid ${CLR.accent}25`, cursor: "pointer", textAlign: "left", marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: CLR.accent, letterSpacing: 1, marginBottom: 3 }}>TODAY</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: CLR.text }}>{(() => { const sp = generateSessionPlan(selectedGoals, rankedGoals, selectedSplit || "ppl", entryPath || "beginner"); return sp[sessionDayIndex % sp.length]?.label || "Training"; })()}</div>
          <div style={{ fontSize: 12, color: CLR.t2, marginTop: 2 }}>~{sessionDuration} min · {splitLabel}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: CLR.accent, marginTop: 8 }}>Start Session →</div>
        </button>
        <button onClick={() => setScreen("program")} style={{ width: "100%", background: CLR.card, borderRadius: 11, padding: 13, border: "1px solid rgba(255,255,255,0.025)", cursor: "pointer", textAlign: "left", marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div><div style={{ fontSize: 13, fontWeight: 600, color: CLR.text }}>Your mesocycle</div><div style={{ fontSize: 11, color: CLR.t3, marginTop: 1 }}>{mesocycleData ? `${mesocycleData.length} weeks · ${PHASE_NAMES[mesocycleData[0]?.phase]}` : "View program"}</div></div>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M5.5 2.5L10 7L5.5 11.5" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {rankedGoals.length > 0 && <><div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginBottom: 5 }}>GOALS</div>
          {rankedGoals.map((goalId, idx) => { const goalData = GOALS.find(g => g.id === goalId); if (!goalData) return null; return <div key={goalId} style={{ display: "flex", alignItems: "center", gap: 10, background: CLR.card, borderRadius: 10, padding: 11, marginBottom: 4, borderLeft: `3px solid ${goalData.color}` }}><GoalIcon path={goalData.icon} color={goalData.color} size={13} /><div><div style={{ fontSize: 13, fontWeight: 600, color: CLR.text }}>{goalData.label}</div><div style={{ fontSize: 10, color: CLR.t2 }}>{VOL_LABELS[idx]}</div></div></div>; })}</>}
      </div>
    );
  };

  // ── SESSION ────────────────────────────────────────────────────────────────
  const renderSession = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header with goal type */}
      <div style={{ padding: "10px 14px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, color: `${CLR.accent}50`, letterSpacing: 2, marginBottom: 2 }}>{CURRENT_SESSION_LABEL.toUpperCase()}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: CLR.text }}>{GOALS.find(g => g.id === (rankedGoals[0] || selectedGoals[0]))?.label || "Training"}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: CLR.accent }}>{completedSetCount}<span style={{ fontSize: 12, fontWeight: 500, color: CLR.t3 }}>/{totalSetsInSession}</span></div>
            <div style={{ fontSize: 9, color: CLR.t3 }}>sets</div>
          </div>
        </div>
        <div style={{ height: 2, borderRadius: 1, background: "rgba(255,255,255,0.03)" }}><div style={{ height: 2, borderRadius: 1, background: CLR.accent, width: `${(completedSetCount / totalSetsInSession) * 100}%`, transition: "width 0.4s" }} /></div>
      </div>

      {/* Arnold waveform */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "5px 14px", borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
        <WaveformCanvas speaking={isSpeaking} compact />
        <div style={{ flex: 1 }}><div style={{ fontSize: 9, fontWeight: 700, color: `${CLR.accent}35`, letterSpacing: 2 }}>ARNOLD</div><div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>{arnoldMessage || "Let's go."}</div></div>
      </div>

      {/* Exercises */}
      <div style={{ flex: 1, overflow: "auto", padding: "7px 12px" }}>
        {isSessionDone ? (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: CLR.accent }}>Session Complete</div>
            <div style={{ fontSize: 13, color: CLR.t2, margin: "6px 0 18px" }}>{completedSetCount} sets</div>
            <button onClick={() => setScreen("home")} style={{ padding: "12px 36px", borderRadius: 14, border: "none", background: CLR.accent, color: CLR.bg, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Finish</button>
          </div>
        ) : <>
          {/* Warm-up */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, marginTop: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#34C759", letterSpacing: 2 }}>WARM-UP</div>
            {exerciseIndex < WARMUP_EXERCISES.length && <button onClick={() => { setExerciseIndex(WARMUP_EXERCISES.length); setSetIndex(0); arnoldSay("Skipping warm-up. Be careful."); }} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.2)", cursor: "pointer" }}>Skip</button>}
          </div>
          {WARMUP_EXERCISES.map((wuEx, wuIdx) => {
            const gi = wuIdx; const cur = gi === exerciseIndex; const done = gi < exerciseIndex;
            if (done) return <div key={wuEx.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", marginBottom: 1 }}><span style={{ color: "#34C759", fontSize: 9 }}>✓</span><span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", textDecoration: "line-through" }}>{wuEx.name}</span></div>;
            if (!cur) return <div key={wuEx.id} style={{ padding: "4px 10px", marginBottom: 1 }}><span style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}>{wuEx.name}</span></div>;
            return (
              <button key={wuEx.id} onClick={() => setDetailExercise(wuEx)} style={{ display: "block", width: "100%", padding: "14px", borderRadius: 14, marginBottom: 4, border: "1px solid #34C75925", background: "#34C75908", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{wuEx.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{wuEx.sets} × {wuEx.reps} reps</div>
                {wuEx.note && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 6, padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.015)", fontStyle: "italic" }}>{wuEx.note}</div>}
              </button>
            );
          })}

          {/* Main workout */}
          <div style={{ fontSize: 10, fontWeight: 700, color: CLR.accent, letterSpacing: 2, marginBottom: 4, marginTop: 12 }}>MAIN WORKOUT</div>
          {WORKOUT_EXERCISES.map((wEx, wIdx) => {
            const gi = WARMUP_EXERCISES.length + wIdx; const cur = gi === exerciseIndex; const done = gi < exerciseIndex; const fut = gi > exerciseIndex;

            // Collapsed done
            if (done) return (
              <div key={wEx.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", marginBottom: 1 }}>
                <span style={{ color: "#34C759", fontSize: 9 }}>✓</span>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", textDecoration: "line-through" }}>{wEx.name}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.08)", marginLeft: "auto" }}>{wEx.sets}×{wEx.reps}</span>
              </div>
            );

            // Collapsed future
            if (fut) return (
              <div key={wEx.id} style={{ padding: "5px 10px", marginBottom: 1 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}>{wEx.name}</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.08)", marginLeft: 8 }}>{wEx.sets}×{wEx.isHold ? `${wEx.reps}s` : wEx.reps}</span>
              </div>
            );

            // ── CURRENT EXERCISE — BIG CARD ──
            return (
              <button key={wEx.id} onClick={() => setFocusedMode(true)} style={{ display: "block", width: "100%", padding: "16px", borderRadius: 16, marginBottom: 6, border: `1.5px solid ${CLR.accent}22`, background: `${CLR.accent}05`, cursor: "pointer", textAlign: "left" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: CLR.text }}>{wEx.name}</div>
                  <div style={{ padding: "3px 10px", borderRadius: 8, fontSize: 10, fontWeight: 700, letterSpacing: 0.5, border: `1px solid ${INTENT_COLORS[wEx.intent]}22`, color: INTENT_COLORS[wEx.intent], background: `${INTENT_COLORS[wEx.intent]}08`, flexShrink: 0, marginLeft: 8 }}>{intentToRPE(wEx.intent)}</div>
                </div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>{wEx.sets} sets × {wEx.isHold ? `${wEx.reps}s hold` : `${wEx.reps} reps`} · {wEx.rest}s rest</div>

                {/* Set progress */}
                <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                  {Array.from({ length: wEx.sets }).map((_, sn) => (
                    <div key={sn} style={{ flex: 1, height: 5, borderRadius: 3, background: sn < setIndex ? CLR.accent : sn === setIndex ? `${CLR.accent}40` : "rgba(255,255,255,0.04)", transition: "background 0.3s" }} />
                  ))}
                </div>

                {/* Coaching note */}
                {wEx.note && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.22)", marginTop: 10, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.02)", fontStyle: "italic", lineHeight: 1.5 }}>{wEx.note}</div>}

                {/* Muscles */}
                {wEx.muscles && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 8 }}>{wEx.muscles}</div>}
              </button>
            );
          })}

          {/* Cooldown stretch */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4, marginTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#7C5CBF", letterSpacing: 2 }}>COOLDOWN STRETCH</div>
            {exerciseIndex >= WARMUP_EXERCISES.length + WORKOUT_EXERCISES.length && exerciseIndex < ALL_SESSION_EXERCISES.length && <button onClick={() => { setIsSessionDone(true); arnoldSay("Skipping stretch. Session done."); setStreakCount(prev => prev + 1); setSessionCount(prev => prev + 1); }} style={{ padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.2)", cursor: "pointer" }}>Skip</button>}
          </div>
          {STRETCH_EXERCISES.map((sEx, sIdx) => {
            const gi = WARMUP_EXERCISES.length + WORKOUT_EXERCISES.length + sIdx; const cur = gi === exerciseIndex; const done = gi < exerciseIndex;
            if (done) return <div key={sEx.id} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", marginBottom: 1 }}><span style={{ color: "#34C759", fontSize: 9 }}>✓</span><span style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", textDecoration: "line-through" }}>{sEx.name}</span></div>;
            if (!cur) return <div key={sEx.id} style={{ padding: "4px 10px", marginBottom: 1 }}><span style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}>{sEx.name}</span><span style={{ fontSize: 10, color: "rgba(255,255,255,0.08)", marginLeft: 8 }}>{sEx.reps}</span></div>;
            return (
              <button key={sEx.id} onClick={() => setDetailExercise(sEx)} style={{ display: "block", width: "100%", padding: "14px", borderRadius: 14, marginBottom: 4, border: "1px solid #7C5CBF22", background: "#7C5CBF06", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>{sEx.name}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{sEx.reps}</div>
                {sEx.note && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 6, padding: "5px 10px", borderRadius: 8, background: "rgba(255,255,255,0.015)", fontStyle: "italic" }}>{sEx.note}</div>}
              </button>
            );
          })}
        </>}
      </div>

      {/* Bottom controls */}
      {!isSessionDone && <div style={{ padding: "7px 12px 15px", borderTop: "1px solid rgba(255,255,255,0.025)" }}>
        {isResting ? <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 7 }}><div style={{ width: 44, height: 44, borderRadius: 22, border: `3px solid ${CLR.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: CLR.accent, fontVariantNumeric: "tabular-nums" }}>{Math.floor(restTimeLeft / 60)}:{(restTimeLeft % 60).toString().padStart(2, "0")}</div><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.45)" }}>Resting</div><div style={{ fontSize: 11, color: "rgba(255,255,255,0.18)" }}>Next: Set {setIndex + 1}/{currentExercise.sets}</div></div><button onClick={() => { setIsResting(false); setRestTimeLeft(0); arnoldSay("Skipped. Go."); }} style={{ padding: "5px 13px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.01)", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.2)", cursor: "pointer" }}>Skip</button></div>
        : <div style={{ fontSize: 11, color: "rgba(255,255,255,0.18)", textAlign: "center", marginBottom: 5 }}>Set {setIndex + 1}/{currentExercise.sets} · {currentExercise.isHold ? `${currentExercise.reps}s` : `${currentExercise.reps} reps`}</div>}
        <div style={{ display: "flex", gap: 7 }}>
          <button onClick={() => { setIsChatOpen(true); setChatMessages(prev => [...prev, { from: "arnold", text: "Something hurting? Tap where it hurts." }, { from: "system", text: "BODY_MAP" }]); }} style={{ width: 42, height: 42, borderRadius: 11, border: "1px solid rgba(255,69,58,0.12)", background: "rgba(255,69,58,0.03)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 28" fill="none"><circle cx="12" cy="4" r="3" stroke="#FF453A" strokeWidth="1.2"/><path d="M12 7v7m-4-5l4 2 4-2m-8 7l2 7m4-7l2 7" stroke="#FF453A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
          <button onClick={handleSetDone} disabled={isResting} style={{ flex: 1, height: 42, borderRadius: 11, border: "none", background: isResting ? "rgba(255,255,255,0.02)" : CLR.accent, color: isResting ? "rgba(255,255,255,0.08)" : CLR.bg, fontSize: 15, fontWeight: 800, cursor: isResting ? "default" : "pointer" }}>DONE</button>
          <button onClick={() => setIsChatOpen(true)} style={{ width: 42, height: 42, borderRadius: 11, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
        </div>
      </div>}
    </div>
  );

  // ── FOCUSED EXERCISE VIEW ──────────────────────────────────────────────────
  const renderFocusedExercise = () => {
    if (!currentExercise) return null;
    const ex = currentExercise;
    const isMainWorkout = exerciseIndex >= WARMUP_EXERCISES.length && exerciseIndex < WARMUP_EXERCISES.length + WORKOUT_EXERCISES.length;
    const intentColor = INTENT_COLORS[ex.intent] || CLR.accent;
    const restProgress = restTimeTotal > 0 ? (restTimeTotal - restTimeLeft) / restTimeTotal : 0;
    const circumference = 2 * Math.PI * 52;

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", position: "relative" }}>
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px 8px" }}>
          <button onClick={() => setFocusedMode(false)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M8.5 2.5L4 7L8.5 11.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>All exercises</span>
          </button>
          <button onClick={() => setDetailExercise(ex)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "5px 10px", cursor: "pointer" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/><path d="M12 16v-4m0-4h.01" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round"/></svg>
            <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.3)" }}>Info</span>
          </button>
        </div>

        {/* Session progress bar */}
        <div style={{ padding: "0 16px 10px" }}>
          <div style={{ height: 2, borderRadius: 1, background: "rgba(255,255,255,0.03)" }}><div style={{ height: 2, borderRadius: 1, background: CLR.accent, width: `${(completedSetCount / totalSetsInSession) * 100}%`, transition: "width 0.4s" }} /></div>
          <div style={{ fontSize: 10, color: CLR.t3, textAlign: "right", marginTop: 3 }}>{completedSetCount}/{totalSetsInSession} sets</div>
        </div>

        {/* Main content — centered exercise */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "0 24px", textAlign: "center" }}>

          {/* Exercise name + RPE */}
          <div style={{ padding: "4px 12px", borderRadius: 8, border: `1px solid ${intentColor}25`, background: `${intentColor}08`, marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: intentColor }}>{intentToRPE(ex.intent)}</span>
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: CLR.text, lineHeight: 1.2, marginBottom: 6 }}>{ex.name}</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginBottom: 24 }}>
            {ex.sets} sets × {ex.isHold ? `${ex.reps}s hold` : `${ex.reps} reps`}{ex.rest > 0 ? ` · ${ex.rest}s rest` : ""}
          </div>

          {/* Timer ring / Set indicator */}
          <div style={{ position: "relative", width: 120, height: 120, marginBottom: 20 }}>
            <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.04)" strokeWidth="4" fill="none" />
              {isResting && <circle cx="60" cy="60" r="52" stroke={CLR.accent} strokeWidth="4" fill="none" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - restProgress)} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s linear" }} />}
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              {isResting ? (
                <>
                  <div style={{ fontSize: 28, fontWeight: 800, color: CLR.accent, fontVariantNumeric: "tabular-nums" }}>{Math.floor(restTimeLeft / 60)}:{(restTimeLeft % 60).toString().padStart(2, "0")}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>resting</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 28, fontWeight: 800, color: CLR.text }}>Set {setIndex + 1}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>of {ex.sets}</div>
                </>
              )}
            </div>
          </div>

          {/* Set progress dots */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {Array.from({ length: ex.sets }).map((_, sn) => (
              <div key={sn} style={{ width: 12, height: 12, borderRadius: 6, border: `2px solid ${sn < setIndex ? CLR.accent : sn === setIndex ? `${CLR.accent}80` : "rgba(255,255,255,0.08)"}`, background: sn < setIndex ? CLR.accent : "transparent", transition: "all 0.3s" }} />
            ))}
          </div>

          {/* Coaching note */}
          {ex.note && <div style={{ fontSize: 13, color: "rgba(255,255,255,0.25)", fontStyle: "italic", maxWidth: 280, lineHeight: 1.5 }}>{ex.note}</div>}

          {/* Muscles */}
          {ex.muscles && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.15)", marginTop: 8 }}>{ex.muscles}</div>}
        </div>

        {/* Bottom controls */}
        <div style={{ padding: "12px 16px 20px" }}>
          {isResting && (
            <button onClick={() => { setIsResting(false); setRestTimeLeft(0); arnoldSay("Skipped. Go."); }} style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", color: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>Skip rest</button>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setIsChatOpen(true); setChatMessages(prev => [...prev, { from: "arnold", text: "Something hurting? Tap where it hurts." }, { from: "system", text: "BODY_MAP" }]); }} style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid rgba(255,69,58,0.12)", background: "rgba(255,69,58,0.03)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="18" height="18" viewBox="0 0 24 28" fill="none"><circle cx="12" cy="4" r="3" stroke="#FF453A" strokeWidth="1.2"/><path d="M12 7v7m-4-5l4 2 4-2m-8 7l2 7m4-7l2 7" stroke="#FF453A" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
            <button onClick={handleSetDone} disabled={isResting} style={{ flex: 1, height: 48, borderRadius: 12, border: "none", background: isResting ? "rgba(255,255,255,0.02)" : CLR.accent, color: isResting ? "rgba(255,255,255,0.08)" : CLR.bg, fontSize: 16, fontWeight: 800, cursor: isResting ? "default" : "pointer", letterSpacing: "-0.02em" }}>DONE</button>
            <button onClick={() => setIsChatOpen(true)} style={{ width: 48, height: 48, borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
          </div>
        </div>
      </div>
    );
  };

  // ── PROGRESS ───────────────────────────────────────────────────────────────
  const renderProgress = () => {
    const progressionData = [["pull", "#E63946", "Full Pull-ups", 3, 9], ["push", "#F5A623", "Planche Push-ups", 5, 9], ["legs", "#2A9D8F", "Bulgarian Splits", 2, 8], ["core", "#7C5CBF", "Leg Raises", 3, 9], ["skill", "#F77F00", "Wall Handstand", 2, 9]];
    return (
      <div style={{ padding: 18, overflow: "auto", height: "100%" }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: CLR.text, marginBottom: 14 }}>Progress</div>
        <div style={{ display: "flex", gap: 7, marginBottom: 14 }}>{[["Streak", streakCount], ["Weekly", Math.floor(streakCount / 7)], ["Total", sessionCount]].map(([label, value]) => <div key={label} style={{ flex: 1, background: CLR.card, borderRadius: 10, padding: 11 }}><div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 0.5, marginBottom: 3 }}>{label}</div><div style={{ fontSize: 18, fontWeight: 800, color: CLR.accent }}>{value}</div></div>)}</div>
        <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginBottom: 7 }}>PROGRESSION LEVELS</div>
        {progressionData.map(([pattern, color, name, level, total]) => <div key={pattern} style={{ marginBottom: 11 }}><div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}><span style={{ fontSize: 11, fontWeight: 700, color, letterSpacing: 1 }}>{pattern.toUpperCase()}</span><span style={{ fontSize: 11, color: CLR.t3 }}>Lvl {level + 1}/{total}</span></div><div style={{ fontSize: 12, fontWeight: 600, color: CLR.text, marginBottom: 4 }}>{name}</div><div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.03)" }}><div style={{ height: 3, borderRadius: 2, background: color, width: `${(level / total) * 100}%` }} /></div></div>)}
      </div>
    );
  };

  // ── PROGRAM (Calendar View) ──────────────────────────────────────────────
  const renderProgram = () => {
    const weeks = mesocycleData || generateMesocycle(trainingDays || 4, selectedSplit || "ppl", selectedDays);
    const uniquePhases = [...new Set(weeks.map(wk => wk.phase))];
    const currentWeekIdx = weeks.findIndex(w => w.isCurrentWeek) || 0;
    const currentWeek = weeks[currentWeekIdx];
    const selDay = selectedCalendarDay ? weeks[selectedCalendarDay.weekIdx]?.calendarDays[selectedCalendarDay.dayIdx] : null;
    const selWeek = selectedCalendarDay ? weeks[selectedCalendarDay.weekIdx] : null;
    const phaseColor = currentWeek ? PHASE_COLORS[currentWeek.phase] : CLR.accent;

    if (!programZoomed) {
      // ── CURRENT WEEK FOCUS VIEW ──
      const orderedDays = currentWeek ? [...currentWeek.calendarDays.slice(1), currentWeek.calendarDays[0]] : [];
      const today = new Date();

      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ padding: "14px 18px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: CLR.text }}>Week {currentWeek?.weekNum}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, background: `${phaseColor}0A`, border: `1px solid ${phaseColor}12` }}>
                    <div style={{ width: 5, height: 5, borderRadius: 3, background: phaseColor }} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: phaseColor }}>{PHASE_NAMES[currentWeek?.phase]}</span>
                  </div>
                  <span style={{ fontSize: 11, color: CLR.t3 }}>{formatDate(currentWeek?.startDate || today)}</span>
                </div>
              </div>
              <button onClick={() => setProgramZoomed(true)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.04)", cursor: "pointer", fontSize: 11, fontWeight: 600, color: CLR.t2 }}>Full program</button>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "4px 14px 14px" }}>
            {orderedDays.map((day, idx) => {
              const isToday = day.date.toDateString() === today.toDateString();
              const isPast = day.date < today && !isToday;

              if (day.isRest) {
                return (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, marginBottom: 4, opacity: isPast ? 0.4 : 1 }}>
                    <div style={{ width: 36, textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: CLR.t3, fontWeight: 600 }}>{day.dayShort}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>{day.date.getDate()}</div>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>Rest day</div>
                  </div>
                );
              }

              const session = day.session;
              return (
                <button key={idx} onClick={() => setSelectedCalendarDay(selectedCalendarDay?.dayIdx === day.dayOfWeek && selectedCalendarDay?.weekIdx === currentWeekIdx ? null : { weekIdx: currentWeekIdx, dayIdx: day.dayOfWeek })} style={{
                  display: "flex", gap: 12, width: "100%", padding: "12px", borderRadius: 12, marginBottom: 4, cursor: "pointer", textAlign: "left",
                  border: `1px solid ${isToday ? `${CLR.accent}30` : "rgba(255,255,255,0.06)"}`,
                  background: isToday ? `${CLR.accent}08` : "rgba(255,255,255,0.03)",
                  opacity: isPast ? 0.4 : 1,
                }}>
                  <div style={{ width: 36, textAlign: "center", flexShrink: 0 }}>
                    <div style={{ fontSize: 10, color: isToday ? CLR.accent : CLR.t3, fontWeight: 600 }}>{day.dayShort}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: isToday ? CLR.accent : "rgba(255,255,255,0.7)" }}>{day.date.getDate()}</div>
                    {isToday && <div style={{ width: 4, height: 4, borderRadius: 2, background: CLR.accent, margin: "3px auto 0" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{session.label}</span>
                      <div style={{ padding: "1px 6px", borderRadius: 5, fontSize: 9, fontWeight: 700, border: `1px solid ${INTENT_COLORS[session.intent]}30`, color: INTENT_COLORS[session.intent], background: `${INTENT_COLORS[session.intent]}10` }}>{intentToRPE(session.intent)}</div>
                      {session.isPR && <span style={{ fontSize: 8, fontWeight: 700, color: "#F77F00", background: "rgba(247,127,0,0.08)", padding: "1px 5px", borderRadius: 4 }}>PR</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>~{session.estimatedMinutes} min · {session.exercises.length} exercises</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 5 }}>
                      {session.exercises.slice(0, 3).map((ex, exIdx) => (
                        <span key={exIdx} style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)" }}>{ex.name}</span>
                      ))}
                      {session.exercises.length > 3 && <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>+{session.exercises.length - 3}</span>}
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Week navigation */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
              <span style={{ fontSize: 11, color: CLR.t3 }}>Week {currentWeek?.weekNum} of {weeks.length}</span>
            </div>
          </div>

          {/* Selected day detail */}
          {selDay && selDay.session && selWeek?.weekNum === currentWeek?.weekNum && (
            <div style={{ borderTop: `1px solid ${phaseColor}25`, background: CLR.card, padding: "12px 16px 16px", maxHeight: 240, overflow: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div><div style={{ fontSize: 11, color: CLR.t3 }}>{selDay.dayName} · {formatDate(selDay.date)}</div><div style={{ fontSize: 16, fontWeight: 700, color: CLR.text, marginTop: 1 }}>{selDay.session.label}</div></div>
                <button onClick={() => setSelectedCalendarDay(null)} style={{ fontSize: 11, color: CLR.t3, background: "none", border: "none", cursor: "pointer" }}>✕</button>
              </div>
              <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginBottom: 5 }}>EXERCISES</div>
              {selDay.session.exercises.map((exercise, exIdx) => (
                <div key={exIdx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderRadius: 8, marginBottom: 3, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <div><div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{exercise.name}</div><div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{exercise.sets} × {exercise.reps}{typeof exercise.reps === "string" ? "" : " reps"}</div></div>
                  <div style={{ width: 5, height: 5, borderRadius: 3, background: INTENT_COLORS[exercise.intent] || CLR.accent }} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // ── ZOOMED OUT FULL CALENDAR ──
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ padding: "14px 18px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div><div style={{ fontSize: 20, fontWeight: 800, color: CLR.text }}>Full program</div><div style={{ fontSize: 12, color: CLR.t2, marginTop: 1 }}>{weeks.length} weeks · {formatDate(weeks[0].startDate)} → {formatDate(new Date(weeks[weeks.length - 1].startDate.getTime() + 6 * 86400000))}</div></div>
            <button onClick={() => setProgramZoomed(false)} style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.04)", cursor: "pointer", fontSize: 11, fontWeight: 600, color: CLR.t2 }}>This week</button>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>{uniquePhases.map(phase => <div key={phase} style={{ display: "flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6, background: `${PHASE_COLORS[phase]}0A`, border: `1px solid ${PHASE_COLORS[phase]}12` }}><div style={{ width: 5, height: 5, borderRadius: 3, background: PHASE_COLORS[phase] }} /><span style={{ fontSize: 9, fontWeight: 600, color: PHASE_COLORS[phase] }}>{PHASE_NAMES[phase]}</span></div>)}</div>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "0 12px 12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "36px repeat(7, 1fr)", gap: 2, marginBottom: 2, position: "sticky", top: 0, background: CLR.bg, paddingBottom: 4, zIndex: 2 }}>
            <div />
            {["M","T","W","T","F","S","S"].map((d, i) => <div key={i} style={{ fontSize: 10, fontWeight: 600, color: CLR.t3, textAlign: "center", padding: "4px 0" }}>{d}</div>)}
          </div>
          {weeks.map((week, weekIdx) => {
            const weekPhaseColor = PHASE_COLORS[week.phase];
            const orderedDays = [...week.calendarDays.slice(1), week.calendarDays[0]];
            return (
              <div key={weekIdx} style={{ display: "grid", gridTemplateColumns: "36px repeat(7, 1fr)", gap: 2, marginBottom: 2 }}>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: week.isCurrentWeek ? weekPhaseColor : "rgba(255,255,255,0.4)" }}>W{week.weekNum}</div>
                  <div style={{ width: 12, height: 2, borderRadius: 1, background: weekPhaseColor, marginTop: 2, opacity: 0.5 }} />
                </div>
                {orderedDays.map((day, dayDisplayIdx) => {
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  if (day.isRest) return <div key={dayDisplayIdx} style={{ borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 36, background: "rgba(255,255,255,0.01)" }}><div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{day.date.getDate()}</div></div>;
                  return (
                    <button key={dayDisplayIdx} onClick={() => { setSelectedCalendarDay({ weekIdx, dayIdx: day.dayOfWeek }); setProgramZoomed(false); }} style={{
                      borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 36, cursor: "pointer",
                      background: isToday ? `${CLR.accent}10` : "rgba(255,255,255,0.035)", border: isToday ? `1.5px solid ${CLR.accent}25` : "1.5px solid rgba(255,255,255,0.05)",
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: isToday ? CLR.accent : "rgba(255,255,255,0.5)" }}>{day.date.getDate()}</div>
                      <div style={{ width: 4, height: 4, borderRadius: 2, background: INTENT_COLORS[day.session?.intent] || CLR.accent, marginTop: 2 }} />
                    </button>
                  );
                })}
              </div>
            );
          })}
          <div style={{ textAlign: "center", padding: "10px 0" }}><div style={{ fontSize: 11, color: CLR.t3 }}>End of mesocycle</div></div>
        </div>
      </div>
    );
  };

  // ── SETTINGS ────────────────────────────────────────────────────────────────
  const [settingsEditing, setSettingsEditing] = useState(null); // null | "goals" | "schedule" | "profile"
  const renderSettings = () => {
    const splitLabel = SPLIT_OPTIONS.find(opt => opt.id === selectedSplit)?.label || "Push / Pull / Legs";
    const dayLabels = selectedDays.sort((a, b) => a - b).map(d => DAY_LABELS[d]).join(", ");

    // Inline editing for goals
    if (settingsEditing === "goals") {
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: CLR.text }}>Edit Goals</span>
            <button onClick={() => setSettingsEditing(null)} style={{ fontSize: 13, fontWeight: 600, color: CLR.accent, background: "none", border: "none", cursor: "pointer" }}>Done</button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 18 }}>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginBottom: 14 }}>Tap to add or remove goals. Changes will regenerate your program.</div>
            {GOALS.map(goal => { const isSelected = selectedGoals.includes(goal.id); return (
              <button key={goal.id} onClick={() => setSelectedGoals(prev => prev.includes(goal.id) ? prev.filter(gId => gId !== goal.id) : [...prev, goal.id])} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 14px", borderRadius: 14, border: `1.5px solid ${isSelected ? goal.color + "45" : "rgba(255,255,255,0.04)"}`, background: isSelected ? goal.color + "06" : "rgba(255,255,255,0.015)", marginBottom: 7, cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: isSelected ? goal.color + "10" : "rgba(255,255,255,0.025)", display: "flex", alignItems: "center", justifyContent: "center" }}><GoalIcon path={goal.icon} color={isSelected ? goal.color : "rgba(255,255,255,0.25)"} /></div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600, color: isSelected ? goal.color : "rgba(255,255,255,0.5)" }}>{goal.label}</div></div>
                {isSelected && <div style={{ width: 18, height: 18, borderRadius: 9, background: goal.color, display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></div>}
              </button>); })}
            {selectedGoals.length > 1 && <>
              <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, margin: "16px 0 8px" }}>PRIORITY ORDER</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginBottom: 10 }}>Tap to reorder. Primary gets ~60% volume.</div>
              {rankedGoals.filter(id => selectedGoals.includes(id)).map((goalId, idx) => { const g = GOALS.find(x => x.id === goalId); if (!g) return null; return (
                <div key={goalId} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 10, border: `1px solid ${g.color}25`, background: `${g.color}04`, marginBottom: 4 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 11, background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: idx === 0 ? CLR.accent : "rgba(255,255,255,0.2)" }}>{idx + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)", flex: 1 }}>{g.label}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>{VOL_LABELS[idx]}</span>
                </div>); })}
            </>}
          </div>
        </div>
      );
    }

    // Inline editing for profile
    if (settingsEditing === "profile") {
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: CLR.text }}>Edit Profile</span>
            <button onClick={() => setSettingsEditing(null)} style={{ fontSize: 13, fontWeight: 600, color: CLR.accent, background: "none", border: "none", cursor: "pointer" }}>Done</button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
              <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 3 }}>
                {["Metric", "Imperial"].map(unit => (
                  <button key={unit} onClick={() => setUseMetric(unit === "Metric")} style={{ padding: "6px 20px", borderRadius: 8, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", background: (unit === "Metric" ? useMetric : !useMetric) ? `${CLR.accent}15` : "transparent", color: (unit === "Metric" ? useMetric : !useMetric) ? CLR.accent : "rgba(255,255,255,0.25)" }}>{unit}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginBottom: 8 }}>WEIGHT</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="number" value={userWeight} onChange={ev => setUserWeight(ev.target.value)} style={{ flex: 1, padding: "14px 16px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", color: CLR.text, fontSize: 18, fontWeight: 700, outline: "none", fontFamily: "inherit", textAlign: "center" }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.2)", width: 30 }}>{useMetric ? "kg" : "lbs"}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginBottom: 8 }}>HEIGHT</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input type="number" value={userHeight} onChange={ev => setUserHeight(ev.target.value)} style={{ flex: 1, padding: "14px 16px", borderRadius: 12, border: "1.5px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", color: CLR.text, fontSize: 18, fontWeight: 700, outline: "none", fontFamily: "inherit", textAlign: "center" }} />
                <span style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.2)", width: 30 }}>{useMetric ? "cm" : "in"}</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Inline editing for schedule
    if (settingsEditing === "schedule") {
      return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: CLR.text }}>Edit Schedule</span>
            <button onClick={() => { setSettingsEditing(null); setMesocycleData(generateMesocycle(trainingDays, selectedSplit || "ppl", selectedDays)); }} style={{ fontSize: 13, fontWeight: 600, color: CLR.accent, background: "none", border: "none", cursor: "pointer" }}>Save & Rebuild</button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginBottom: 8 }}>DAYS PER WEEK</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>{[2,3,4,5,6].map(n => (
              <button key={n} onClick={() => { setTrainingDays(n); setSelectedDays(prev => prev.slice(0, n)); }} style={{ width: 44, height: 44, borderRadius: 12, border: `1.5px solid ${trainingDays === n ? `${CLR.accent}40` : "rgba(255,255,255,0.04)"}`, background: trainingDays === n ? `${CLR.accent}0A` : "rgba(255,255,255,0.015)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: trainingDays === n ? CLR.accent : "rgba(255,255,255,0.3)" }}>{n}</button>
            ))}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginBottom: 8 }}>WHICH DAYS</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>{DAY_LABELS.map((d, i) => { const sel = selectedDays.includes(i); const full = !sel && selectedDays.length >= trainingDays; return (
              <button key={i} onClick={() => { if (full) return; setSelectedDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]); }} style={{ flex: 1, aspectRatio: "1", borderRadius: 10, border: `1.5px solid ${sel ? `${CLR.accent}40` : "rgba(255,255,255,0.03)"}`, background: sel ? `${CLR.accent}0A` : "rgba(255,255,255,0.01)", color: sel ? CLR.accent : full ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.3)", fontSize: 12, fontWeight: 600, cursor: full ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>{d}</button>); })}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginBottom: 8 }}>SPLIT</div>
            <div style={{ marginBottom: 20 }}>{SPLIT_OPTIONS.map(s => (
              <button key={s.id} onClick={() => setSelectedSplit(s.id)} style={{ width: "100%", padding: "11px 14px", borderRadius: 12, marginBottom: 5, textAlign: "left", border: `1px solid ${selectedSplit === s.id ? `${CLR.accent}30` : "rgba(255,255,255,0.04)"}`, background: selectedSplit === s.id ? `${CLR.accent}06` : "rgba(255,255,255,0.015)", cursor: "pointer" }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: selectedSplit === s.id ? CLR.accent : "rgba(255,255,255,0.6)" }}>{s.label}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", marginTop: 1 }}>{s.sub}</div>
              </button>
            ))}</div>
            <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginBottom: 8 }}>SESSION LENGTH</div>
            <div style={{ display: "flex", gap: 8 }}>{[30,45,60,75,90].map(m => (
              <button key={m} onClick={() => setSessionDuration(m)} style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${sessionDuration === m ? `${CLR.accent}30` : "rgba(255,255,255,0.04)"}`, background: sessionDuration === m ? `${CLR.accent}08` : "rgba(255,255,255,0.015)", cursor: "pointer", fontSize: 14, fontWeight: 600, color: sessionDuration === m ? CLR.accent : "rgba(255,255,255,0.3)" }}>{m}m</button>
            ))}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.15)", marginTop: 16, textAlign: "center" }}>Saving will regenerate your mesocycle.</div>
          </div>
        </div>
      );
    }

    // ── Main settings view ──
    const settingRow = (label, value, action, color) => (
      <button onClick={action} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", border: "none", background: "none", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.02)" }}>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>{label}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 13, color: color || "rgba(255,255,255,0.25)" }}>{value}</span>
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none"><path d="M5.5 2.5L10 7L5.5 11.5" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
      </button>
    );

    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.025)" }}>
          <span style={{ fontSize: 20, fontWeight: 800, color: CLR.text }}>Settings</span>
          <button onClick={() => setScreen("home")} style={{ fontSize: 13, fontWeight: 600, color: CLR.accent, background: "none", border: "none", cursor: "pointer" }}>Done</button>
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: "8px 18px" }}>
          {/* Profile */}
          <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, margin: "14px 0 6px" }}>PROFILE</div>
          {settingRow("Weight", `${userWeight || "—"} ${useMetric ? "kg" : "lbs"}`, () => setSettingsEditing("profile"))}
          {settingRow("Height", `${userHeight || "—"} ${useMetric ? "cm" : "in"}`, () => setSettingsEditing("profile"))}
          {settingRow("Units", useMetric ? "Metric" : "Imperial", () => setSettingsEditing("profile"))}

          {/* Training */}
          <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, margin: "18px 0 6px" }}>TRAINING</div>
          {settingRow("Goals", selectedGoals.map(id => GOALS.find(g => g.id === id)?.label).filter(Boolean).join(", ") || "None", () => setSettingsEditing("goals"))}
          {rankedGoals.length > 1 && settingRow("Priority", rankedGoals.map(id => GOALS.find(g => g.id === id)?.label).join(" → "), () => setSettingsEditing("goals"))}
          {settingRow("Days", `${trainingDays}x / week`, () => setSettingsEditing("schedule"))}
          {settingRow("Schedule", dayLabels || "Not set", () => setSettingsEditing("schedule"))}
          {settingRow("Split", splitLabel, () => setSettingsEditing("schedule"))}
          {settingRow("Session length", `${sessionDuration} min`, () => setSettingsEditing("schedule"))}

          {/* Program */}
          <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, margin: "18px 0 6px" }}>PROGRAM</div>
          {settingRow("Entry path", entryPath === "assessment" ? "Full Assessment" : entryPath === "self_report" ? "Self-Report" : entryPath === "beginner" ? "Complete Beginner" : "Not set", () => {})}
          <button onClick={() => { setMesocycleData(generateMesocycle(trainingDays, selectedSplit || "ppl", selectedDays)); }} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", cursor: "pointer", marginTop: 8, textAlign: "center" }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>Regenerate program</span>
          </button>

          {/* Targets */}
          {selectedTargets.length > 0 && <>
            <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, margin: "18px 0 6px" }}>TARGETS</div>
            {selectedTargets.map(t => (
              <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.015)" }}>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{t}</span>
                <button onClick={() => setSelectedTargets(prev => prev.filter(x => x !== t))} style={{ border: "none", background: "none", color: "#E6394650", fontSize: 14, cursor: "pointer", padding: 4 }}>×</button>
              </div>
            ))}
          </>}

          {/* Danger zone */}
          <div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, margin: "24px 0 6px" }}>ACCOUNT</div>
          <button onClick={() => { if (confirm("Reset everything? This will clear your progress, goals, and program.")) { setScreen("onboarding"); setOnboardStep(0); setSelectedGoals([]); setRankedGoals([]); setMesocycleData(null); setStreakCount(0); setSessionCount(0); setEntryPath(null); } }} style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid rgba(255,69,58,0.12)", background: "rgba(255,69,58,0.03)", cursor: "pointer", textAlign: "center", marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#FF453A" }}>Reset Everything</span>
          </button>
        </div>
      </div>
    );
  };

  // ── OVERLAYS ───────────────────────────────────────────────────────────────
  const renderExerciseDetail = () => { if (!detailExercise) return null; return <div style={{ position: "absolute", inset: 0, background: CLR.bg, zIndex: 200, display: "flex", flexDirection: "column", borderRadius: 28 }} onClick={(e) => e.stopPropagation()}>
    {/* Back arrow */}
    <button onClick={(e) => { e.stopPropagation(); setDetailExercise(null); }} style={{ position: "absolute", top: 14, left: 14, width: 30, height: 30, borderRadius: 9, border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.03)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 210 }}><svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M8.5 2.5L4 7L8.5 11.5" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
    <div style={{ flex: 1, overflow: "auto", padding: "48px 20px 20px" }}><div style={{ fontSize: 18, fontWeight: 700, color: CLR.text, marginBottom: 3 }}>{detailExercise.name}</div><div style={{ fontSize: 11, color: CLR.t3, letterSpacing: 1, marginBottom: 14 }}>{intentToRPE(detailExercise.intent)}</div><div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginBottom: 5 }}>MUSCLES</div><div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 12 }}>{detailExercise.muscles}</div><div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginBottom: 5 }}>FORM CUES</div>{detailExercise.cues?.map((cue, idx) => <div key={idx} style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginBottom: 3 }}>→ {cue}</div>)}<div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginTop: 12, marginBottom: 5 }}>COMMON MISTAKES</div>{detailExercise.mistakes?.map((mistake, idx) => <div key={idx} style={{ fontSize: 13, color: "#E6394670", marginBottom: 3 }}>✕ {mistake}</div>)}{detailExercise.note && <><div style={{ fontSize: 10, fontWeight: 700, color: CLR.t3, letterSpacing: 2, marginTop: 12, marginBottom: 5 }}>COACHING NOTE</div><div style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>{detailExercise.note}</div></>}</div><div style={{ padding: "10px 20px 20px" }}><button onClick={(e) => { e.stopPropagation(); setDetailExercise(null); }} style={{ width: "100%", padding: 13, borderRadius: 14, border: "none", background: CLR.accent, color: CLR.bg, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>Close</button></div></div>; };

  const renderChatOverlay = () => {
    if (!isChatOpen) return null;
    const bodyParts = [
      { id: "head", label: "Head", x: 60, y: 12, w: 24, h: 20 },
      { id: "neck", label: "Neck", x: 56, y: 34, w: 32, h: 10 },
      { id: "left_shoulder", label: "L. Shoulder", x: 28, y: 44, w: 26, h: 16 },
      { id: "right_shoulder", label: "R. Shoulder", x: 90, y: 44, w: 26, h: 16 },
      { id: "chest", label: "Chest", x: 54, y: 48, w: 36, h: 20 },
      { id: "left_elbow", label: "L. Elbow", x: 18, y: 68, w: 20, h: 14 },
      { id: "right_elbow", label: "R. Elbow", x: 106, y: 68, w: 20, h: 14 },
      { id: "lower_back", label: "Lower Back", x: 56, y: 72, w: 32, h: 18 },
      { id: "left_wrist", label: "L. Wrist", x: 10, y: 88, w: 18, h: 12 },
      { id: "right_wrist", label: "R. Wrist", x: 116, y: 88, w: 18, h: 12 },
      { id: "left_knee", label: "L. Knee", x: 44, y: 110, w: 20, h: 16 },
      { id: "right_knee", label: "R. Knee", x: 80, y: 110, w: 20, h: 16 },
      { id: "left_ankle", label: "L. Ankle", x: 42, y: 140, w: 18, h: 12 },
      { id: "right_ankle", label: "R. Ankle", x: 84, y: 140, w: 18, h: 12 },
    ];
    const handleBodyTap = (part) => {
      setChatMessages(prev => prev.filter(m => m.text !== "BODY_MAP").concat([
        { from: "user", text: `${part.label} hurts` },
        { from: "arnold", text: `Got it — ${part.label.toLowerCase()}. From 1 to 10, how much does it hurt?` }
      ]));
    };
    return (
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 150, display: "flex", flexDirection: "column", justifyContent: "flex-end", borderRadius: 28 }}>
        <div style={{ background: CLR.card, borderRadius: "15px 15px 0 0", border: "1px solid rgba(255,255,255,0.04)", borderBottom: "none", display: "flex", flexDirection: "column", height: "75%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 15px 7px" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: CLR.text }}>Arnold</span>
            <button onClick={() => setIsChatOpen(false)} style={{ width: 24, height: 24, borderRadius: 12, border: "1px solid rgba(255,255,255,0.04)", background: "rgba(255,255,255,0.015)", cursor: "pointer", fontSize: 11, color: CLR.t2, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          </div>
          <div ref={chatScrollRef} style={{ flex: 1, overflow: "auto", padding: "0 13px 7px" }}>
            {chatMessages.map((msg, idx) => {
              if (msg.text === "BODY_MAP") {
                return (
                  <div key={idx} style={{ display: "flex", justifyContent: "center", margin: "8px 0 12px" }}>
                    <div style={{ position: "relative", width: 144, height: 160 }}>
                      {/* Body silhouette */}
                      <svg width="144" height="160" viewBox="0 0 144 160" fill="none" style={{ position: "absolute", top: 0, left: 0 }}>
                        <circle cx="72" cy="18" r="14" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                        <path d="M72 32v30M52 44l20 8 20-8M42 90l12-28M90 62l12 28M52 92v40M92 92v40M48 148h12M84 148h12" stroke="rgba(255,255,255,0.12)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {/* Tappable zones */}
                      {bodyParts.map(part => (
                        <button key={part.id} onClick={() => handleBodyTap(part)} style={{
                          position: "absolute", left: part.x, top: part.y, width: part.w, height: part.h,
                          borderRadius: 6, border: "1px solid rgba(255,69,58,0.15)", background: "rgba(255,69,58,0.04)",
                          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 6, color: "rgba(255,69,58,0.5)", fontWeight: 600, transition: "all 0.15s",
                        }}
                        onMouseEnter={e => { e.target.style.background = "rgba(255,69,58,0.15)"; e.target.style.borderColor = "rgba(255,69,58,0.4)"; }}
                        onMouseLeave={e => { e.target.style.background = "rgba(255,69,58,0.04)"; e.target.style.borderColor = "rgba(255,69,58,0.15)"; }}
                        />
                      ))}
                    </div>
                  </div>
                );
              }
              return (
                <div key={idx} style={{ display: "flex", justifyContent: msg.from === "arnold" ? "flex-start" : "flex-end", marginBottom: 5 }}>
                  <div style={{ maxWidth: "80%", padding: "7px 11px", borderRadius: msg.from === "arnold" ? "2px 11px 11px" : "11px 11px 2px", background: msg.from === "arnold" ? "rgba(255,255,255,0.025)" : `${CLR.accent}0D`, border: `1px solid ${msg.from === "arnold" ? "rgba(255,255,255,0.03)" : `${CLR.accent}15`}`, fontSize: 13, lineHeight: 1.45, color: msg.from === "arnold" ? "rgba(255,255,255,0.6)" : CLR.accent }}>{msg.text}</div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 6, padding: "5px 11px 13px" }}>
            <input value={chatInputText} onChange={ev => setChatInputText(ev.target.value)} onKeyDown={ev => ev.key === "Enter" && sendChatMessage()} placeholder="Ask anything..." style={{ flex: 1, padding: "8px 11px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.03)", background: "rgba(255,255,255,0.015)", color: CLR.text, fontSize: 13, outline: "none", fontFamily: "inherit" }} />
            <button onClick={sendChatMessage} style={{ width: 34, height: 34, borderRadius: 9, border: "none", background: chatInputText.trim() ? `${CLR.accent}15` : "rgba(255,255,255,0.015)", cursor: chatInputText.trim() ? "pointer" : "default", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" stroke={chatInputText.trim() ? CLR.accent : "rgba(255,255,255,0.08)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
          </div>
        </div>
      </div>
    );
  };

  const showTabBar = ["home", "program", "progress"].includes(screen);
  const activeTab = screen === "progress" ? "progress" : screen === "program" ? "program" : "home";

  return (
    <div style={{ maxWidth: 390, margin: "0 auto", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`*{box-sizing:border-box;margin:0;padding:0}button{font-family:inherit}button:hover{filter:brightness(1.05)}input::placeholder{color:rgba(255,255,255,0.12)}input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}::-webkit-scrollbar{width:0}`}</style>
      <div style={{ background: CLR.bg, borderRadius: 28, border: "1px solid rgba(255,255,255,0.035)", overflow: "hidden", height: 740, display: "flex", flexDirection: "column", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.008, backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.3) 1px, transparent 0)", backgroundSize: "24px 24px", pointerEvents: "none" }} />
        <div style={{ flex: 1, position: "relative", zIndex: 1, overflow: "hidden" }}>
          {screen === "onboarding" && renderOnboarding()}
          {screen === "home" && renderHome()}
          {screen === "session" && (focusedMode && !isSessionDone ? renderFocusedExercise() : renderSession())}
          {screen === "progress" && renderProgress()}
          {screen === "program" && renderProgram()}
          {screen === "settings" && renderSettings()}
          {renderChatOverlay()}
          {renderExerciseDetail()}
        </div>
        {showTabBar && <div style={{ display: "flex", borderTop: "1px solid rgba(255,255,255,0.025)", position: "relative", zIndex: 1 }}>
          {[["home", "Train"], ["program", "Program"], ["progress", "Progress"]].map(([tabId, tabLabel]) => <button key={tabId} onClick={() => setScreen(tabId)} style={{ flex: 1, padding: "8px 0 18px", border: "none", background: "transparent", cursor: "pointer" }}><div style={{ fontSize: 10, fontWeight: 600, color: activeTab === tabId ? CLR.accent : CLR.t3, letterSpacing: 0.5 }}>{tabLabel}</div></button>)}
        </div>}
        {screen === "session" && !isSessionDone && !detailExercise && !focusedMode && <button onClick={() => setScreen("home")} style={{ position: "absolute", top: 12, left: 12, zIndex: 10, width: 28, height: 28, borderRadius: 9, border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.015)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><svg width="11" height="11" viewBox="0 0 14 14" fill="none"><path d="M8.5 2.5L4 7L8.5 11.5" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg></button>}
      </div>
    </div>
  );
}
