# Cooking Session — Overview

## Why This Folder Exists

The cooking session is one product feature but it has many independent moving parts: a WebRTC room, a Cloudflare Durable Object that controls the session, a Gemini Live AI that sees and hears in real-time, tool calls, DO alarms for timers, transcript storage, and recipe reconstruction at the end. No single spec file can hold all of this without becoming unreadable. This folder breaks the cooking session into one file per concern.

**What this folder covers:**
- Room lifecycle (Cloudflare Realtime)
- Mira cooking session runtime design
- Gemini 3.1 Flash Live session management
- Tool call protocol during a live session
- Video frame processing
- Cooking timers via DO alarms
- Transcript storage
- Session end and recipe reconstruction
- Reconnection and session chaining

**What this folder does NOT cover:**
- Tool input/output schemas → `brioela-tools/`
- Recipe table schema → `09-recipes.md`
- Session table schema → `07-sessions.md`
- session_turns table schema → `08-session-turns.md`

---

## Architecture

```
Mobile App (iOS/Android — RealtimeKit SDK)
    │
    ├── WebRTC ──────────────► Cloudflare Realtime SFU (RealtimeKit)
    │   (sends microphone + camera)         │
    │                                        │ Native WebSocket Adapter
    │                                        │ PCM audio (s16le, 48kHz) + JPEG frames
    │                                        ▼
    │                               Mira session DO
    │                               (idFromName(`cooking:${sessionId}`))
    │                                        │
    │                                        ├── WebSocket ──► Gemini 3.1 Flash Live
    │                                        │                 BidiGenerateContent
    │                                        │                 ◄── audio response
    │                                        │
    └── WebSocket ───────────► Mira session DO
        (receives AI voice back)             │
                                             ├── fetch() ──────► Brain DO
                                             │                   (SQLite tool execution)
                                             │
                                             └── DO Alarms ────► Timer fires → Gemini injection
```

**Two connections from mobile:**
1. WebRTC to Cloudflare Realtime — sends microphone audio and camera video. RealtimeKit SDK handles all WebRTC complexity (NAT traversal, codec negotiation, echo cancellation).
2. WebSocket to Mira session DO — receives Gemini's audio response. Simple binary WebSocket, no WebRTC.

The mobile sends but does not need to receive via WebRTC. Receiving AI voice is just a WebSocket — no WebRTC complexity on the receive side.

---

## Component Responsibilities

| Component | Responsibility | What It Does NOT Do |
|---|---|---|
| Cloudflare Realtime SFU | WebRTC room management, audio/video transport from mobile | AI processing, tool calls, any intelligence |
| Cloudflare Realtime WebSocket Adapter | Push PCM + JPEG from SFU to Mira session DO | Any media transformation beyond format delivery |
| Mira session DO | Controls everything: Gemini session, tool calls, timers, transcript writes | Serve the mobile WebRTC connection directly |
| Gemini 3.1 Flash Live | See, hear, think, speak — real-time AI coaching | Tool execution, SQLite, any persistence |
| Brain DO | Execute SQLite tools on behalf of Mira | Participate in the media or Gemini session |

---

## Key Decisions

**Decision: Cloudflare Realtime / RealtimeKit.**

Cloudflare Realtime's native WebSocket adapter delivers PCM audio and JPEG frames directly to a DO with no third-party egress infrastructure. It runs on Cloudflare's global network. RealtimeKit provides mobile SDKs and room management out of the box. Source: Cloudflare engineering blog, Cloudflare Realtime docs.

**Decision: Gemini 3.1 Flash Live as the AI model.**

Gemini 3.1 Flash Live (`gemini-3.1-flash-live-preview`) is the only globally available production API that natively receives audio in, receives video frames, and outputs audio — in one unified model, not a duct-taped pipeline. Measured latency ~960ms first response. Fully duplex with barge-in. Model declared available March 2026. Status: Preview (not GA). Production user reports confirm lower latency and fewer resource exhausted errors vs 2.5. Source: Google AI docs, Google Dev Forum production user thread.

Swap path: The cooking session architecture is model-agnostic at the API boundary. If Qwen3.5-Omni Flash (211ms, GA via DashScope international) becomes the clear choice, the swap is the WebSocket endpoint URL and auth headers in one place — no structural changes.

**Decision: JPEG frames injected as client_content, not realtime_input.video.**

Gemini Live `realtime_input.video` triggers a 2-minute session limit. `client_content.parts[].inline_data` (inline JPEG) does not. The cooking session runs for up to 45 minutes. Frames are injected via `client_content` at 1 FPS — Gemini sees the kitchen without triggering the video session cap. This is not a workaround; it is the correct API path for periodic image injection.

**Decision: BLOCKING tool calls.**

Gemini 3.1 Flash Live does not support NON_BLOCKING (async) tool calls — only BLOCKING. During a tool call, Gemini's audio output pauses until the DO returns a tool response. For cooking session tools (set timer, write memory, save recipe note), the pause is under 200ms. Acceptable. The AI says "I'll set that timer" → pauses briefly → tool completes → continues speaking.

**Decision: Mira session DO is session-scoped.**

DO ID: `idFromName(\`cooking:${sessionId}\`)`. One DO per cooking session. The Brain DO spawns and coordinates the Mira session DO. When the session ends, the Mira session DO is no longer addressed — it idles and eventually Cloudflare evicts it. All session state is written to SQLite so DO eviction during the session is survivable via restart.

---

## What Makes This Not a Toy App

- DO alarms fire exactly when cooking timers expire — the AI says "your eggs are done" at precisely the right moment, whether the session has been running for 5 minutes or 40 minutes.
- Tool calls are declared to Gemini and executed by the DO against the user's SQLite database — the AI can write memory facts, propose constraints, and save recipe notes mid-session.
- Session transcript is written turn-by-turn to `session_turns` with turn counter protected by `agent_state` to prevent race conditions.
- Gemini session chaining keeps the session alive for 45 minutes — proactive reconnect at 90 seconds preserves context across Gemini's session limits.
- Recipe reconstruction runs at session end with a decision tree — not blindly creating a row for every session.
- The DO reads the user's full context (constraints, memory, skills) before constructing the Gemini system instruction — the AI knows grandma is lactose intolerant before the session starts.
