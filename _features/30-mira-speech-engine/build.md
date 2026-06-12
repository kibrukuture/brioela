# Mira Speech Engine — Build

Feature **30**. Production paths under `backend/src/agents/mira/mira-speech-decision/` (engine module) and `backend/src/agents/mira/_scenes/mira.scene.contract.ts` (shared types). **29** integrates the engine inside MiraSession; scene builders stay in `_scenes/` per owning feature.

**Depends on:** **29** MiraSession skeleton (integration host); **10** BrioelaIdentity (referenced in scene assembly, not imported by engine).  
**Blocks:** **29** speech integration acceptance; **42** `bela_shopper` scene speech policy; any scene using `proactive_when_useful`.

---

## Shipped today

| Area | Status |
|---|---|
| `MiraSpeechDecisionEngine` facade | ✗ |
| Six engine sub-modules | ✗ |
| `MiraScene` / `MiraSpeechPolicy` TypeScript types | ✗ |
| Engine unit tests | ✗ |
| MiraSession `speechEngine` wiring | ✗ (**29**) |
| JPEG downsample helper for visual detector | ✗ |

**Zero speech engine code.** `rg MiraSpeech backend/src` — no matches. `rg MiraScene backend/src` — no matches.

---

## File manifest

### Scene contract types (**30**)

| File | Role |
|---|---|
| `backend/src/agents/mira/_scenes/mira.scene.contract.ts` | `MiraSceneKind`, `MiraScene`, `MiraAudience`, `BrainContextSlice`, `MiraStimulusConfig`, `MiraCapability`, `MiraPrivacyBoundary`, `MiraSpeechPolicy`, `MiraExitPolicy` |
| `backend/src/agents/mira/_scenes/mira.scene.contract.schema.ts` | Zod validators for scene contract (optional but recommended) |

### Speech decision engine (**30**)

| File | Role |
|---|---|
| `backend/src/agents/mira/mira-speech-decision/index.ts` | `MiraSpeechDecisionEngine` facade, public types, barrel export |
| `backend/src/agents/mira/mira-speech-decision/silence-tracker.ts` | `SilenceTracker` — VAD-driven silence duration |
| `backend/src/agents/mira/mira-speech-decision/visual-change-detector.ts` | `VisualChangeDetector` — 16×16 frame diff, urgency signal |
| `backend/src/agents/mira/mira-speech-decision/adaptive-frequency.ts` | Phase intervals, modifiers, post-observation cooldown |
| `backend/src/agents/mira/mira-speech-decision/prompt-builder.ts` | `PromptBuilder` — urgent/advisory/milestone prompts |
| `backend/src/agents/mira/mira-speech-decision/response-filter.ts` | Silence phrases, urgency classify, `NoRepeatMemory` |
| `backend/src/agents/mira/mira-speech-decision/suppression-rules.ts` | Hard/soft blocks, rate limit, observation log |
| `backend/src/agents/mira/mira-speech-decision/types.ts` | `CookingPhase`, `ObservationRequest`, `ObservationResponse`, `FrameAnalysis`, `EngineState` |

### Shared helpers (**30** — may live adjacent)

| File | Role |
|---|---|
| `backend/src/agents/mira/_helpers/downsample-jpeg.helper.ts` | JPEG → 16×16 grayscale for visual detector (Workers-safe decode) |
| `backend/src/agents/mira/_helpers/compute-voice-activity.helper.ts` | PCM energy / lightweight VAD when SFU lacks metadata |

### Integration (**29** — not built in **30**, must wire)

| File | Role |
|---|---|
| `backend/src/agents/mira/mira-session.agent.ts` | Instantiate engine, 1 Hz tick, lifecycle hooks, audio discard |
| `backend/src/agents/mira/_scenes/build-cooking-scene.helper.ts` | Returns `MiraScene<CookingSituation>` — **29** owns builder |
| `backend/src/agents/mira/_helpers/build-system-instruction.helper.ts` | Human behaviors from `10-human-behaviors.md` — **29** |

### Tests (**30**)

| File | Role |
|---|---|
| `backend/src/agents/mira/mira-speech-decision/silence-tracker.test.ts` | Dead zone, consecutive silence, speech reset |
| `backend/src/agents/mira/mira-speech-decision/visual-change-detector.test.ts` | Score, urgency acceleration, stable detection |
| `backend/src/agents/mira/mira-speech-decision/adaptive-frequency.test.ts` | Phase base, modifiers, 8s floor |
| `backend/src/agents/mira/mira-speech-decision/response-filter.test.ts` | Silence phrases, urgent bypass no-repeat |
| `backend/src/agents/mira/mira-speech-decision/suppression-rules.test.ts` | Hard vs soft, rate limit, urgency bypass |
| `backend/src/agents/mira/mira-speech-decision/mira-speech-decision-engine.test.ts` | End-to-end tick + response cycle |

---

## Acceptance criteria

### MiraScene contract

- [ ] `MiraSceneKind` matches `build-guide/30-mira/01-scene-contract.md` (7 kinds)
- [ ] `MiraSpeechPolicy` fields exported with documented defaults for cooking
- [ ] `BrainContextSlice` constraint/memory/skills/recipes/health enums match scene contract doc
- [ ] Zod schema validates a minimal cooking scene fixture

### Silence tracker

- [ ] 10s post-speech dead zone before silence counts toward eligibility
- [ ] `getSilenceDurationMs()` accurate while user silent
- [ ] `isUserSpeaking()` hard-blocks tick path via suppression

### Visual change detector

- [ ] 16×16 grayscale diff; `changeScore` 0–100 normalized
- [ ] `urgencySignal` requires score > 60 AND accelerating last 3 frames
- [ ] `isStable()` true when rolling average < 10 over 10 frames
- [ ] No JPEG persistence — only 256-byte snapshots

### Adaptive frequency

- [ ] Phase base intervals: prep 20s, active 12s, simmering 60s, finishing 30s
- [ ] Modifiers stack per `03-adaptive-frequency.md`; floor 8s
- [ ] Post-observation cooldown: urgent 20s, advisory 30s, silent 10s
- [ ] Urgency visual signal bypasses interval (not hard blocks)

### Prompt builder

- [ ] Urgent prompt prefix `[URGENT KITCHEN CHECK]`
- [ ] Advisory prompt prefix `[KITCHEN OBSERVATION]` with timers, silence, phase
- [ ] Instructs Gemini to respond `ok` when nothing to say
- [ ] Appends `recentTopics` when non-empty

### Response filter

- [ ] Silent phrases discarded — no forward, no Gemini-spoke timer increment
- [ ] Urgent keyword classification; urgent bypasses no-repeat
- [ ] No-repeat window 3 minutes; topic keyword extraction
- [ ] Only applies to proactive observation turns (documented contract for **29**)

### Suppression rules

- [ ] Hard blocks: user speaking, Gemini speaking, non-active session, observation in flight
- [ ] Soft blocks: 25s post-Gemini, 10s post-user, 30s session start, 8 obs / 5 min
- [ ] Urgency bypasses soft blocks only
- [ ] `tick()` decision order matches `06-suppression-rules.md`

### Facade integration contract (**29** verifies)

- [ ] `onVideoFrame` called before unconditional Gemini JPEG forward
- [ ] `tick()` at 1 Hz from MiraSession schedule
- [ ] `onObservationResponse` drives `discardCurrentOutput` on mobile audio path
- [ ] Timer fire path does **not** use engine prompt builder
- [ ] `setPhase` receives mapped `CookingPhase` from situation context

### Boundaries (must not ship in **30** by mistake)

- [ ] No Gemini WebSocket code
- [ ] No SQLite reads/writes in engine
- [ ] No `buildSystemPrompt` / Brain prompt helpers (**15**)
- [ ] No `BrioelaIdentity` string content (**10**)
- [ ] No `buildCookingMiraScene` implementation (**29**)
- [ ] No Bela shopper prompts (**42**)

---

## Build order (within **30**)

1. `mira.scene.contract.ts` types + Zod
2. `types.ts` + `silence-tracker.ts` + tests
3. `downsample-jpeg.helper.ts` + `visual-change-detector.ts` + tests
4. `adaptive-frequency.ts` + `suppression-rules.ts` + tests
5. `prompt-builder.ts` + `response-filter.ts` + tests
6. `index.ts` facade + integration test
7. **29** wires into MiraSession

---

## Obsolete / misleading records

| Record | Issue |
|---|---|
| `build-guide/08-cooking-session/04-mira-speech-decision-engine.md` | Simplified algorithms — use implementable `mira-speech-decision-engine/` for thresholds |
| `_records/session-log/007-scanner-complete.md` | References `03-mira-speech-decision-engine.md` — file does not exist; actual file is `04-` |
| `implementable-specs/bela/14-shopper-ai-assistant.md` | Gemini embedded in BelaOrderAgent — conflicts with MiraSession + scene (**42**) |
| `brioela-specs/10-mira-cooking-voice.md` § Session Transport | Client-direct Gemini — superseded by DO architecture for speech engine host |
