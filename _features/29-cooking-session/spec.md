# Cooking Session — Spec

Feature **29**. Live cooking runtime: **MiraSession** Agent-backed Durable Object, Cloudflare RealtimeKit room + Realtime SFU track adapters, **Gemini 3.1 Flash Live** duplex audio/vision, cooking-scene tool forwarding to **BrioelaBrain**, Agents SDK cooking timers, transcript persistence, proactive speech orchestration (engine module owned by **30**), session end with recipe decision tree and `outcome_summary`.

**Not in this feature:** Mira speech engine sub-modules as a standalone deliverable (**30-mira-speech-engine**); generic `MiraScene` contract and non-cooking scene builders (**30**, **42**, **28**, **25**, **44**, **45**); Brain Claude chat turn loop (**20**); session open/close handler bodies (**11**); recipe CRUD tools (**08** — Mira calls them via RPC; session-end **create** is direct insert path); alarm dispatch router (**14**); acoustic cooking prompt/schema extensions (**39**); Ground find→cook ambient card (**27**); Bela standing-order shopper scene (**42**); guard/lexicon/reading-gate tooling.

---

## Purpose

Cooking is Brioela's flagship live presence moment: hands-free voice, optional camera, real timers, durable family recipe capture. One **session-scoped** MiraSession DO orchestrates media transport, Gemini Live, tool execution, and end-of-session reconstruction. Permanent user truth stays in Brain SQLite; Mira forwards writes through typed Brain RPC.

Without **29**, the product has Brain memory and recipe schemas but no live kitchen companion.

---

## Complete component inventory

> **Living inventory.** MiraSession is one class, many scenes (**30**). Feature **29** ships the **cooking** scene path first; other scenes reuse the same DO class with different `MiraScene` builders.

| Component | Type | Feature | Shipped? | Primary sources |
|---|---|---|:---:|---|
| **MiraSession** | Agent-backed ephemeral DO | **29** (+ **30** scenes) | No | `build-guide/08-cooking-session/02-mira-session-do.md` |
| **Cooking `MiraScene` builder** | Scene injection | **29** | No | `build-guide/30-mira/01-scene-contract.md` |
| **Brain `startCookingSession`** | Brain handler + Hono route | **29** | No | `build-guide/08-cooking-session/01-room-lifecycle.md` |
| **RealtimeKit Meeting** | WebRTC room (send A/V) | **29** | No | `implementable-specs/cooking-session/01-room-lifecycle.md` |
| **Realtime SFU track adapters** | PCM + JPEG → DO WebSocket | **29** | No | same |
| **Gemini Live bridge** | `wss` BidiGenerateContent | **29** | No | `03-gemini-session.md`, `03-gemini-live-session.md` |
| **Video frame pipeline** | JPEG `client_content` @ ~1 FPS | **29** | No | `05-video-processing.md` |
| **Cooking tool declarations** | Gemini `function_declarations` | **29** | No | `04-tool-protocol.md` |
| **Brain tool forward RPC** | Typed RPC from Mira → Brain | **29** + **04** hardening | No | `02-mira-session-do.md`, `07-agent-framework-hardening.md` |
| **Cooking timers** | Agents SDK `schedule()` + local SQLite | **29** | No | `build-guide/08-cooking-session/05-timers.md` |
| **Brain timer audit mirror** | `scheduled_alarms` row (non-authoritative) | **29** → **09** | No | `05-timers.md`, **14** G17 |
| **Transcript writer** | `session_turns` via Brain RPC | **29** + **11** | No | `07-transcript-storage.md` |
| **Gemini proactive reconnect** | 90s session chaining | **29** | No | `09-reconnection.md` |
| **Mobile audio-out WebSocket** | Gemini PCM → mobile speaker | **29** | No | `02-mira-session.md` |
| **Session end + recipe tree** | LLM decision + direct recipe insert | **29** + **08** | No | `08-session-end.md`, `09-recipes.md` |
| **Human behavior prompts** | System-instruction blocks | **29** | No | `10-human-behaviors.md` |
| **MiraSpeechDecisionEngine** | In-DO module (speak/when) | **30** (used by **29**) | No | `mira-speech-decision-engine/` |
| **Multi-person room** | RealtimeKit N participants | **29** (partial v1) | No | `brioela-specs/12-multi-person-cooking-rooms.md` |
| **Acoustic cooking** | Prompt + `sound_cue` on recipe steps | **39** | No | `build-guide/33-acoustic-cooking/` |
| **Mobile cooking UI** | RealtimeKit join + audio WS + controls | **29** | No | `01-room-lifecycle.md` |
| **Generational / Heirloom capture** | Session-end reconstruction semantics | **29** + **49** | No | `brioela-specs/13-generational-recipe-capture.md` |

**Shipped in backend today:** `sessions` / `session_turns` schemas with `session_type: cooking` (**04**). No `MiraSession` class, no `MIRA_SESSION` wrangler binding in production worker, no cooking API routes, no mobile cooking feature.

---

## Architecture

```text
Mobile (RealtimeKit SDK + audio WebSocket)
    │
    ├── WebRTC ──────────────► RealtimeKit Meeting / Realtime SFU
    │   (mic + camera)              │
    │                               │ SFU track WebSocket adapters (per track)
    │                               ▼
    │                      MiraSession DO  idFromName(`cooking:${sessionId}`)
    │                               │
    │                               ├── WebSocket ──► Gemini 3.1 Flash Live
    │                               │                 (audio in, JPEG client_content, audio out)
    │                               │
    │                               ├── Agents SDK schedule() ──► fireCookingTimer
    │                               │
    │                               ├── MiraSpeechDecisionEngine.tick() (1 Hz)
    │                               │
    │                               └── typed Brain RPC ──► BrioelaBrain
    │                                     (memory, constraints, recipes, session_turns, finalize)
    │
    └── WebSocket ───────────► MiraSession /audio  (Gemini voice → mobile)
```

**Two mobile connections:** WebRTC send-only path (RealtimeKit handles echo cancellation, codecs); separate WebSocket for Gemini audio playback (no WebRTC on receive).

**Authoritative implementation direction:** `build-guide/08-cooking-session/` over older implementable-spec snippets where they conflict (Agent class vs raw DO, Agents SDK schedules vs raw `setAlarm`, SFU protobuf `Packet` vs JSON metadata).

---

## Brain vs Mira split

| Concern | BrioelaBrain | MiraSession |
|---|---|---|
| Scope | Permanent per-user DO | Ephemeral per cooking session DO |
| Model | Claude via AI SDK (**20**) | Gemini Live WebSocket |
| Session row | Brain opens `cooking` row at start; Mira/Brain finalize at end | Participates in dual-writer pattern (**11** G22) |
| Tool surface | Full `getBrainTools` per `SessionKind` | Six Gemini declarations; subset forwarded |
| Turn storage | `appendSessionTurn` for chat/alarm | Fire-and-forget forward to Brain for cooking turns |
| System prompt | `buildSystemPrompt` (**15**) | `buildSystemInstruction(context)` + cooking scene (**29**) |
| Timers | Audit mirror in `scheduled_alarms` optional | **Authoritative** fire via Agents SDK + Gemini inject |
| Compression | Before each Brain chat turn (**13**) | Product rule: honor same thresholds before Gemini turns |
| Entry | `chat()` / `onMessage` (**20**) | `/init`, `/stream/audio`, `/stream/video`, `/audio` |
| Local SQLite | User brain tables | `cooking_session_runtime`, `cooking_timers` only |

**Rule:** Mira never imports Brain `_schemas/` directly. Permanent writes use typed Brain RPC (`writeBrainMemory`, `forwardToolCall`, `finalizeCookingSession`, etc.) per `build-guide/05-brain/07-agent-framework-hardening.md`.

---

## Feature boundaries

| In **29** | In separate feature |
|---|---|
| MiraSession DO class + wrangler `MIRA_SESSION` binding | MiraSpeechDecisionEngine module polish (**30**) |
| Cooking scene builder + `MiraSceneKind: cooking` | `bela_shopper`, `menu_language_bridge`, etc. (**42**, **28**, **25**, **44**, **45**) |
| Gemini Live cooking transport + reconnect | Brain Claude chat (**20**) |
| Cooking tool declarations + forward map | Tool executable implementations (**05–08**) |
| Timer schedule/fire/cancel in Mira | `schedule_user_alarm` tool + wake slot (**09**); dispatch noop audit (**14**) |
| Session-end recipe decision + direct insert | `view/update/archive_user_recipe` tools (**08**); normalization (**25**) |
| Transcript + outcome_summary for cooking | `openSession`/`closeSession` contracts (**11**) |
| RealtimeKit room for cooking | Acoustic prompt + `sound_cue` schema (**39**) |
| Human-behavior system-instruction blocks | Full suppression/frequency tuning tests (**30**) |
| Multi-person room (v1: spec'd, optional ship wave) | Ground find→cook trigger UI (**27**) |

### vs **20** (Brain chat runtime)

**20** owns the Brain inline `streamText`/`generateText` loop. **29** owns Gemini Live turn semantics. Both must respect `sessions`/`session_turns` contracts and compression thresholds. Mira calls Brain RPC — not the chat entrypoint.

### vs **30** (Mira speech engine)

**30** owns reusable `MiraScene` contract, speech policy types, and `MiraSpeechDecisionEngine` as a product module. **29** integrates the engine inside the cooking DO and owns cooking-specific system-instruction blocks (`10-human-behaviors.md`). Cooking ships first; **30** extracts shared speech engine for other scenes.

### vs **08** (Brain recipe tools)

No `create_user_recipe` tool. Session end runs decision tree (`09-recipes.md`) then **direct insert** or `update_user_recipe` / `increment cook_count` via Brain RPC. Origin `cooking_session`; `session_id` FK on recipe row.

### vs **39** (Acoustic cooking)

**39** adds acoustic awareness to the **same** Gemini Live audio stream — no new pipeline. **29** owns session instruction assembly hook point; **39** owns prompt extension + optional `sound_cue` on recipe steps + `evidence_source` on intervention events. **29** must not implement acoustic taxonomy until **39** spec is wired.

---

## 1. Room lifecycle (RealtimeKit + SFU)

**Trigger:** User taps start cooking (or accepts Ground/Bela/Encore deep link — see cross-refs).

**Brain `startCookingSession` sequence:**

1. `sessionId = crypto.randomUUID()`
2. RealtimeKit `POST /meetings` → `meetingId`
3. RealtimeKit `POST /meetings/{id}/participants` → `participantToken`
4. `MIRA_SESSION.idFromName(\`cooking:${sessionId}\`)` → `POST /init` with `{ sessionId, userId, meetingId }`
5. Insert `sessions` row: `session_type: cooking`, `status: active`, `model: gemini-3.1-flash-live-preview`
6. `agent_state.active_session_id = sessionId` (per-user guard — **11**)
7. After mobile publishes tracks: attach SFU WebSocket adapters per track (`outputCodec: pcm | jpeg`)
8. Return `{ sessionId, meetingId, participantToken, doAudioEndpoint }`

**Teardown (session end):** kick-all active RealtimeKit session, PATCH meeting `INACTIVE`, delete SFU adapters by stored `adapterId`.

**Env vars:** `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `REALTIMEKIT_APP_ID`, `REALTIME_SFU_APP_ID`, `REALTIME_SFU_APP_SECRET`, `WORKER_WS_BASE_URL`, `GEMINI_API_KEY`.

**Multi-person (**12**):** same Meeting; multiple participants; Mira merges per-participant Brain constraint slices at scene build. v1 may ship single-user first — multi-person remains spec-complete but optional in acceptance wave 1.

---

## 2. MiraSession Durable Object

**DO ID:** `env.MIRA_SESSION.idFromName(\`cooking:${sessionId}\`)`

**Class:** `MiraSession extends Agent<Env>` — `backend/src/agents/mira/mira-session.agent.ts`

**Endpoints:**

| Path | Role |
|---|---|
| `POST /init` | Bootstrap state, local recovery row, pre-warm Gemini |
| `WS /stream/audio` | SFU adapter PCM ingress |
| `WS /stream/video` | SFU adapter JPEG ingress |
| `WS /audio` | Mobile Gemini audio egress |
| Scheduled `fireCookingTimer` | Timer fire callback (Agents SDK) |
| Scheduled `handleMobileDisconnectDeadline` | 5-minute mobile reconnect timeout |

**In-memory state:** `sessionId`, `userId`, `meetingId`, Gemini/mobile/realtime WebSockets, `status`, `turnCounter`, `pendingToolCall`, `activeTimers` map.

**Local Agent SQLite (recovery only):**

- `cooking_session_runtime` — `{ session_id, user_id, meeting_id, status, mobile_disconnect_deadline, updated_at }`
- `cooking_timers` — `{ id, session_id, label, fires_at, status, sdk_schedule_id, fired_at, cancelled_at }`

**Recovery:** Cold start on any non-`/init` request reads `cooking_session_runtime`, rebuilds timers, reloads Brain context + last 20 transcript turns, reopens Gemini.

**Hibernation:** WebSocket handlers use `ctx.acceptWebSocket` + `webSocketMessage` per `build-guide/02-coding-standards/06-backend-do-agent-patterns.md`.

---

## 3. Cooking scene (`MiraSceneKind: cooking`)

Built before `/init` completes (Brain or shared helper). **30** owns the type contract; **29** owns `buildCookingMiraScene`.

**Brain context slice (cooking):**

- `constraints: food_relevant` (hard allergies required)
- `memory: session_relevant` + cooking namespaces
- `skills: scene_relevant`
- `recipes: active_recipe` when user selected a recipe
- `health: active_condition_food_rules` when applicable

**Situation context (`CookingSituation`):**

- `recipeId`, `phase` (`prep` | `active_cooking` | `waiting` | `plating` | `done`), `activeStepId`, `timers[]`

**Capabilities (cooking):** `schedule_timer`, `cancel_timer` (mira_session); `write_memory`, `propose_constraint`, `view_recipe`, `write_session_note` (brain forward).

**Privacy:** `transcriptStorage: turns_allowed`; `rawAudioStorage/rawVideoStorage: never`.

**Speech policy:** `proactive_when_useful`, `canInterrupt: true` for safety/timers, `silenceIsAllowed: true`.

**Not cooking scenes:** `menu_language_bridge` (**26**/**28**), `bela_shopper` (**42**), `recipe_review` (**25**) — same MiraSession class, different builders.

---

## 4. Gemini Live session

**Model:** `gemini-3.1-flash-live-preview` (Preview). Endpoint: `wss://generativelanguage.googleapis.com/ws/.../BidiGenerateContent`.

**Setup message:**

- `response_modalities`: **`['AUDIO', 'TEXT']`** per `07-transcript-storage.md` (full family transcript for recipe reconstruction). Reconcile with build-guide `03-gemini-live-session.md` showing `AUDIO` only — **prefer implementable 07 for cooking**.
- Voice: `Charon`
- `system_instruction`: scene-built instruction (identity, constraints, memory, skills, session context, human behaviors)
- `tools`: `COOKING_TOOL_DECLARATIONS`

**Audio path:** SFU PCM 48kHz → base64 `realtime_input.audio` → Gemini.

**Video path:** JPEG via `client_content` + `inline_data`, `turn_complete: false` — **not** `realtime_input.video` (2-minute cap).

**BLOCKING tools:** Gemini pauses audio until `tool_response`. Target &lt;200ms for direct tools.

**Proactive reconnect:** every **90s** while `active`; inject last **20** transcript turns into new system instruction; drain pending timer fires after reconnect.

**Emergency reconnect:** up to 3 attempts with backoff; else `endSession('error')`.

**First-turn latency:** pre-warm Gemini on `/init` before mobile join. Production validation required (~3s cold vs ~500ms warm per spec).

---

## 5. Video frame processing

- Adapter delivers ~1 FPS JPEG (640px, quality ~70).
- DO rate-limits to ≥900ms between forwards.
- Frames are **transient** — never stored.
- During `gemini_reconnecting` / non-`active`: drop frames.
- Visual-change detector (**30** engine) receives frames **before** unconditional Gemini forward.

---

## 6. Tool protocol

**Gemini declarations (cooking only):**

| Gemini name | Route | Brain mapping |
|---|---|---|
| `schedule_timer` | Mira direct | optional audit → `schedule_user_alarm` |
| `cancel_timer` | Mira direct | optional audit → `cancel_user_alarm` |
| `write_session_note` | Brain forward | `log_memory_event` (enriched with `session_id`) |
| `write_memory` | Brain forward | `write_user_memory` |
| `propose_constraint` | Brain forward | `propose_user_constraint` |
| `view_recipe` | Brain forward | `view_user_recipe` |

**Internal Brain RPC endpoints (target):** typed `@callable()` methods on `BrioelaBrain` — not raw `fetch('/internal/tool-call')` in production (hardening **04** / ledger framework).

**Permissions:** Cooking tools cannot delete rows, confirm constraints, or touch other users. Brain enforces `TOOL_PERMISSIONS` at execution.

**Out of scope for Gemini surface:** `search_web` (**18** — chat only per ledger `0007.web-tool.md`); alarm types beyond cooking timers; skill CRUD.

---

## 7. Cooking timers

**Authority:** MiraSession Agents SDK `schedule(new Date(firesAt), 'fireCookingTimer', { timerId }, { idempotent: true })`.

**Rules:**

- Unique label per session; 1s–4h duration
- One SDK schedule per timer; `sdk_schedule_id` stored for cancel
- Fire handler: idempotent status check → inject `[TIMER FIRED: "{label}" is done]` as `client_content` with `turn_complete: true`
- Queue fires during `gemini_reconnecting`; drain on resume
- Session end: `cancelAllTimers`

**Brain audit mirror (optional, fire-and-forget):** `waitUntil(forwardToolToBrain('schedule_user_alarm', …))` with `alarm_type: cooking_timer`. Brain does **not** fire the timer (**14** audit handler noop). **Payload must align with 09 tool schema** — see conflicts.

**vs 09:** Brain `schedule_user_alarm` owns Path A alarms for chat/background. Cooking timer fire is **not** Brain alarm dispatch.

---

## 8. Transcript storage

**Table:** `session_turns` (same as chat).

**Writer:** Mira forwards `write_session_turn` to Brain with monotonic `turn_number` from `agent_state.turn_counter.{sessionId}`.

**Turn triggers:**

- Gemini `turn_complete` (model role)
- `input_transcription` when available (user role)
- System events: session start/end, timer set/fired/cancelled, Gemini reconnect

**Fire-and-forget:** turn writes must not block audio; failures log `agent_state` diagnostic keys.

**Not stored:** raw audio, video frames, per-chunk Gemini audio.

**Compression:** long cooking sessions may chain via `parent_session_id` (**13**) — Mira must call Brain compression RPC when thresholds hit (same numbers as **11**/`17-session-lifecycle.md`: cooking turn threshold **80**, token budget **100,000**).

---

## 9. Reconnection

| Type | Trigger | User impact |
|---|---|---|
| Proactive Gemini | 90s timer | ~1s pause |
| Emergency Gemini | unexpected WS close | 1–7s, max 3 attempts |
| Mobile audio WS | network drop | miss audio during gap; Gemini keeps running |
| Mobile WebRTC | RealtimeKit SDK auto-reconnect | SFU resumes frames |
| DO eviction | CF eviction | recover from local SQLite + Brain transcript |

**Statuses (distinct):** `mobile_reconnecting` ≠ `gemini_reconnecting` — do not collapse.

**Mobile disconnect deadline:** durable `schedule()` at +5min; not `setTimeout` (lost on eviction).

---

## 10. Session end + recipe decision

**End reasons:** `user_ended` | `mobile_disconnected` | `timeout` (90 min inactivity) | `error`

**Sequence:** system event → close Gemini → cancel reconnect timer → cancel timers → close SFU adapters + RealtimeKit → close mobile WS → `runFiber` end processing → Brain `finalize_session` → clear `turn_counter` + `active_session_id`.

**Recipe decision tree** (`09-recipes.md` / `08-session-end.md`):

```text
1. Did session involve cooking something specific? → No: skip recipe; note in outcome_summary.
2. Existing recipe for dish? → increment cook_count | update_user_recipe | new variant (agent judgment).
3. Transcript complete enough? → No: flag incomplete.
4. New recipe with enough signal? → recipe-reconstruction skill → direct insert (origin: cooking_session).
```

**Aborted:** `error` with &lt;3 turns → minimal `outcome_summary`, no reconstruction.

**Outcome summary JSON** on `sessions.outcome_summary`: `completed`, `end_reason`, `recipe_action`, `recipe_id`, `session_notes`, `duration_turns`, `timers_used`, `tools_called`.

**Heirloom / generational capture (**13**, **49**): same reconstruction path; cultural notes in `NormalizedRecipeContent`; uncertain fields marked with confidence — not separate pipeline.

**Grandma style profile (**32**): post-session extraction is **49**/**32** consumer of transcript — not **29** core path.

---

## 11. Human behaviors (cooking instruction)

Encoded in Gemini `system_instruction` + reinforced by speech engine (**30**):

- When **not** to respond (self-narration, multi-human side talk)
- Adaptive verbosity (quieter as cook finds rhythm)
- Phase awareness: prep / active / simmering / finishing
- Milestone acknowledgment (brief, specific)
- No empty observation / no narration of obvious
- Emergency directness (smoke, fire risk)
- No repeat within session
- Emotional calibration from voice tone

Full text: `implementable-specs/cooking-session/10-human-behaviors.md`.

---

## 12. MiraSpeechDecisionEngine (integration)

**Owner:** **30** module; **29** integrates at 1 Hz `tick()`.

Produces `ObservationRequest | null` → Mira sends `client_content` observation prompt → response filter discards `"ok"` / silent responses.

Sub-components: silence tracker, visual change detector, adaptive frequency, prompt builder, response filter, suppression rules (25s post-Gemini-speech cooldown hard rule).

**Does not:** talk to Gemini directly, write SQLite, schedule timers.

---

## 13. API + mobile surfaces

**HTTP (target):**

- `POST /api/cooking/start` → Brain `startCookingSession`
- `POST /api/cooking/end` → Brain or Mira end signal
- `GET /internal/cooking-stream/:sessionId/:mediaKind` → Worker upgrade to Mira DO
- `GET /cooking/:sessionId/audio` → mobile audio WS (signed token)

**Mobile:**

- RealtimeKit join with `participantToken`
- Audio WS to `doAudioEndpoint`
- End button + voice "we're done"
- Optional vision toggle (tier gate per **11-live-vision**)
- Reconnect loop with exponential backoff (max 5 min)

---

## 14. `agent_state` keys (cooking)

| Key | Writer | Purpose |
|---|---|---|
| `turn_counter.{sessionId}` | Mira | Monotonic turn numbers |
| `active_session_id` | Brain at start | Active session guard |
| `cooking.gemini_reconnect.{sessionId}` | Mira | Reconnect audit |
| `stream.disconnect.{sessionId}` | Mira | SFU adapter drop |
| `cooking.tool_failure.{sessionId}` | Mira | Tool failure diagnostic |

---

## Cross-feature triggers (consumers / entry)

| Source | Behavior | Owner |
|---|---|---|
| Ground find match | Ambient card → "Start cooking session" | **27** trigger, **29** session |
| Encore first-cook refinement | May open cooking with active recipe | **48** |
| Recipe ingestion low confidence | `recipe_review` Mira scene, not cooking | **25** |
| Bela standing order / shopper | `bela_shopper` scene | **42** |
| Menu language bridge | `menu_language_bridge` scene | **26**/**28** |
| Medical condition food rules | Injected in cooking Brain context slice | **23**/**22** |
| Tonight dinner answer | May deep-link to cook | **54** |

---

## Conflicts and authoritative choices

| Topic | Stale / conflicting sources | **29** choice |
|---|---|---|
| Timer mechanism | `implementable-specs/06-timers.md` raw DO `setAlarm` | **Agents SDK `schedule()`** per build-guide `05-timers.md` |
| Response modalities | build-guide `03-gemini-live-session.md` AUDIO only | **AUDIO + TEXT** per `07-transcript-storage.md` |
| Tool forward transport | implementable `fetch('/internal/tool-call')` | **Typed Brain RPC** per `07-agent-framework-hardening.md` |
| File path | build-guide file tree mixes `cooking/` and `mira/` | **`backend/src/agents/mira/`** class; cooking handlers subfolder |
| Single-user transport | `brioela-specs/10` client-direct Gemini WS | **DO-proxied Gemini** per `00-overview.md` architecture |
| Session row creator | `07-sessions.md` dual writer | **Brain inserts at start**; Mira updates via finalize RPC |
| Timer audit payload | `alarm_id`/`fires_at` in cooking spec | Align with **09** `scheduled_at` + standard payload or drop mirror |
| `recall_check` / web search | N/A in cooking | Excluded from cooking Gemini tools |
| Session log `008` "complete" | Records say build-guide complete | **Docs only** — zero production Mira code |

---

## Sources (read for this migration)

### implementable-specs/cooking-session/

`00-overview.md`, `01-room-lifecycle.md`, `02-mira-session.md`, `03-gemini-session.md`, `04-tool-protocol.md`, `05-video-processing.md`, `06-timers.md`, `07-transcript-storage.md`, `08-session-end.md`, `09-reconnection.md`, `10-human-behaviors.md`, `mira-speech-decision-engine/00-index.md`, `01-silence-tracker.md`, `02-visual-change-detector.md`, `03-adaptive-frequency.md`, `04-prompt-builder.md`, `05-response-filter.md`, `06-suppression-rules.md`

### build-guide/

`08-cooking-session/00-overview.md` through `06-session-end-and-recipe.md`, `30-mira/00-overview.md`, `30-mira/01-scene-contract.md`, `05-brain/01-do-class-and-setup.md`, `05-brain/07-agent-framework-hardening.md`, `02-coding-standards/06-backend-do-agent-patterns.md`, `33-acoustic-cooking/00-overview.md`, `09-ground/06-find-to-cooking-trigger.md`

### brioela-specs/

`10-mira-cooking-voice.md`, `11-live-vision-cooking-coach.md`, `12-multi-person-cooking-rooms.md`, `13-generational-recipe-capture.md`, `32-grandma-style-flavor-profile.md`, `46-acoustic-cooking-intelligence.md`

### implementable-specs (cross)

`07-sessions.md`, `08-session-turns.md`, `09-recipes.md`

### _features/ (pattern + boundaries)

`12-brain-sub-agents/spec.md`, `20-brain-chat-runtime/spec.md`, `08-brain-recipe-tools/spec.md`, `09-brain-alarm-tools/spec.md`, `11-brain-sessions-lifecycle/status.md`

### _records/

`connections/03-cooking-session-connections.md`, `build-order/06-layer-cooking-session.md`, `session-log/008-cooking-session-record-reconciliation.md`, `session-log/007-scanner-complete.md`

### Production (grep audit)

`backend/src/agents/brain/` — schemas only; no `mira/` folder; no `MIRA_SESSION` in wrangler
