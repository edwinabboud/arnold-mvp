# ARNOLD — AI Calisthenics Coach

## Quick Start

```bash
cd arnold
npm install
npx expo start
```

## Architecture (25 source files)

```
arnold/
├── App.tsx
├── src/
│   ├── types/
│   │   ├── index.ts              # Core data models (user, plan, session, progressions)
│   │   └── logging.ts            # Interaction logging (future fine-tuning dataset)
│   │
│   ├── data/
│   │   ├── progressions.ts       # 44 exercises across 5 movement patterns
│   │   └── exerciseKnowledge.ts  # Form cues, muscles, mistakes for every exercise
│   │
│   ├── engine/
│   │   ├── rules.ts              # Deterministic coaching (pain/progression/missed-time)
│   │   ├── coaching.ts           # Arnold's personality + quick responses
│   │   ├── planGenerator.ts      # Assessment → mesocycle with goal mixing (60/30/10)
│   │   ├── assessment.ts         # Assessment week builder
│   │   ├── feedback.ts           # Post-session conversational feedback flow
│   │   └── api.ts                # Claude API: 4 agents + orchestration + cost bypass
│   │
│   ├── store/useStore.ts         # Zustand with persistence
│   │
│   ├── components/
│   │   ├── waveform/ArnoldWaveform.tsx  # Siri-style animated waveform (RN)
│   │   ├── chat/ChatWidget.tsx          # Core: tappable options + free text
│   │   └── exercise/ExerciseDetail.tsx  # 3D viewer stand-in
│   │
│   ├── screens/
│   │   ├── onboarding/ConversationalOnboarding.tsx  # Single chat-based flow
│   │   ├── home/HomeScreen.tsx
│   │   ├── session/SessionScreen.tsx                # Workout loop
│   │   └── progress/ProgressScreen.tsx              # PRs, streaks, levels
│   │
│   ├── navigation/index.tsx      # Bottom tabs + session modal
│   └── theme/index.ts            # Dark theme, amber accent
```

## What's Built

**Engine**: Rules engine (pain/progression/missed-time), plan generator with goal mixing, 4 AI agents (Plan Generator, Session Adapter, Progress Analyst, Conversation Agent), quick response bypass (~$0.02-0.05/session), post-session conversational feedback.

**UI**: Conversational onboarding (single chat flow), session screen (exercise cards, DONE, rest timer, chat), chat widget (tappable options + free text, pain in chat), exercise detail (3D stand-in), progress dashboard (streaks, progression bars), waveform (Siri-style).

**Data**: 44 progression levels, full exercise knowledge base.

## What's Left

- Supabase/Firebase backend (auth, sync)
- Eval dataset (50-100 golden coaching examples)
- End-to-end testing
- TestFlight deploy (early access, not beta)
