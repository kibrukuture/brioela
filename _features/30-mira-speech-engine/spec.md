# Mira Speech Engine — Spec

Feature **30**. Reusable **MiraScene** contract types plus **MiraSpeechDecisionEngine** — the in-memory module that decides when Mira should proactively speak during a live Gemini session, what observation prompt to send, and whether Gemini's response should reach the audience.

**Not in this feature:** MiraSession DO transport, Gemini WebSocket bridge, SFU adapters, cooking timers, transcript writes, session end (**29-cooking-session**); `BrioelaIdentity` content (**10-brain-agent-identity**); Brain `buildSystemPrompt` and SQLite block assembly (**15-brain-system-prompt**); human-behavior **system-instruction** text assembly for cooking (**29** owns injection into Gemini setup); scene-specific situation builders (`buildCookingMiraScene`, `buildBelaShopperMiraScene`, etc. — owning features **29**, **42**, **28**, **25**, **44**, **45**); acoustic cooking prompt extensions (**39**); guard/lexicon/reading-gate tooling.

---

## Purpose

Gemini Live is reactive by default — it speaks when the user speaks. A cooking coach (and other Mira scenes) must watch, notice, and speak when something matters **without** being asked. The speech engine answers one question continuously:

**Should Mira speak right now, and if so, with what prompt?**

The engine does **not** talk to Gemini, write SQLite, or schedule timers. It produces `ObservationRequest | null` and classifies responses via `ObservationResponse`. **MiraSession** (or equivalent live runtime) acts on those decisions.

Without **30**, proactive presence is either missing or duplicated per scene. With **30**, cooking (**29**), Bela shopper (**42**), and future scenes share one speech policy module behind scene-specific prompt/context adapters.

---

## Complete module inventory

| # | Module | Type | Shipped? | Primary sources |
|---|---|---|:---:|---|
| 0 | **MiraScene contract** | Shared TypeScript types + Zod | No | `build-guide/30-mira/00-overview.md`, `01-scene-contract.md` |
| 1 | **Silence tracker** | Engine sub-module | No | `implementable-specs/cooking-session/mira-speech-decision-engine/01-silence-tracker.md` |
| 2 | **Visual change detector** | Engine sub-module | No | `02-visual-change-detector.md` |
| 3 | **Adaptive frequency** | Engine sub-module | No | `03-adaptive-frequency.md` |
| 4 | **Prompt builder** | Engine sub-module (speech-specific) | No | `04-prompt-builder.md` |
| 5 | **Response filter** | Engine sub-module | No | `05-response-filter.md` |
| 6 | **Suppression rules** | Engine sub-module | No | `06-suppression-rules.md` |
| 7 | **MiraSpeechDecisionEngine** | Facade class | No | `00-index.md`, `build-guide/08-cooking-session/04-mira-speech-decision-engine.md` |

**Shipped in backend today:** zero. `rg MiraSpeech backend/src` — no matches. No `MiraScene` types in TypeScript.

**Human behaviors** (`implementable-specs/cooking-session/10-human-behaviors.md`) are **not** part of the engine module — they live in Gemini `system_instruction` (**29** assembles). The engine **enforces** cooldowns, frequency, and no-repeat mechanics that reinforce those behaviors.

---

## Architecture

```text
Live stimuli (PCM VAD, JPEG frames, timer events, Gemini speech events)
        │
        ▼
MiraSpeechDecisionEngine (pure in-memory, no I/O)
        │
        ├── SilenceTracker          ← onVoiceActivity()
        ├── VisualChangeDetector    ← onVideoFrame()  [before unconditional Gemini forward]
        ├── AdaptiveFrequency       ← tick() interval math
        ├── SuppressionRules        ← hard/soft gates
        ├── PromptBuilder           ← ObservationRequest.prompt
        └── ResponseFilter          ← onObservationResponse() → forward/discard
        │
        ▼
ObservationRequest | null  ──► MiraSession sends client_content to Gemini
        │
        ▼
Gemini audio/text response ──► ResponseFilter ──► forward to mobile OR discard
```

**Tick rate:** MiraSession calls `tick()` every **1 second** (`00-index.md`). Most ticks return `null` — suppression and frequency gate the majority.

**State on DO eviction:** engine reinitializes clean. Worst case: brief period without visual history after cold start. Acceptable per `00-index.md`.

---

## Feature boundaries

| In **30** | In separate feature |
|---|---|
| `MiraScene`, `MiraSpeechPolicy`, `MiraSceneKind` types | `buildCookingMiraScene` implementation (**29**) |
| `MiraSpeechDecisionEngine` + six sub-modules | MiraSession DO class, wrangler binding (**29**) |
| Cooking-phase speech types (`CookingPhase`) | `CookingSituation` Zod + phase transition logic in DO (**29**) |
| Observation prompt templates (`[KITCHEN OBSERVATION]`, `[URGENT KITCHEN CHECK]`) | Full Gemini `system_instruction` + `BrioelaIdentity` block (**10**, **29**) |
| Response filter + no-repeat memory | Transcript persistence (**29** + **11**) |
| Scene-agnostic speech policy **types** | Bela shopper scene builder (**42**), menu bridge (**28**), etc. |

### vs **29** (Cooking session)

**29** owns MiraSession runtime: Gemini bridge, SFU, timers, transcript forward, `buildCookingMiraScene`, human-behavior system-instruction blocks, 1 Hz `tick()` integration, `discardCurrentGeminiAudio` wiring.

**30** owns the engine module and **MiraScene contract types**. **29** imports and instantiates `MiraSpeechDecisionEngine`; does not fork silence/visual/suppression logic inline.

### vs **10** (Brain agent identity)

**10** owns `BrioelaIdentity` — universal "who Brioela is." Mira scene assembly places identity as layer 1 of Gemini setup (**29**). **30** does not duplicate identity text.

Scene contract may require identity + scene-specific suffix; suffix assembly is **29**/scene-builder responsibility, not the speech engine.

### vs **15** (Brain system prompt)

**15** owns `buildSystemPrompt()` for **Claude** Brain sessions — SQLite blocks, prefix-cache order, session kinds.

**30** prompt builder produces **mid-session observation prompts** sent as Gemini `client_content` turns (`[KITCHEN OBSERVATION]`, `[URGENT KITCHEN CHECK]`). Different transport, different lifecycle, different purpose. Never merge into `buildSystemPrompt`.

### vs **42** (Bela)

**42** will use the same `MiraScene` contract with `kind: bela_shopper` and `speechPolicy` tuned for shopper-only audience. **30** ships types; **42** ships `buildBelaShopperMiraScene`. Bela implementable spec still embeds Gemini in BelaOrderAgent — **conflict** with MiraSession architecture; authoritative direction is `build-guide/30-mira/` + `build-guide/11-bela/14-shopper-ai-assistant.md` (MiraSession + scene).

---

## MiraScene contract

Authoritative: `build-guide/30-mira/01-scene-contract.md`.

### Core types

```typescript
type MiraSceneKind =
  | 'cooking'
  | 'bela_shopper'
  | 'menu_language_bridge'
  | 'recipe_review'
  | 'scan_followup'
  | 'kid_explanation'
  | 'kid_co_scan'

type MiraScene<TSituation = unknown> = {
  sceneId: string
  kind: MiraSceneKind
  audience: MiraAudience
  brainContext: BrainContextSlice
  situationContext: TSituation
  stimuli: MiraStimulusConfig
  capabilities: MiraCapability[]
  privacyBoundary: MiraPrivacyBoundary
  exitPolicy: MiraExitPolicy
  speechPolicy: MiraSpeechPolicy
}
```

### MiraSpeechPolicy

```typescript
type MiraSpeechPolicy = {
  defaultMode: 'answer_only' | 'proactive_when_useful' | 'translator_turns' | 'teaching_prompt'
  canInterrupt: boolean
  shouldAskClarifyingQuestions: boolean
  maxUtteranceSeconds: number
  silenceIsAllowed: boolean
}
```

**Cooking scene defaults** (`01-scene-contract.md`, **29** spec §3):

- `defaultMode: proactive_when_useful`
- `canInterrupt: true` (safety, timers)
- `silenceIsAllowed: true`

**Bela shopper** (`01-scene-contract.md`): brief, practical, shopper-only — `answer_only` or constrained proactive; **42** defines exact policy.

**Menu bridge**: `translator_turns`. **Kid scenes**: `teaching_prompt`.

The speech **engine** is primarily exercised when `defaultMode` includes proactive observation (`proactive_when_useful`). Other modes may use suppression + answer-only paths without full cooking visual pipeline.

### Situation context vs speech phase (cooking)

`MiraScene` situation (`CookingSituation`) uses feature-owned phases:

`prep` | `active_cooking` | `waiting` | `plating` | `done`

Speech engine uses `CookingPhase`:

`prep` | `active` | `simmering` | `finishing`

**MiraSession maps** situation → speech phase when calling `setPhase()`:

| CookingSituation.phase | CookingPhase |
|---|---|
| `prep` | `prep` |
| `active_cooking` | `active` |
| `waiting` | `simmering` |
| `plating` | `finishing` |
| `done` | `finishing` (minimal proactive checks) |

Phase transitions for speech (`03-adaptive-frequency.md`):

- `prep` → `active`: timer set OR user starts active cooking
- `active` → `simmering`: long timer (>5 min) AND visual stable
- `simmering` → `active`: timer fires
- `active` → `finishing`: user signals done / plating

Default if never set: `active` (over-vigilance preferred).

### Scene builder rule

Every feature that starts Mira owns a builder returning a complete `MiraScene` before session open. **30** owns types; **29**/`42`/etc. own builders.

---

## Public engine API

From `mira-speech-decision-engine/00-index.md` (authoritative over build-guide interface drift):

```typescript
export interface ProactiveSpeechConfig {
  sessionId: string
  userId: string
  userName: string
  cookingPhase: CookingPhase
  activeTimerLabels: string[]
}

export type CookingPhase = 'prep' | 'active' | 'simmering' | 'finishing'

export interface ObservationRequest {
  prompt: string
  urgency: 'urgent' | 'advisory'
  turnComplete: true
}

export interface ObservationResponse {
  forward: boolean
  urgency: 'urgent' | 'advisory' | 'silent'
  topic?: string
}

export class MiraSpeechDecisionEngine {
  onVoiceActivity(active: boolean): void
  onVideoFrame(jpegData: ArrayBuffer): void
  onGeminiSpeechStart(): void
  onGeminiSpeechEnd(): void
  onTimerFired(label: string): void
  tick(): ObservationRequest | null
  onObservationResponse(rawResponse: string): ObservationResponse
  setPhase(phase: CookingPhase): void
}
```

**MiraSession integration** (`00-index.md`, `03-gemini-session.md`):

1. `onVideoFrame` runs **before** unconditional Gemini JPEG forward
2. `tick()` at 1 Hz; non-null → send `client_content` with `turn_complete: true`
3. Track `pendingObservationRequest`; on Gemini text, call `onObservationResponse`
4. If `forward: false`, discard audio to mobile (`discardCurrentOutput` flag)
5. Timer fires: MiraSession injects timer alert directly — **not** via engine (`04-prompt-builder.md` milestone section)

---

## Module 1 — Silence tracker

**Source:** `01-silence-tracker.md`

**Input:** `onVoiceActivity(active: boolean)` after local VAD on PCM from SFU adapter. Public Realtime adapter docs do not guarantee VAD metadata — Brioela computes voice activity from PCM energy or lightweight VAD helper.

**State:**

- `silenceStartedAt`, `lastSpeechEndedAt`, `currentlyVoiceActive`, `consecutiveSilenceMs`

**Silence → eligibility** (feeds adaptive frequency; tracker does not decide to speak):

| Silence duration | Eligibility |
|---|---|
| 0–10s | Never — post-speech dead zone |
| 10–15s | Not yet — settling |
| 15s–60s | Eligible — normal proactive window |
| 60s+ | Eligible — reduced frequency (likely simmering) |
| User speaking | Hard block |

**Session start:** `silenceStartedAt: null` until first speech. Intro period naturally suppressed by frequent user speech — no special case.

---

## Module 2 — Visual change detector

**Source:** `02-visual-change-detector.md`

**Purpose:** Detect CHANGE, not understand scene. Gemini understands; detector gates frequency and urgency.

**Method:** JPEG → downsample 16×16 grayscale (256 bytes) → mean absolute difference vs previous frame → `changeScore` 0–100.

**Outputs (`FrameAnalysis`):**

- `changeScore` — magnitude of change
- `urgencySignal` — `changeScore > 60` AND accelerating trend (last 3 scores increasing)
- `stable` — `changeScore < 10`

**Score interpretation:**

| Score | Likely meaning | Engine response |
|---|---|---|
| 0–10 | Static | Reduce check frequency |
| 10–30 | Slow motion | Normal interval |
| 30–60 | Active cooking | Slightly increase frequency |
| 60–80 | Large change | Elevated — sooner check |
| 80–100 + accelerating | Smoke, flare, overflow | URGENT — immediate observation |

**Urgency bypass:** `urgencySignal: true` bypasses soft suppression and frequency interval. **Cannot** bypass: Gemini currently speaking (hard block).

**Stable kitchen:** average score < 10 over 10 frames → simmering signal for 60s base interval.

**Privacy:** only 256-byte snapshots in memory — no frame persistence.

---

## Module 3 — Adaptive frequency

**Source:** `03-adaptive-frequency.md`

**Purpose:** Minimum milliseconds between observation **eligibility** checks.

### Phase base intervals

| Phase | Base interval | Reasoning |
|---|---|---|
| `prep` | 20s | Moderate vigilance |
| `active` | 12s | Highest risk window |
| `simmering` | 60s | Low heat, stay quiet |
| `finishing` | 30s | Watch plating without interrupting |

### Dynamic modifiers (stack)

- Visual `changeScore > 40`: −4s; `> 70`: additional −4s
- Active timer: −5s
- Silence `> 60s`: −3s; `> 120s`: additional −3s
- Gemini spoke within 60s: `+ (60_000 - msSinceGeminiSpoke)` backoff
- **Hard floor:** 8s minimum between checks

### Urgency override

Visual `urgencySignal` bypasses interval entirely (still subject to hard suppression).

### Post-observation cooldown

| Last observation type | Cooldown |
|---|---|
| Urgent | 20s |
| Advisory | 30s |
| Silent (filtered "ok") | 10s |

---

## Module 4 — Prompt builder (speech-specific)

**Source:** `04-prompt-builder.md`

**Not** `buildSystemPrompt` (**15**). These are ephemeral `client_content` turns.

### Urgent prompt

Prefix `[URGENT KITCHEN CHECK]`. Instructs Gemini to look now, speak directly on danger (smoke, burning, overflow, fire), reassure briefly if false alarm.

### Advisory prompt

Prefix `[KITCHEN OBSERVATION]`. Includes:

- Active timers with remaining seconds
- Silence duration (minutes or seconds)
- Phase hint
- Instruction: say something useful OR respond with exactly `ok`
- `recentTopics` enrichment from response filter when non-empty

### "ok" silence signal

Gemini cannot produce zero output on `turn_complete: true`. `ok` is the contracted silence token. Response filter also catches variants (`okay`, `looks good`, `everything looks fine`, etc.).

### Milestone prompts

`[MILESTONE CHECK]` for long quiet + sudden visual change. Timer fire milestones handled by **MiraSession** directly (`06-timers.md`), not engine.

### ObservationContext

```typescript
interface ObservationContext {
  userName: string
  phase: CookingPhase
  silenceMs: number
  activeTimers: Array<{ label: string; remainingSeconds: number }>
  recentTopics: string[]
}
```

---

## Module 5 — Response filter

**Source:** `05-response-filter.md`

**Scope:** Proactive observation responses only — **not** user-initiated turns or timer-fire injections.

### Silence detection

Normalized phrase list (`ok`, `okay`, `everything looks fine`, `looks good`, `nothing to report`, `carry on`, etc.). Silent → `forward: false`, `urgency: 'silent'`; does **not** increment Gemini-spoke timer.

### Urgency classification

Keyword patterns: smoke, burning, fire, overflow, boiling over, too hot, immediately, carefully, etc. → `urgent` vs `advisory`.

**Urgent:** deliver immediately (interrupt mobile playback). **Advisory:** normal queue.

### No-repeat memory

- `TopicEntry`: extracted keyword, timestamp, response prefix
- Window: 3 minutes, max 20 entries
- Topic extraction: simple cooking noun keyword list
- **Urgent responses bypass** no-repeat check
- Advisory repeat → discard as silent

### Audio discard

MiraSession sets `discardCurrentOutput` when `forward: false`; reset on `turn_complete`.

---

## Module 6 — Suppression rules

**Source:** `06-suppression-rules.md`

### Hard blocks (never bypass, including urgency)

1. User currently speaking
2. Gemini currently speaking (audio streaming)
3. Session status ≠ `active` (reconnecting, ending)
4. `pendingObservationRequest !== null` (one observation in flight)

### Soft blocks (urgency bypasses)

1. Gemini spoke within **25s** (`gemini_spoke_recently`)
2. User spoke within **10s** (`user_spoke_recently`)
3. Session age < **30s** (`session_just_started`)
4. ≥ **8** observations in last **5 minutes** (`rate_limit`)

### tick() decision order

1. Hard block → `null`
2. `urgencySignal` → urgent prompt (if not hard blocked)
3. Soft block → `null` (advisory path only)
4. Frequency interval not elapsed → `null`
5. Advisory prompt

**Human behavior link:** 25s post-Gemini-speech cooldown listed in `10-human-behaviors.md` §4 — enforced here, not in system instruction alone.

---

## Proactive speech session economics

From `03-gemini-session.md`: engine suppresses most ticks. A 45-minute cooking session targets **10–20** proactive observations, each earning its place.

---

## Cross-scene reuse (future)

v1 engine implementation is **cooking-tuned** (kitchen prompts, `CookingPhase`, visual JPEG pipeline). **30** types (`MiraScene`, `MiraSpeechPolicy`) are scene-agnostic.

Future scenes may:

- Swap prompt builder strategies per `MiraSceneKind`
- Disable visual detector when `stimuli.video.enabled === false`
- Tighten suppression for `translator_turns` / `teaching_prompt`

Ship cooking path first; extract scene strategy interface when **42** integrates.

---

## Conflicts and authoritative choices

| Topic | Stale / conflicting sources | **30** choice |
|---|---|---|
| Engine algorithms | `build-guide/08-cooking-session/04-mira-speech-decision-engine.md` uses different thresholds (0.15 change score, 3s cooldown, 8s min silence, single `isSuppressed`) | **`implementable-specs/cooking-session/mira-speech-decision-engine/`** — 0–100 score, hard/soft tiers, 25s Gemini cooldown, 8s frequency floor |
| Public API shape | build-guide `tick(phase, labels)` + `classifyResponse()` | **`00-index.md`** — `setPhase()`, `tick()`, `onObservationResponse()`, lifecycle hooks |
| File path in build-guide | `backend/src/agents/cooking/mira-speech-decision/` | **`backend/src/agents/mira/mira-speech-decision/`** per **29** build manifest |
| Client-direct Gemini | `brioela-specs/10-mira-cooking-voice.md` § Session Transport | **DO-proxied Gemini** per `08-cooking-session/00-overview.md` — speech engine runs in DO |
| Bela shopper runtime | `implementable-specs/bela/14-shopper-ai-assistant.md` Gemini in BelaOrderAgent | **MiraSession + `bela_shopper` scene** per `build-guide/30-mira/`, `11-bela/14-shopper-ai-assistant.md` |
| Cooking phase enum | `MiraScene` `active_cooking`/`waiting` vs engine `active`/`simmering` | **Mapping table above** — situation owned by **29**, speech phase owned by **30** |
| Agent does not speak first | `brioela-specs/10` UX — waits after start | Compatible — 30s soft block `session_just_started` + user-led intro; engine does not trigger first utterance |
| Acoustic interventions | `brioela-specs/10` § Acoustic Awareness, **46** | **39** extends system instruction; silence rules in **30** govern acoustic-triggered speech when wired |

---

## Sources (read for this migration)

### implementable-specs/cooking-session/mira-speech-decision-engine/

`00-index.md`, `01-silence-tracker.md`, `02-visual-change-detector.md`, `03-adaptive-frequency.md`, `04-prompt-builder.md`, `05-response-filter.md`, `06-suppression-rules.md`

### implementable-specs/cooking-session/

`03-gemini-session.md` (proactive speech mechanism), `10-human-behaviors.md`

### build-guide/

`30-mira/00-overview.md`, `30-mira/01-scene-contract.md`, `08-cooking-session/04-mira-speech-decision-engine.md`, `08-cooking-session/02-mira-session-do.md`, `08-cooking-session/03-gemini-live-session.md`

### brioela-specs/

`10-mira-cooking-voice.md`, `11-live-vision-cooking-coach.md`

### _features/ (boundaries)

`29-cooking-session/spec.md`, `10-brain-agent-identity/spec.md`, `15-brain-system-prompt/spec.md`, `12-brain-sub-agents/spec.md`

### _records/

`connections/03-cooking-session-connections.md`, `inventory/inventory.md`, `session-log/008-cooking-session-record-reconciliation.md`

### Production (grep audit)

`backend/src` — no `MiraSpeech`, `MiraScene`, or `mira-speech-decision` paths
