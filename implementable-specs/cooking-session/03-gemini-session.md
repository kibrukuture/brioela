# Cooking Session — Gemini 3.1 Flash Live Session

## Model

`gemini-3.1-flash-live-preview`

Chosen because it is the only globally available API model that natively handles audio in + video frames in + audio out in a single model. Status: Preview (not GA). Swap path documented in `00-overview.md`.

This is the same model powering the Gemini consumer app's voice feature ("Gemini Live") — confirmed by Google's official launch blog post. The human-like feeling users experience in the Gemini app comes from this exact model.

**Latency reality (from production developer reports, not marketing):**

| Turn | Latency | Source |
|---|---|---|
| First turn — cold WebSocket | ~3 seconds | GitHub google-gemini/cookbook issue #1197 |
| Subsequent turns — warm session | ~500ms | Same source, Google Dev Forum |
| First WebSocket connect | 5–15 seconds | Google Dev Forum |

The cold-start 3-second first-turn is the known production problem. It is mitigated by pre-warming — see `02-cooking-agent.md` CAUTION note. After the first turn, ~500ms feels natural in conversation.

**CAUTION — test first-turn latency in production before assuming pre-warming solves it.** The cold-start cost may be internal to the model, not just the WebSocket setup time. See `02-cooking-agent.md` for fallback options if pre-warming is insufficient.

API endpoint: `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent`

---

## Proactive Speech — How Gemini Speaks Without Being Asked

Gemini does not have a native proactive decision loop. By default it is reactive — it speaks when the user speaks. The ProactiveSpeechEngine (see `proactive-speech-engine/`) implements this behavior by sending Gemini periodic `client_content` observation prompts when the conditions are right.

**The mechanism:**
1. The CookingAgent DO calls `speechEngine.tick()` every second
2. If the engine returns an `ObservationRequest`, the DO sends it to Gemini as `turn_complete: true`
3. Gemini responds — either with a real observation or with "ok"
4. The response filter discards "ok" (audio never reaches mobile)
5. Real observations are classified as urgent or advisory and forwarded to mobile

This is NOT a constant interrogation of Gemini. The engine suppresses most ticks based on silence duration, visual change, recent speech, and cooking phase. In a 45-minute session, Gemini may make 10–20 proactive observations. Each one earns its place.

Human-like behaviors built on top of this engine are documented in `10-human-behaviors.md`.

---

## Opening the Session

```typescript
private async openGeminiSession(context: UserContext): Promise<void> {
  const endpoint = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${this.env.GEMINI_API_KEY}`

  const ws = new WebSocket(endpoint)

  ws.addEventListener('open', () => {
    // Send the session setup message immediately on open
    ws.send(JSON.stringify(this.buildSetupMessage(context)))
  })

  ws.addEventListener('message', (event) => {
    this.handleGeminiMessage(JSON.parse(event.data as string))
  })

  ws.addEventListener('close', (event) => {
    this.onGeminiClose(event.code, event.reason)
  })

  ws.addEventListener('error', (event) => {
    this.onGeminiError(event)
  })

  this.sessionState.geminiWs = ws

  // Schedule proactive reconnect at 90 seconds
  this.scheduleGeminiReconnect()
}
```

---

## Setup Message

Sent immediately after the WebSocket opens. Contains the full session configuration.

```typescript
private buildSetupMessage(context: UserContext): GeminiBidiSetup {
  return {
    setup: {
      model: 'models/gemini-3.1-flash-live-preview',

      generation_config: {
        response_modalities:   ['AUDIO'],    // audio output only — not text
        speech_config: {
          voice_config: {
            prebuilt_voice_config: {
              voice_name: 'Charon',          // Gemini built-in voice — warm, natural
            },
          },
        },
        // temperature deliberately not set — default is appropriate for live coaching
      },

      system_instruction: {
        parts: [{ text: this.buildSystemInstruction(context) }],
      },

      tools: [
        { function_declarations: COOKING_TOOL_DECLARATIONS },
      ],
    },
  }
}
```

---

## System Instruction

Built from the user's loaded context. Injected once at session start — this is the prefix cache anchor (most stable to least stable):

```typescript
private buildSystemInstruction(context: UserContext): string {
  const parts: string[] = []

  // 1. Agent identity (most stable — never changes)
  parts.push(`You are Brioela, an AI cooking companion. You are in a live cooking session with ${context.userName}.`)
  parts.push(`You can see the kitchen through the camera and hear ${context.userName} speak. You respond with voice only.`)
  parts.push(`You are a patient, knowledgeable, and warm cooking coach. You speak in the user's preferred language.`)

  // 2. Hard constraints (safety-critical — must always be respected)
  if (context.constraints.length > 0) {
    parts.push(`\n## HARD CONSTRAINTS — NEVER SUGGEST THESE:`)
    for (const c of context.constraints) {
      parts.push(`- ${c.type.toUpperCase()}: ${c.ingredient} (${c.reason ?? 'user restriction'})`)
    }
    parts.push(`If you see or hear anything related to the above, immediately alert the user.`)
  }

  // 3. User memory relevant to cooking
  if (context.memory.length > 0) {
    parts.push(`\n## WHAT YOU KNOW ABOUT ${context.userName.toUpperCase()}:`)
    for (const m of context.memory) {
      parts.push(`- ${m.namespace} / ${m.key}: ${JSON.stringify(m.value)}`)
    }
  }

  // 4. Skills (relevant procedural knowledge)
  if (context.skills.length > 0) {
    parts.push(`\n## ${context.userName.toUpperCase()}'S COOKING PROFILE:`)
    for (const s of context.skills) {
      parts.push(`- ${s.title}: ${s.summary}`)
    }
  }

  // 5. Session context
  parts.push(`\n## THIS SESSION:`)
  parts.push(`Session started: ${new Date().toISOString()}`)
  parts.push(`You have access to the following tools: set cooking timers, write memory notes, propose dietary constraints, view recipes.`)
  parts.push(`Use tools when appropriate but do not announce every tool call. Be natural.`)
  parts.push(`If you see something concerning in the camera (e.g., smoke, burning, unsafe technique), say so immediately.`)

  return parts.join('\n')
}
```

---

## Sending Audio to Gemini

PCM audio arrives from the Cloudflare Realtime WebSocket adapter in binary chunks. The DO forwards them to Gemini as `realtime_input.audio`:

```typescript
async sendAudioChunk(pcmData: ArrayBuffer): Promise<void> {
  if (!this.sessionState.geminiWs || this.sessionState.status !== 'active') return

  const base64Audio = btoa(String.fromCharCode(...new Uint8Array(pcmData)))

  this.sessionState.geminiWs.send(JSON.stringify({
    realtime_input: {
      audio: {
        data:      base64Audio,
        mime_type: 'audio/pcm;rate=48000',
      },
    },
  }))
}
```

---

## Sending Video Frames to Gemini

JPEG frames arrive from the Cloudflare Realtime WebSocket adapter. They are injected as `client_content` inline images — NOT as `realtime_input.video`. This avoids the 2-minute video session cap.

```typescript
async sendVideoFrame(jpegData: ArrayBuffer): Promise<void> {
  if (!this.sessionState.geminiWs || this.sessionState.status !== 'active') return

  const base64Image = btoa(String.fromCharCode(...new Uint8Array(jpegData)))

  this.sessionState.geminiWs.send(JSON.stringify({
    client_content: {
      turns: [{
        role:  'user',
        parts: [{
          inline_data: {
            mime_type: 'image/jpeg',
            data:      base64Image,
          },
        }],
      }],
      turn_complete: false,   // NOT a complete turn — just a frame update
    },
  }))
}
```

`turn_complete: false` tells Gemini this is a context update (new visual information) not a user message requiring a response. Gemini sees the frame and can reference it in its next natural response without being prompted to respond immediately.

---

## Handling Gemini Messages

```typescript
private handleGeminiMessage(msg: GeminiServerMessage): void {
  // 1. Audio output — forward to mobile
  if (msg.server_content?.model_turn?.parts) {
    for (const part of msg.server_content.model_turn.parts) {
      if (part.inline_data?.mime_type?.startsWith('audio/')) {
        const audioBytes = this.base64ToArrayBuffer(part.inline_data.data)
        this.sessionState.mobileWs?.send(audioBytes)
      }
    }
  }

  // 2. Turn complete — write transcript turn
  if (msg.server_content?.turn_complete) {
    this.writeTurn(msg.server_content.model_turn?.parts ?? [])
  }

  // 3. Tool call (BLOCKING — Gemini pauses until we respond)
  if (msg.tool_call) {
    this.handleToolCall(msg.tool_call)
  }

  // 4. Setup complete — session is ready
  if (msg.setup_complete) {
    this.sessionState.status = 'active'
  }

  // 5. Interrupted (user barged in)
  if (msg.server_content?.interrupted) {
    // Gemini stopped speaking because user spoke — nothing to do
    // Audio output naturally stops
  }
}
```

---

## Tool Call Handling (BLOCKING)

Gemini 3.1 Flash Live uses BLOCKING tool calls only. When Gemini calls a tool, its audio output pauses until the DO sends back a `tool_response`. The tool call is resolved and then Gemini continues.

```typescript
private async handleToolCall(toolCall: GeminiToolCall): Promise<void> {
  const { id, name, args } = toolCall.function_calls[0]

  this.sessionState.pendingToolCall = { id, name, args }

  try {
    // Execute via Brain DO (for SQLite tools) or directly (for timer tools)
    const result = await this.executeToolCall(name, args)

    // Send tool_response back to Gemini — unblocks its output
    this.sessionState.geminiWs?.send(JSON.stringify({
      tool_response: {
        function_responses: [{
          id,
          name,
          response: { output: result },
        }],
      },
    }))
  } catch (err) {
    // Tool failed — send error response so Gemini can recover gracefully
    this.sessionState.geminiWs?.send(JSON.stringify({
      tool_response: {
        function_responses: [{
          id,
          name,
          response: { error: String(err) },
        }],
      },
    }))

    // Log failure to agent_state
    this.upsertAgentState(
      `cooking.tool_failure.${this.sessionState.sessionId}`,
      JSON.stringify({ tool: name, error: String(err), ts: Date.now() }),
    )
  } finally {
    this.sessionState.pendingToolCall = null
  }
}
```

---

## Gemini Close Handling

```typescript
private onGeminiClose(code: number, reason: string): void {
  this.sessionState.geminiWs = null

  if (this.sessionState.status === 'ending') return  // expected close at session end

  if (this.sessionState.status === 'active') {
    // Unexpected close — reconnect
    this.sessionState.status = 'reconnecting'
    this.reconnectGemini()
  }
}
```

Reconnection logic is in `09-reconnection.md`.

---

## Audio Format Details

| Direction | Format | Details |
|---|---|---|
| Mobile → SFU | Opus (WebRTC) | RealtimeKit SDK negotiates codec |
| SFU → DO | PCM s16le | 48kHz, adapter converts from Opus |
| DO → Gemini | PCM base64 | `audio/pcm;rate=48000` |
| Gemini → DO | PCM base64 | Decoded from Gemini audio parts |
| DO → Mobile | PCM binary | Sent as ArrayBuffer over WebSocket |
| Mobile plays | raw PCM | Mobile AVAudioEngine or equivalent |

---

## What This File Does NOT Cover

- How frames arrive and are routed → `05-video-processing.md`
- Tool declarations and forwarding → `04-tool-protocol.md`
- Session reconnection → `09-reconnection.md`
