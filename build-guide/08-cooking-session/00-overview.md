# Cooking Session — Overview

## What This Folder Covers

Mira in the cooking scene: live voice + camera guidance, Gemini 3.1 Flash Live, session-scoped Agent-backed Durable Object, Cloudflare RealtimeKit for room/participant lifecycle, Cloudflare Realtime SFU track adapters for selected media streams, proactive speech engine, timers via Agents SDK schedules, transcript storage, reconnection, session end with recipe reconstruction, and multi-person cooking rooms. Also covers generational recipe capture and grandma-style flavor profile extraction.

## Status
[x] complete — six files written

## Files In This Folder

| File | Contents |
|---|---|
| `01-room-lifecycle.md` | RealtimeKit Meeting creation, participant token, SFU track adapter configuration, mobile join flow, active-session teardown, environment variables |
| `02-mira-session-do.md` | Mira cooking session runtime DO class, endpoints (/init /stream /audio /alarm-fired), in-memory state, initialization, DO eviction recovery, Brain tool forwarding, agent_state keys |
| `03-gemini-live-session.md` | Model selection, latency reality, opening the session, setup message, system instruction construction (BrioelaIdentity + constraints + memory + skills), audio forwarding (PCM), video forwarding (JPEG as client_content not realtime_input.video), proactive reconnect at 90s, tool call handling (BLOCKING), session chaining |
| `04-mira-speech-decision-engine.md` | MiraSpeechDecisionEngine interface, silence tracker, visual change detector, adaptive frequency, prompt builder, response filter, suppression rules, human behaviors (non-response, adaptive verbosity, phase awareness) |
| `05-timers.md` | Timer tool implementation, Agents SDK schedule callbacks, timer fire dispatch, timer cancellation, session end timer cleanup |
| `06-session-end-and-recipe.md` | Four end types, end sequence (close Gemini → cancel timers → close room → processing), recipe decision tree, outcome_summary construction, memory consolidation via Brain, session row finalization |

## Specs This Folder Draws From

- `implementable-specs/cooking-session/00-overview.md` — architecture, Cloudflare Realtime decision, Gemini model decision
- `implementable-specs/cooking-session/01-room-lifecycle.md` — RealtimeKit API calls, room creation, WebSocket adapter
- `implementable-specs/cooking-session/02-mira-session.md` — MiraSession DO class, state, endpoints
- `implementable-specs/cooking-session/03-gemini-session.md` — Gemini setup, audio/video forwarding, reconnect
- `implementable-specs/cooking-session/04-tool-protocol.md` — tool declarations, BLOCKING behavior
- `implementable-specs/cooking-session/05-video-processing.md` — JPEG pipeline, 1 FPS forwarding, client_content approach
- `implementable-specs/cooking-session/06-timers.md` — older timer tool notes; current guide uses Agents SDK schedules
- `implementable-specs/cooking-session/07-transcript-storage.md` — turn writing, turn counter from agent_state
- `implementable-specs/cooking-session/08-session-end.md` — end sequence, recipe decision tree
- `implementable-specs/cooking-session/09-reconnection.md` — Gemini reconnect, mobile reconnect, session chaining
- `implementable-specs/cooking-session/10-human-behaviors.md` — non-response, adaptive verbosity, phase awareness
- `implementable-specs/cooking-session/mira-speech-decision-engine/` — all 6 files
- `brioela-specs/13-generational-recipe-capture.md` — grandma session, recipe reconstruction
- `brioela-specs/32-grandma-style-flavor-profile.md` — style extraction from transcript

## Key Decisions From Specs

- **Cloudflare Realtime / RealtimeKit.** RealtimeKit handles meeting and participant lifecycle. Current documented media adapters live under Cloudflare Realtime SFU and attach to selected tracks, not a whole meeting. Audio/video bridge code must use the current SFU adapter API or be blocked until Cloudflare documents a RealtimeKit meeting adapter.
- DO ID: `idFromName(\`cooking:${sessionId}\`)` — one DO per session
- Mobile has two connections: WebRTC to CF Realtime (sends audio/video), WebSocket to DO (receives Gemini audio back)
- Gemini model: `gemini-3.1-flash-live-preview` — audio in + JPEG frames in + audio out in one model
- JPEG frames via `client_content.parts[].inline_data` NOT `realtime_input.video` — avoids 2-minute video session cap
- Tool calls: BLOCKING — Gemini pauses until `tool_response` returned. Under 200ms for timer/memory tools.
- Proactive reconnect: new Gemini session every 90 seconds — stays well within Gemini Live session limits
- Recipe reconstruction: decision tree at session end — not blindly creating a row for every session

## Tools Built In This Feature

Under `tools/mira-session/`:
- `schedule_timer`, `cancel_timer` — handled directly by MiraSession using Agents SDK schedules
- `write_session_note`, `write_memory`, `propose_constraint`, `view_recipe` — forwarded to Brain DO

## What This Folder Depends On

- `05-brain` — durable user context loaded into Mira at session start; facts, constraints, skills written back at session end
- `06-brain-memory` — session_turns schema, sessions schema, recipes schema
- `03-foundation` — Cloudflare RealtimeKit/SFU env (`CLOUDFLARE_ACCOUNT_ID`, `REALTIMEKIT_APP_ID`, optional `REALTIME_SFU_APP_ID`), Gemini API key

## What Depends On This Folder

- `11-bela` — Mira starts a Bela shopper scene using the same MiraSession runtime
- `09-ground` — find-to-cooking-session trigger
