# Cooking Session — Transcript Storage

## What Gets Stored

The cooking session transcript is stored in `session_turns` — the same table as chat sessions. One row per conversational turn. A "turn" is one complete speech act: either the user finishes speaking, or Gemini finishes speaking (turn_complete).

What IS stored:
- Gemini's text output (when Gemini speaks, its content is available as text alongside audio)
- User speech transcription (if Gemini echoes what the user said, or if a separate STT pass is available)
- System events that matter for the session record (timer fired, tool called)

What is NOT stored:
- Raw audio bytes — never. No audio is persisted.
- Video frames — never. No frames are persisted.
- Individual Gemini audio chunks — these are transient; only complete turns are stored.

---

## Turn Counter — Race Prevention

Turn numbers are managed via the `agent_state` turn counter, identical to chat sessions. The counter prevents the race condition that `MAX(turn_number) + 1` would create if two turns wrote simultaneously.

```typescript
private async nextTurnNumber(): Promise<number> {
  const key   = `turn_counter.${this.sessionState.sessionId}`
  const raw   = await this.getAgentState(key) ?? '0'
  const next  = parseInt(raw, 10) + 1

  await this.upsertAgentState(key, String(next))
  return next
}
```

The CookingAgent DO is the only process writing turns for this session. There is no concurrent writer — the turn counter is safe from racing as long as turns are written sequentially within the DO. Because the DO is single-threaded (Cloudflare DOs process one request at a time), sequential writes are guaranteed.

---

## Writing a Turn

Turns are written after each Gemini `turn_complete` event — when Gemini finishes a complete speech act.

```typescript
private async writeTurn(parts: GeminiPart[], role: 'model' | 'user' = 'model'): Promise<void> {
  // Extract text content from Gemini parts
  const textContent = parts
    .filter(p => p.text)
    .map(p => p.text!)
    .join(' ')
    .trim()

  if (!textContent) return  // no text content — skip (audio-only part with no transcript)

  const turnNumber = await this.nextTurnNumber()

  // Fire and forget — do not await. Turn writes should never block Gemini response delivery.
  this.forwardToolToBrain('write_session_turn', {
    session_id:  this.sessionState.sessionId,
    turn_number: turnNumber,
    role,
    content:     textContent,
    metadata:    JSON.stringify({ source: 'gemini_live', ts: Date.now() }),
  }).catch(err => {
    // Log failure — session continues regardless
    this.upsertAgentState(
      `memory.write_failure.${this.sessionState.sessionId}`,
      JSON.stringify({ namespace: 'session_turns', key: `turn_${turnNumber}`, error: String(err), ts: Date.now() }),
    )
  })
}
```

Turn writes are fire-and-forget because they must not block audio delivery. If a turn write fails, the diagnostic key is written to `agent_state` — the session continues without interruption.

---

## Gemini Text Output — When Is It Available?

Gemini 3.1 Flash Live is configured with `response_modalities: ['AUDIO']` — audio output only. In this mode, Gemini may or may not include text alongside the audio depending on the model's behavior.

Two possible configurations:

**Configuration A (preferred): AUDIO only**
```typescript
response_modalities: ['AUDIO'],
```
Gemini speaks but may not produce a text transcript. In this case, the transcript is sparse — only tool calls and system events are recorded.

**Configuration B: AUDIO + TEXT**
```typescript
response_modalities: ['AUDIO', 'TEXT'],
```
Gemini produces both audio (for the user to hear) and text (for the transcript). This doubles the token cost and may affect latency slightly, but gives a full readable transcript.

**Decision: Use AUDIO + TEXT for cooking sessions.**

A cooking session is a valuable family record. Grandma's recipes, her technique notes, her stories — all captured in the transcript. The recipe reconstruction at session end (see `08-session-end.md`) depends heavily on the transcript quality. AUDIO + TEXT ensures the reconstruction has a complete record to work from. The additional latency cost is acceptable.

Update to session config in `03-gemini-session.md`:
```typescript
response_modalities: ['AUDIO', 'TEXT'],
```

---

## System Events in the Transcript

Certain events are written to `session_turns` as `role: 'system'` entries. These are not speech acts — they are session events that matter for the session record.

```typescript
private async writeSystemEvent(event: string, metadata?: Record<string, unknown>): Promise<void> {
  const turnNumber = await this.nextTurnNumber()

  this.forwardToolToBrain('write_session_turn', {
    session_id:  this.sessionState.sessionId,
    turn_number: turnNumber,
    role:        'system',
    content:     event,
    metadata:    JSON.stringify({ ts: Date.now(), ...metadata }),
  }).catch(() => {})
}
```

System events written during a cooking session:

| Event | Content | When |
|---|---|---|
| Session start | `"Cooking session started"` | On Gemini session open |
| Timer set | `"Timer set: {label} ({seconds}s)"` | After schedule_timer |
| Timer fired | `"Timer fired: {label}"` | When DO alarm fires |
| Timer cancelled | `"Timer cancelled: {label}"` | After cancel_timer |
| Gemini reconnect | `"Gemini session reconnected (attempt {n})"` | After each reconnect |
| Session end | `"Cooking session ended: {reason}"` | On session close |

---

## What a Cooking Session Transcript Looks Like

```
[system]  Cooking session started
[model]   Good morning! I can see your kitchen is all set up. What are we making today?
[user]    Today we're making doro wat. My grandmother's recipe.
[model]   Wonderful! Doro wat is such a beautiful dish. I can see you have the berbere ready. Let's start with the onions — how many are you using?
[user]    Four big ones.
[system]  Timer set: onions (600s)
[model]   I've started a 10-minute timer for the onions. They need to cook down really well — almost caramelized. I can see you're using a nice heavy pot, perfect for this.
[model]   Your onions are looking good. Keep stirring — I can see the edges are starting to catch. Lower the heat just a little.
[system]  Timer fired: onions
[model]   Your onion timer is done! They look perfectly caramelized. Now it's time to add your berbere.
```

This transcript gives the recipe reconstruction step (at session end) everything it needs: the dish, the ingredients, the technique, the timing, the corrections, the grandmother's notes.

---

## User Speech in the Transcript

Gemini's transcription of what the user said is available in the `input_transcription` field of Gemini Live server messages (when configured). If available, user speech is written as `role: 'user'` turns in the same way as model turns.

```typescript
if (msg.server_content?.input_transcription?.text) {
  await this.writeTurn(
    [{ text: msg.server_content.input_transcription.text }],
    'user',
  )
}
```

If Gemini does not provide input transcription (model-dependent), the transcript has model turns only. The recipe reconstruction can still reconstruct from the model's responses alone — Gemini's responses incorporate what the user said.
