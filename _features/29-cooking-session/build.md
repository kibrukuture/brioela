# Cooking Session — Build

Feature **29**. Production paths under `backend/src/agents/mira/` (MiraSession DO), `backend/src/agents/brain/_handlers/` (start/end cooking), `backend/src/api/cooking/` (Hono routes + stream proxy), `mobile/features/cooking/` (RealtimeKit + audio WS), and Brain RPC surfaces for Mira tool forwarding.

**Depends on:** **04** Brain DO + schemas; **11** session lifecycle contract; **08** recipe tables + update tool; **09** alarm schema (audit mirror); **15** context slices for system instruction; **19** tool registry patterns; **04** framework hardening RPC.  
**Blocks:** **30** speech engine extraction; **39** acoustic extensions; **42** bela_shopper scene; **27** find→cook; **48** encore refinement; **49** heirloom capture consumers.

---

## Shipped today

| Area | Status |
|---|---|
| `sessions` schema with `session_type: cooking` | ✓ `backend/src/agents/brain/_schemas/session.schema.ts` |
| `session_turns` schema | ✓ (**04**) |
| `recipes` + `recipe.origin: cooking_session` | ✓ (**08**) |
| `scheduled_alarms` (audit target for timer mirror) | ✓ (**09**) |
| Brain memory/constraint/recipe tools (forward targets) | ✓ partial (**05–08**) |
| `BrioelaBrain` DO (memory RPC only) | ✓ partial (**04**) |
| `MiraSession` Agent class | ✗ |
| `MIRA_SESSION` wrangler binding | ✗ |
| Cooking API routes | ✗ |
| RealtimeKit integration | ✗ |
| Gemini Live bridge | ✗ |
| Mira local SQLite (`cooking_session_runtime`, `cooking_timers`) | ✗ |
| Mobile cooking feature | ✗ |
| Cooking tests | ✗ |

**Zero cooking runtime.** `rg MiraSession backend/src` — no class. `rg MIRA_SESSION backend/wrangler` — no binding.

---

## File manifest

### Wrangler + env (**29**)

| File | Role |
|---|---|
| `backend/wrangler.jsonc` | Add `MIRA_SESSION` binding + `new_sqlite_classes: ["MiraSession"]` |
| `backend/src/types/env.ts` (or equivalent) | `MIRA_SESSION`, `REALTIMEKIT_APP_ID`, `REALTIME_SFU_*`, `GEMINI_API_KEY`, `WORKER_WS_BASE_URL` |

### MiraSession DO core (**29**)

| File | Role |
|---|---|
| `backend/src/agents/mira/mira-session.agent.ts` | `MiraSession extends Agent<Env>` — fetch routing, webSocket hooks, recovery |
| `backend/src/agents/mira/index.ts` | Export for worker entry |
| `backend/src/agents/mira/_schemas/cooking.session.runtime.schema.ts` | Local recovery table DDL |
| `backend/src/agents/mira/_schemas/cooking.timers.schema.ts` | Local timer table DDL |
| `backend/src/agents/mira/_handlers/init.handler.ts` | `/init` — bootstrap, pre-warm Gemini |
| `backend/src/agents/mira/_handlers/realtime-stream.handler.ts` | `/stream/audio`, `/stream/video` — SFU adapter WS |
| `backend/src/agents/mira/_handlers/mobile-audio.handler.ts` | `/audio` — mobile playback WS |
| `backend/src/agents/mira/_handlers/alarm.handler.ts` | `fireCookingTimer`, `scheduleTimer`, `cancelTimer`, `cancelAllTimers` |
| `backend/src/agents/mira/_handlers/end-session.handler.ts` | End sequence + processing fiber |
| `backend/src/agents/mira/_handlers/index.ts` | Barrel |

### Gemini + tools (**29**)

| File | Role |
|---|---|
| `backend/src/agents/mira/_helpers/gemini-session.helper.ts` | `openGeminiSession`, `buildSetupMessage`, message routing |
| `backend/src/agents/mira/_helpers/build-system-instruction.helper.ts` | Cooking system instruction from scene |
| `backend/src/agents/mira/_helpers/send-audio-chunk.helper.ts` | PCM → Gemini `realtime_input` |
| `backend/src/agents/mira/_helpers/send-video-frame.helper.ts` | JPEG → `client_content` inline_data |
| `backend/src/agents/mira/_helpers/proactive-gemini-reconnect.helper.ts` | 90s chaining + transcript continuity |
| `backend/src/agents/mira/_helpers/execute-tool-call.helper.ts` | Direct vs forward routing |
| `backend/src/agents/mira/_helpers/forward-tool-to-brain.helper.ts` | Typed Brain RPC wrapper |
| `backend/src/agents/mira/_constants/cooking.tool.declarations.ts` | `COOKING_TOOL_DECLARATIONS` for Gemini setup |
| `backend/src/agents/mira/_helpers/decode-realtime-packet.helper.ts` | SFU protobuf `Packet` decode |

### Scene builder (**29** — contract types in **30**)

| File | Role |
|---|---|
| `backend/src/agents/mira/_scenes/build-cooking-scene.helper.ts` | `buildCookingMiraScene()` → `MiraScene<CookingSituation>` |
| `backend/src/agents/mira/_scenes/cooking.situation.schema.ts` | Zod for situation context |
| `backend/src/agents/mira/_helpers/load-user-context.helper.ts` | Brain RPC slice loader |

### Speech engine (**29** integrates, **30** owns module)

| File | Role |
|---|---|
| `backend/src/agents/mira/mira-speech-decision/index.ts` | `MiraSpeechDecisionEngine` facade |
| `backend/src/agents/mira/mira-speech-decision/silence-tracker.ts` | VAD silence duration |
| `backend/src/agents/mira/mira-speech-decision/visual-change-detector.ts` | Frame diff / urgency |
| `backend/src/agents/mira/mira-speech-decision/adaptive-frequency.ts` | Phase-based tick intervals |
| `backend/src/agents/mira/mira-speech-decision/prompt-builder.ts` | Observation prompts |
| `backend/src/agents/mira/mira-speech-decision/response-filter.ts` | Discard "ok", classify urgency |
| `backend/src/agents/mira/mira-speech-decision/suppression-rules.ts` | Hard/soft blocks |

### Session end + recipe (**29** + **08**)

| File | Role |
|---|---|
| `backend/src/agents/mira/_helpers/run-recipe-decision.helper.ts` | Decision tree LLM call (generateContent) |
| `backend/src/agents/mira/_helpers/reconstruct-recipe.helper.ts` | Recipe-reconstruction skill output |
| `backend/src/agents/mira/_helpers/build-outcome-summary.helper.ts` | `outcome_summary` JSON |
| `backend/src/agents/mira/_helpers/write-transcript-turn.helper.ts` | Forward turn to Brain |
| `backend/src/agents/brain/_handlers/start-cooking.handler.ts` | RealtimeKit + spawn Mira + session row |
| `backend/src/agents/brain/_handlers/finalize-cooking-session.handler.ts` | Close row, outcome, watchdog cancel |
| `backend/src/agents/brain/_handlers/mira-forward-tool.handler.ts` | Execute forwarded tool in Brain context |
| `backend/src/agents/brain/_rpc/mira.session.rpc.ts` | Zod + types for Mira ↔ Brain RPC |

### HTTP API (**29**)

| File | Role |
|---|---|
| `backend/src/api/cooking/cooking.route.ts` | Hono mount `/api/cooking`, internal stream proxy |
| `backend/src/api/cooking/cooking.controller.ts` | `POST /start`, `POST /end` |
| `backend/src/api/cooking/_helpers/sign-adapter-token.helper.ts` | SFU adapter auth |
| `backend/src/api/cooking/_helpers/sign-mobile-audio-token.helper.ts` | Mobile audio WS auth |
| `backend/src/api/cooking/_helpers/realtimekit.client.ts` | Meeting/participant/adapter API |
| `shared/routes/cooking.routes.ts` | Route constants |
| `shared/validator/cooking.schema.ts` | Start/end request/response Zod |

### Mobile (**29**)

| File | Role |
|---|---|
| `mobile/features/cooking/cooking.session.feature.tsx` | Session shell, start/end |
| `mobile/features/cooking/hooks/use-cooking-session.ts` | Start API, RealtimeKit join, audio WS |
| `mobile/features/cooking/hooks/use-cooking-audio-playback.ts` | PCM playback |
| `mobile/features/cooking/components/cooking-controls.tsx` | End, timer display, vision toggle |
| `mobile/network/cooking/cooking.api.ts` | `POST /api/cooking/start` |

### Tests (**29**)

| File | Role |
|---|---|
| `backend/src/agents/mira/mira-session.agent.test.ts` | Init, recovery, timer idempotency |
| `backend/src/agents/mira/_helpers/forward-tool-to-brain.helper.test.ts` | RPC mapping |
| `backend/src/agents/brain/_handlers/start-cooking.handler.test.ts` | Session row + DO spawn |

---

## Acceptance criteria

### Room + DO

- [ ] `POST /api/cooking/start` returns `sessionId`, `meetingId`, `participantToken`, `doAudioEndpoint`
- [ ] Brain inserts `sessions` row `session_type: cooking`, `status: active`, `model: gemini-3.1-flash-live-preview`
- [ ] MiraSession `/init` persists `cooking_session_runtime` before opening Gemini
- [ ] SFU adapters attach after track publish; PCM and JPEG arrive as protobuf `Packet`
- [ ] Mobile joins RealtimeKit and opens audio WS; hears Gemini within warm-path latency target

### Gemini Live

- [ ] Setup uses `AUDIO` + `TEXT` modalities for transcript
- [ ] JPEG uses `client_content` only (never `realtime_input.video`)
- [ ] BLOCKING tool calls return `tool_response` within 200ms for timer/memory paths
- [ ] Proactive Gemini reconnect at 90s with last 20 turns injected
- [ ] Emergency reconnect ≤3 attempts then `endSession('error')`

### Tools + Brain RPC

- [ ] Six Gemini tools declared; forward map matches `04-tool-protocol.md`
- [ ] Mira never imports Brain `_schemas/`; all durable writes via typed RPC
- [ ] `write_session_note` enriches to `log_memory_event` with `session_id`
- [ ] Brain enforces tool permissions for `caller: cooking`

### Timers

- [ ] `schedule_timer` creates local row + Agents SDK schedule; unique label enforced
- [ ] `fireCookingTimer` idempotent; injects Gemini turn; transcript system event
- [ ] Timer fires survive DO eviction (local SQLite + schedule callback)
- [ ] Session end cancels all pending timers and SDK schedules
- [ ] Brain audit mirror (if enabled) uses **09**-compatible payload or is explicitly disabled

### Transcript + compression

- [ ] Turns written fire-and-forget to Brain with monotonic `turn_counter`
- [ ] System events for timers, reconnect, session end
- [ ] Compression thresholds honored before Gemini turns when cooking session exceeds **11** limits

### Session end + recipe

- [ ] Four end reasons implemented with shared cleanup sequence
- [ ] Recipe decision tree runs; no blind insert on every session
- [ ] `create_new_recipe` uses direct insert `origin: cooking_session`, `session_id` set
- [ ] `increment_cook_count` / `update_user_recipe` paths call **08** executables via RPC
- [ ] `outcome_summary` JSON written; `sessions.status` → `completed` (or `abandoned` on error)
- [ ] `active_session_id` and `turn_counter.{sessionId}` cleared via Brain

### Speech engine (integration)

- [ ] `tick()` at 1 Hz; observation prompts only when engine returns request
- [ ] Response filter discards silent/"ok" responses (no audio to mobile)
- [ ] 25s suppression after Gemini speech (hard rule)
- [ ] Human-behavior instruction blocks present in system instruction

### Mobile + resilience

- [ ] Mobile audio WS reconnect with backoff; 5-minute deadline ends session
- [ ] DO cold-start recovery restores session from `cooking_session_runtime`
- [ ] No raw audio/video persisted server-side

### Boundaries (must not ship in **29** by mistake)

- [ ] No `search_web` in cooking Gemini tools
- [ ] No acoustic taxonomy / `sound_cue` schema (**39**)
- [ ] No `menu_language_bridge` / `bela_shopper` scene builders (**26**/**42**)
- [ ] No BelaOrderAgent changes (**42**)

---

## Build order (within **29**)

1. Wrangler `MIRA_SESSION` + local SQLite schemas
2. MiraSession skeleton + `/init` + recovery
3. Brain `startCookingSession` + session row
4. Gemini open/setup + audio path + mobile `/audio`
5. Tool forward RPC + direct timers
6. SFU stream handlers + video path
7. Transcript forward + system events
8. Speech engine integration
9. Reconnect + mobile disconnect deadline
10. Session end + recipe decision
11. Mobile feature + API routes
12. Tests

---

## Obsolete / misleading records

| Record | Issue |
|---|---|
| `_records/session-log/008-cooking-session-record-reconciliation.md` | Marks build-guide "complete" — means **docs** complete, not shipped code |
| `_records/session-log/007-scanner-complete.md` | Said cooking-session was "next" — superseded by 008 |
| `implementable-specs/cooking-session/06-timers.md` | Raw DO alarm snippets — use build-guide `05-timers.md` |
| `brioela-specs/10-mira-cooking-voice.md` § Session Transport | Client-direct Gemini for single-user — conflicts with DO architecture; **prefer 00-overview** |
