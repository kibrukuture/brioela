# Cooking Session — Gemini Live Session

## What This File Covers

Model selection, first-turn latency reality, opening the session, setup message, system instruction construction, PCM audio forwarding, JPEG frame forwarding (the `client_content` approach), proactive reconnect at 90s, and BLOCKING tool call handling.

---

## Model: `gemini-3.1-flash-live-preview`

The only globally available API model that natively handles audio in + video frames in + audio out in one model. No STT → LLM → TTS pipeline. Fully duplex with barge-in.

**Latency from production developer reports (not marketing):**

| Turn | Latency |
|---|---|
| First turn — cold WebSocket | ~3 seconds |
| Subsequent turns — warm session | ~500ms |

The cold-start first-turn problem is mitigated by pre-warming (opening the Gemini session before mobile arrives). **This must be tested in production.** If the 3s delay persists after pre-warming, see `02-cooking-agent-do.md` CAUTION for fallback options (silent ping, pre-recorded greeting, UI loading state).

**Swap path:** the architecture is model-agnostic at the WebSocket boundary. If Qwen3.5-Omni Flash or another model becomes available and better, the swap is one URL + auth header change.

---

## Opening the Session

```typescript
// backend/src/agents/cooking/_helpers/gemini-session.helper.ts

const GEMINI_WS_ENDPOINT = (apiKey: string) =>
  `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`

export async function openGeminiSession(
  context:    UserContext,
  cookingDo:  CookingAgent,
): Promise<void> {
  const ws = new WebSocket(GEMINI_WS_ENDPOINT(cookingDo.env.GEMINI_API_KEY))

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify(buildSetupMessage(context)))
  })

  ws.addEventListener('message', (event) => {
    handleGeminiMessage(JSON.parse(event.data as string), cookingDo)
  })

  ws.addEventListener('close', (event) => {
    onGeminiClose(event.code, event.reason, cookingDo)
  })

  ws.addEventListener('error', () => {
    onGeminiError(cookingDo)
  })

  cookingDo.sessionState!.geminiWs = ws

  // Schedule proactive reconnect at 90 seconds
  cookingDo.sessionState!.geminiReconnectTimer = setTimeout(
    () => proactiveGeminiReconnect(cookingDo),
    90_000,
  )
}
```

---

## Setup Message

Sent immediately on WebSocket open. Full configuration in one message.

```typescript
function buildSetupMessage(context: UserContext): object {
  return {
    setup: {
      model: 'models/gemini-3.1-flash-live-preview',
      generation_config: {
        response_modalities: ['AUDIO'],
        speech_config: {
          voice_config: {
            prebuilt_voice_config: { voice_name: 'Charon' },  // warm, natural
          },
        },
      },
      system_instruction: {
        parts: [{ text: buildSystemInstruction(context) }],
      },
      tools: [{ function_declarations: COOKING_TOOL_DECLARATIONS }],
    },
  }
}
```

---

## System Instruction Construction

Built once at session open. Static prefix for Anthropic-style prefix caching (Gemini also benefits from stable context):

```typescript
function buildSystemInstruction(context: UserContext): string {
  const parts: string[] = []

  // 1. Identity
  parts.push(`You are Brioela, a live AI cooking companion. You are in a real-time cooking session with ${context.userName}. You can hear through the microphone and see through the camera.`)
  parts.push(`You respond with voice only. Be concise — this is a live cooking environment, not a chat.`)

  // 2. Hard constraints — safety-critical, always near top
  if (context.constraints.length > 0) {
    parts.push(`\n## HARD CONSTRAINTS — NEVER SUGGEST OR ALLOW:`)
    for (const c of context.constraints) {
      parts.push(`- ${c.constraintType.toUpperCase()}: ${c.entityValue}`)
    }
    parts.push(`If you detect any of the above in the cooking process, interrupt and alert immediately.`)
  }

  // 3. Relevant user memory
  if (context.memory.length > 0) {
    parts.push(`\n## WHAT YOU KNOW ABOUT ${context.userName.toUpperCase()}:`)
    for (const m of context.memory) {
      parts.push(`- ${m.namespace}/${m.key}: ${m.value}`)
    }
  }

  // 4. Skills index
  if (context.skills.length > 0) {
    parts.push(`\n## COOKING PROFILE:`)
    for (const s of context.skills) {
      parts.push(`- ${s.name}: ${s.description}`)
    }
  }

  // 5. Continuity from prior session or reconnect
  if (context.recentTranscript) {
    parts.push(`\n## RECENT CONVERSATION (for continuity):`)
    parts.push(context.recentTranscript)
  }

  // 6. Behavioral instructions
  parts.push(`\n## HOW TO BEHAVE:`)
  parts.push(`Do not respond to self-narration, humming, or conversations between other people in the room.`)
  parts.push(`Respond when directly addressed or when you observe something that needs attention.`)
  parts.push(`Adapt verbosity to confidence — coach early, companion later.`)
  parts.push(`Use tools naturally. Do not announce every tool call.`)

  return parts.join('\n')
}
```

---

## Audio Forwarding — PCM from Realtime Adapter

PCM audio arrives as `ArrayBuffer`. Forward as `realtime_input.audio`:

```typescript
export async function sendAudioChunk(
  pcmData:   ArrayBuffer,
  cookingDo: CookingAgent,
): Promise<void> {
  const ws = cookingDo.sessionState?.geminiWs
  if (!ws || cookingDo.sessionState?.status !== 'active') return

  const base64 = btoa(String.fromCharCode(...new Uint8Array(pcmData)))
  ws.send(JSON.stringify({
    realtime_input: {
      audio: {
        data:      base64,
        mime_type: 'audio/pcm;rate=48000',
      },
    },
  }))
}
```

---

## Video Frame Forwarding — JPEG as `client_content`

**Critical decision:** frames go via `client_content.parts[].inline_data`, NOT `realtime_input.video`.

`realtime_input.video` triggers Gemini's 2-minute video session cap. A grandma cooking session runs 45 minutes. `client_content` inline images do not trigger this cap. This is the correct API path for periodic image injection — not a workaround.

```typescript
export async function sendVideoFrame(
  jpegData:  ArrayBuffer,
  cookingDo: CookingAgent,
): Promise<void> {
  const ws = cookingDo.sessionState?.geminiWs
  if (!ws || cookingDo.sessionState?.status !== 'active') return

  const base64 = btoa(String.fromCharCode(...new Uint8Array(jpegData)))
  ws.send(JSON.stringify({
    client_content: {
      turns: [{
        role: 'user',
        parts: [{
          inline_data: {
            mime_type: 'image/jpeg',
            data:      base64,
          },
        }],
      }],
      turn_complete: false,   // image injection — not a conversational turn
    },
  }))
}
```

The Cloudflare Realtime adapter delivers 1 JPEG per second. Gemini's `client_content` accepts up to 1 FPS inline images. They are aligned — no additional rate limiting needed in the DO.

---

## Proactive Reconnect at 90 Seconds

Gemini Live has session limits (confirmed 15 minutes for certain modes). The DO reconnects proactively every 90 seconds — well within any limit.

```typescript
async function proactiveGeminiReconnect(cookingDo: CookingAgent): Promise<void> {
  const state = cookingDo.sessionState!
  state.status = 'reconnecting'

  // Log reconnect to agent_state
  await upsertAgentState(cookingDo.env, state.userId,
    `cooking.gemini_reconnect.${state.sessionId}`,
    JSON.stringify({ ts: Date.now() }),
  )

  // Close current session
  if (state.geminiWs) {
    state.geminiWs.close(1000, 'proactive_reconnect')
    state.geminiWs = null
  }
  if (state.geminiReconnectTimer) {
    clearTimeout(state.geminiReconnectTimer)
    state.geminiReconnectTimer = null
  }

  // Load updated context — include last 20 turns for continuity
  const context = await loadUserContext(state.userId, cookingDo.env)
  context.recentTranscript = await loadRecentTranscript(state.sessionId, 20, cookingDo.env)

  // Open fresh session
  await openGeminiSession(context, cookingDo)
  state.status = 'active'
}
```

---

## BLOCKING Tool Calls

Gemini 3.1 Flash Live only supports BLOCKING tool calls. When Gemini calls a tool, its audio output pauses until the DO returns a `tool_response`.

```typescript
function handleGeminiMessage(msg: GeminiMessage, cookingDo: CookingAgent): void {
  if (msg.toolCall) {
    // Gemini has paused — execute tool and respond
    const call = msg.toolCall.functionCalls[0]!
    cookingDo.sessionState!.pendingToolCall = {
      id:   call.id,
      name: call.name,
      args: call.args,
    }
    executePendingToolCall(cookingDo)
    return
  }

  if (msg.serverContent?.modelTurn?.parts) {
    for (const part of msg.serverContent.modelTurn.parts) {
      if (part.inlineData?.mimeType?.startsWith('audio/')) {
        // Gemini audio response — forward to mobile
        const audioBuffer = base64ToArrayBuffer(part.inlineData.data)
        cookingDo.sessionState?.mobileWs?.send(audioBuffer)
        cookingDo.speechEngine?.onGeminiSpeechStart()
      }
    }
  }
}

async function executePendingToolCall(cookingDo: CookingAgent): Promise<void> {
  const pending = cookingDo.sessionState!.pendingToolCall!

  let result: unknown
  try {
    // schedule_timer and cancel_timer handled locally (DO alarms)
    if (pending.name === 'schedule_timer') {
      result = await scheduleTimer(pending.args as { label: string; seconds: number }, cookingDo)
    } else if (pending.name === 'cancel_timer') {
      result = await cancelTimer((pending.args as { label: string }).label, cookingDo)
    } else {
      // All other tools forwarded to Orchestrator
      result = await forwardToolToOrchestrator(pending.name, pending.args, cookingDo.sessionState!, cookingDo.env)
    }
  } catch (err) {
    result = { error: String(err) }
    await upsertAgentState(cookingDo.env, cookingDo.sessionState!.userId,
      `cooking.tool_failure.${cookingDo.sessionState!.sessionId}`,
      JSON.stringify({ tool: pending.name, error: String(err), ts: Date.now() }),
    )
  }

  // Return tool_response to Gemini — resumes audio output
  cookingDo.sessionState!.geminiWs?.send(JSON.stringify({
    tool_response: {
      function_responses: [{
        id:       pending.id,
        name:     pending.name,
        response: { result },
      }],
    },
  }))

  cookingDo.sessionState!.pendingToolCall = null
}
```

Typical tool execution times: `schedule_timer` ~10ms (DO storage write), `write_memory` ~150ms (HTTP to Orchestrator → SQLite write). Both imperceptible as audio pauses.
