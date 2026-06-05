# Cooking Session — Overview

## What This Folder Covers
The live AI cooking coach: voice + camera, Gemini 3.1 Flash Live, CookingAgent Durable Object, Cloudflare Realtime SFU for audio/video transport, proactive speech engine, timers, transcript storage, reconnection, session end, and multi-person cooking rooms via LiveKit Cloud. Also covers generational recipe capture and grandma-style flavor profile extraction (features that depend on the cooking session pipeline).

## Status
[ ] not started

## Specs This Folder Draws From
- `implementable-specs/cooking-session/` — all 11 files + proactive-speech-engine/ (6 files)
- `brioela-specs/10-voice-cooking-agent.md` — voice-only cooking agent, Gemini Live, session lifecycle
- `brioela-specs/11-live-vision-cooking-coach.md` — camera-based coaching, video frame pipeline
- `brioela-specs/12-multi-person-cooking-rooms.md` — LiveKit Cloud, multi-participant rooms, per-participant constraints
- `brioela-specs/13-generational-recipe-capture.md` — grandma session → structured recipe reconstruction
- `brioela-specs/32-grandma-style-flavor-profile.md` — style extraction from session transcript, recipe adaptation
- `brioela-specs/24-technical-architecture-backbone.md` — context compression (50%/85% dual-layer), keepAlive heartbeat

## Key Decisions From Specs
- `CookingAgentDO extends Agent` — one DO per cooking session, keyed by `cook-{userId}-{recipeId}`
- Single-user: mobile → Gemini Live WebSocket directly; context injected by Orchestrator DO at start
- Multi-person: mobile → LiveKit Cloud SFU → LiveKit Agent Worker (Node.js on Railway/Fly.io) → Gemini Live
- Gemini model: `gemini-3.1-flash-live-preview` — full-duplex audio + native video, no STT→LLM→TTS pipeline
- Video frames sent as `client_content` inline images (NOT `realtime_input.video`) to avoid 2-min video cap
- Proactive speech engine: `speechEngine.tick()` every second — suppresses most ticks, only observes when conditions right
- Tool calls: BLOCKING — Gemini pauses until `tool_response` is sent back
- Context compression: sacred block (allergies, first 3 turns, recipe state) never compressed; fact extraction before any archiving
- Post-session: Upstash Workflow for summarization, recipe save, memory write — never synchronous
- Style extraction: post-session async job on transcript — never interrupts live session

## Tools Built In This Feature
Under `tools/cooking-agent/`:
- All 18 brioela-tools (set-timer, write-memory, propose-constraint, etc.)

## What This Folder Depends On
- `05-orchestrator` — context loaded at session start; facts written back at session end
- `03-foundation` — Cloudflare Realtime, LiveKit, Gemini API keys

## What Depends On This Folder
- `22-bela` — shopper AI assistant uses same Gemini Live pipeline
- `08-ground` — find-to-cooking-session trigger
