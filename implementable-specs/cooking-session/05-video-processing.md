# Cooking Session — Video Frame Processing

## How Video Arrives at the DO

The Cloudflare Realtime WebSocket adapter pushes media from the SFU to the CookingAgent DO's `/stream` endpoint. The adapter delivers two types of binary frames:

1. **PCM audio** — continuous stream, 20ms chunks at 48kHz
2. **JPEG frames** — periodic, up to 1 FPS, from the mobile camera

The adapter sends a JSON control message before each frame to indicate what type follows:

```json
{ "type": "frame_metadata", "media_type": "audio", "duration_ms": 20 }
{ "type": "frame_metadata", "media_type": "video", "width": 640, "height": 480 }
```

The binary payload arrives in the next message. The DO tracks the last `media_type` from `frame_metadata` to know how to route the binary payload.

---

## Frame Routing in the DO

```typescript
private lastMediaType: 'audio' | 'video' | null = null

private async handleRealtimeMessage(event: MessageEvent): Promise<void> {
  if (typeof event.data === 'string') {
    // Control message
    const msg = JSON.parse(event.data)
    if (msg.type === 'frame_metadata') {
      this.lastMediaType = msg.media_type
    }
    return
  }

  // Binary payload
  if (!this.lastMediaType) return  // no metadata yet — skip

  if (this.lastMediaType === 'audio') {
    await this.sendAudioChunk(event.data as ArrayBuffer)
  } else if (this.lastMediaType === 'video') {
    await this.handleVideoFrame(event.data as ArrayBuffer)
  }

  this.lastMediaType = null  // reset after consuming
}
```

---

## Video Frame Processing

### Rate Limiting

The Cloudflare Realtime adapter sends up to 1 JPEG per second. Gemini's `client_content` channel also accepts up to 1 FPS for inline images. They are aligned — the DO forwards every frame it receives without additional rate limiting.

If the adapter ever sends faster than 1 FPS (adapter configuration error), the DO drops excess frames:

```typescript
private lastFrameSentAt = 0
private FRAME_MIN_INTERVAL_MS = 900  // allow up to ~1.1 FPS max

private async handleVideoFrame(jpegData: ArrayBuffer): Promise<void> {
  const now = Date.now()
  if (now - this.lastFrameSentAt < this.FRAME_MIN_INTERVAL_MS) {
    return  // drop frame — too soon
  }

  this.lastFrameSentAt = now
  await this.sendVideoFrame(jpegData)
}
```

### Frame Injection Into Gemini

Frames are injected as `client_content` inline images. NOT as `realtime_input.video`.

Why: `realtime_input.video` triggers Gemini's 2-minute audio+video session hard limit. `client_content` with `inline_data` is treated as contextual image input within an audio session — no session time cap applies. This is not a workaround; it is the documented distinction between streaming video and periodic image context.

```typescript
private async sendVideoFrame(jpegData: ArrayBuffer): Promise<void> {
  if (!this.sessionState.geminiWs) return
  if (this.sessionState.status !== 'active') return

  const base64Image = this.toBase64(jpegData)

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
      turn_complete: false,
      // turn_complete: false = context update, not a user message requiring response
      // Gemini sees the frame and will reference it naturally in its next response
    },
  }))
}
```

### What Gemini Does With Frames

Gemini uses frames as visual context. It can:
- Notice the oil temperature from the smoke/shimmer in the pan
- See that the onions are browning and remind the user to stir
- Spot an ingredient the user said they added and confirm it
- Observe unsafe technique (knife position, open flame too high)

Gemini does NOT respond to every frame. `turn_complete: false` means the frame is informational context. Gemini will naturally weave what it sees into its ongoing coaching. If it sees something urgent (smoking oil, burning food), it will interrupt its own output (barge-out) to alert the user.

---

## Frame Quality and Size

The Cloudflare Realtime adapter delivers JPEG at the quality configured in `01-room-lifecycle.md`. Recommended configuration:

```json
{ "format": "jpeg", "fps": 1, "quality": 70, "max_width": 640 }
```

- 640px wide: enough for Gemini to see food detail, pan color, ingredient texture
- Quality 70: 15–40KB per frame — well within Gemini's inline_data payload limits
- 1 FPS: matched to Gemini's max inline image rate

At 40KB/frame and 1 FPS over a 45-minute session: ~108MB of image data sent to Gemini. This is within expected usage. Gemini's context window per session handles this — the model sees and forgets frames as the session progresses; frames do not accumulate in context.

---

## Frame Pause During Reconnection

When the Gemini session is reconnecting (`status === 'reconnecting'`), the DO stops forwarding frames to Gemini. Frames from the adapter are dropped silently during reconnection. Audio is also paused during reconnection.

```typescript
private async sendVideoFrame(jpegData: ArrayBuffer): Promise<void> {
  if (!this.sessionState.geminiWs) return
  if (this.sessionState.status !== 'active') return  // drops during 'reconnecting'
  // ...
}
```

Once reconnection completes and `status` returns to `'active'`, the adapter resumes delivering frames and the DO resumes forwarding them.

---

## Frame Handling During DO Eviction Recovery

If the DO is evicted mid-session and restarts:
1. The Cloudflare Realtime adapter reconnects to the DO (the adapter will retry the WebSocket connection per its configured retry policy)
2. The DO recovers from SQLite (see `02-cooking-agent.md`)
3. The DO reopens the Gemini session
4. Frame forwarding resumes immediately when `status` reaches `'active'`

No frames are "missed" in a meaningful sense — the cooking session continues. The user experiences a brief pause (the reconnection window) and then the AI continues.

---

## What Frames Are NOT Used For

- Frames are NOT stored anywhere. No frame is written to SQLite, R2, or any storage.
- Frames are NOT part of the transcript. The session_turns table does not contain image data.
- Frames are NOT used for recipe reconstruction. The recipe is reconstructed from the conversation transcript, not from the video.
- Frames are NOT accessible to the Curator or any background process.

The frame stream is transient: mobile camera → SFU → DO → Gemini. It exists only in memory during the live session. Nothing persists.
