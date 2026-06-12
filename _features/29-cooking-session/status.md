# Status

open

**Cooking session not shipped.** Build-guide `08-cooking-session/` is complete (docs only). Brain ships `sessions`/`session_turns`/`recipes` schemas and partial tools (**04–08**) but **zero** `MiraSession` DO, zero RealtimeKit/Gemini integration, zero cooking API, zero mobile cooking UI. Session log `008` reconciled records only — not production.

# Shipped in backend (partial — schema spine only)

- [x] `sessions` with `session_type: cooking` enum — `session.schema.ts`
- [x] `session_turns` table + FTS (**04**)
- [x] `recipes.origin` includes `cooking_session` — `recipe.origin.schema.ts`
- [x] `scheduled_alarms` table (timer audit mirror target) — **09**
- [x] Brain tools: `write_user_memory`, `propose_user_constraint`, `view_user_recipe`, `log_memory_event`, `update_user_recipe` — forward targets
- [x] `schedule_user_alarm` / `cancel_user_alarm` tools — inert without Brain wake (**09** G1)
- [ ] `MiraSession` Agent class
- [ ] `MIRA_SESSION` wrangler binding + migration tag
- [ ] `backend/src/agents/mira/` module
- [ ] Mira local SQLite (`cooking_session_runtime`, `cooking_timers`)
- [ ] RealtimeKit meeting/participant client
- [ ] Realtime SFU track WebSocket adapters
- [ ] Gemini Live WebSocket bridge
- [ ] Cooking tool declarations + forward RPC
- [ ] Agents SDK cooking timer schedules
- [ ] Transcript forward to Brain
- [ ] `buildCookingMiraScene` + system instruction
- [ ] MiraSpeechDecisionEngine integration
- [ ] Proactive Gemini reconnect (90s)
- [ ] Session end + recipe decision tree
- [ ] `POST /api/cooking/start` / `/end`
- [ ] Internal cooking-stream proxy routes
- [ ] Mobile cooking feature (RealtimeKit + audio WS)
- [ ] Brain `startCookingSession` / `finalizeCookingSession` handlers
- [ ] Cooking tests

# Open gaps (hunt list)

| ID | Gap | Evidence |
|---|---|---|
| G1 | No `MiraSession` class | `rg class MiraSession backend/src` — zero |
| G2 | No `backend/src/agents/mira/` | Glob — only `brain/` under agents |
| G3 | No `MIRA_SESSION` wrangler binding | `rg MIRA_SESSION backend/wrangler` — zero |
| G4 | No RealtimeKit API client | `rg REALTIMEKIT backend` — zero |
| G5 | No SFU adapter wiring | `rg cooking-stream backend` — zero |
| G6 | No Gemini Live WebSocket code | `rg BidiGenerateContent backend` — zero |
| G7 | No `COOKING_TOOL_DECLARATIONS` | `rg schedule_timer backend` — zero |
| G8 | No `forwardToolToBrain` / Mira RPC | `rg forwardToolToBrain backend` — zero |
| G9 | No cooking timer local schema | `rg cooking_timers backend` — zero |
| G10 | No Agents SDK `fireCookingTimer` schedule | `rg fireCookingTimer backend` — zero |
| G11 | No transcript forward from Mira | `rg write_session_turn backend` — zero |
| G12 | No `buildCookingMiraScene` | `rg buildCookingMiraScene backend` — zero |
| G13 | No MiraSpeechDecisionEngine module | `rg MiraSpeechDecisionEngine backend` — zero |
| G14 | No proactive Gemini reconnect | `rg proactiveGeminiReconnect backend` — zero |
| G15 | No session end handler | `rg endSession cooking backend` — zero |
| G16 | No recipe decision at session end | `rg runRecipeDecision backend` — zero |
| G17 | No `startCookingSession` Brain handler | `rg startCooking backend` — zero |
| G18 | No `POST /api/cooking/start` | `rg api/cooking backend` — zero |
| G19 | No mobile cooking feature | `rg features/cooking mobile` — zero |
| G20 | No cooking Zod schemas in shared | `rg cooking.schema shared` — zero |
| G21 | Brain has no session open/close | **11** G1–G4 — blocks watchdog + finalize contract |
| G22 | Dual-writer sessions undocumented in code | **11** G22; `07-sessions.md` spec only |
| G23 | Timer audit payload mismatch | **09** G9 / **14** G17 — `alarm_id` vs `scheduled_at` |
| G24 | Implementable vs build-guide timer drift | `06-timers.md` DO alarm vs `05-timers.md` SDK schedule |
| G25 | Gemini modalities drift | build-guide AUDIO only vs `07-transcript` AUDIO+TEXT |
| G26 | Tool forward transport drift | implementable `fetch('/internal/tool-call')` vs typed RPC |
| G27 | File path drift | `cooking/` vs `mira/` in build-guide trees |
| G28 | brioela-spec 10 client-direct Gemini | Conflicts with DO-proxied architecture |
| G29 | Compression not wired for cooking | **13** not built; Mira must call when thresholds hit |
| G30 | `openSession`/`closeSession` missing | Mira finalize depends on **11** handlers |
| G31 | `buildSystemPrompt` missing | Cooking context slice loader blocked by **15** |
| G32 | Multi-person room not implemented | **12** spec complete; v1 may be single-user only |
| G33 | Ground find→cook trigger unwired | **27** `06-find-to-cooking-trigger.md` — second release |
| G34 | Acoustic cooking not integrated | **39** blocked on **29** host |
| G35 | Bela shopper scene conflict | implementable Bela embeds Gemini vs MiraSession — **42** |
| G36 | Session log 008 misleading | "complete" = docs reconciled, not shipped |
| G37 | No cooking tests | No `mira*.test.ts` or `cooking*.test.ts` |
| G38 | `search_web` boundary | Must stay chat-only (**18**); not in cooking tools |
| G39 | Recipe create path not implemented | **08** — no `create_user_recipe` tool; direct insert at end |
| G40 | Heirloom/grandma style post-pass | **49**/**32** consumers — not core **29** ship blocker |

# 29 vs neighbor boundaries

| In **29** (this feature) | In separate feature |
|---|---|
| MiraSession DO + cooking scene | MiraScene contract + other scenes (**30**, **42**, **28**, **25**, **44**, **45**) |
| Gemini Live cooking transport | Brain Claude chat (**20**) |
| Cooking tool declarations + forward | Tool executables (**05–08**) |
| Timer fire authority in Mira | Alarm dispatch + audit noop (**14**) |
| Session-end recipe decision + insert | Recipe normalization (**25**), recipe tools (**08**) |
| Transcript + outcome for cooking | Session lifecycle handlers (**11**) |
| Human behavior instruction blocks | Speech engine module tests (**30**) |
| RealtimeKit room for cooking | Acoustic prompt + sound_cue (**39**) |
| Generational capture semantics at end | Heirloom bundle UI (**49**) |
| Single-user cooking path (v1) | Multi-person room polish (**12**) |

# Brain vs Mira (status summary)

| | Brain | MiraSession |
|---|---|---|
| Shipped | Schemas, partial tools, memory RPC | Nothing |
| Cooking session row | Schema ready; no opener | Will finalize via RPC |
| Timers | Audit mirror optional | Authoritative fire |
| Model | Claude (**20** unshipped) | Gemini Live (unshipped) |
| Entry | `startCookingSession` (gap G17) | `/init`, streams, `/audio` (gap G1–G6) |

# Blocked by

- **11-brain-sessions-lifecycle** — open/close, watchdog, turn append contract
- **20-brain-chat-runtime** — shared tool/RPC patterns (not chat loop itself)
- **15-brain-system-prompt** — context slice assembly for cooking instruction
- **04-brain-foundation** — Mira ↔ Brain typed RPC surface
- **14-brain-alarm-dispatch** — cooking_timer audit handler (noop) if mirror enabled

# Blocks

- **30-mira-speech-engine** — engine module extraction
- **39-acoustic-cooking** — host session + instruction hook
- **42-bela** — `bela_shopper` scene on shared MiraSession
- **27-ground** — find→cook ambient entry
- **48-encore** — first-cook refinement session

# Sources

- `implementable-specs/cooking-session/` (all 18 files)
- `build-guide/08-cooking-session/` (7 files)
- `build-guide/30-mira/` (2 files)
- `brioela-specs/10`, `11`, `12`, `13`, `32`, `46`
- `implementable-specs/07-sessions.md`, `09-recipes.md`
- `_records/connections/03-cooking-session-connections.md`
- `_features/12`, `20`, `08`, `09`, `11` migration docs
