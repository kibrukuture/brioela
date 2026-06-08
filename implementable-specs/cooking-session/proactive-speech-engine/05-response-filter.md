# Proactive Speech Engine — Response Filter

## Purpose

When the engine sends Gemini an observation prompt and Gemini responds, the response filter decides what to do with that response:

1. Is this a real observation or a silence signal? → forward or discard
2. How urgent is it? → urgent (deliver immediately) or advisory (deliver normally)
3. What was the topic? → add to no-repeat memory

The filter prevents three failure modes:
- **Gemini flooding the user** with generic observations ("the pan looks hot!") every 15 seconds
- **Gemini repeating itself** about the same thing it noticed 2 minutes ago
- **Gemini's silence** (the "ok" response) accidentally reaching the mobile as audio

---

## Silence Detection

```typescript
const SILENCE_PHRASES = [
  'ok', 'okay', 'ok.', 'okay.',
  'everything looks fine', 'looks good', 'all good',
  'nothing to report', "i don't see anything",
  "nothing urgent", "looks normal", "carry on",
]

function isSilent(response: string): boolean {
  const normalized = response.trim().toLowerCase().replace(/[.,!?]$/, '')
  return SILENCE_PHRASES.some(phrase => normalized === phrase || normalized.startsWith(phrase))
}
```

If `isSilent()` returns true:
- Do NOT forward audio to mobile
- Do NOT increment the "Gemini spoke" timer (silence responses don't count as speech)
- Log the check internally (for frequency controller post-observation cooldown)

---

## Urgency Classification

If the response is not silent, classify it:

```typescript
const URGENT_PATTERNS = [
  'smoke', 'smoking', 'burning', 'burnt', 'fire', 'flame',
  'overflow', 'overflowing', 'boiling over', 'too hot',
  'immediately', 'right now', 'quickly', 'careful',
]

function classifyUrgency(response: string): 'urgent' | 'advisory' {
  const lower = response.toLowerCase()
  return URGENT_PATTERNS.some(p => lower.includes(p)) ? 'urgent' : 'advisory'
}
```

**Urgent** responses:
- Mira session runtime delivers the audio immediately, interrupting any current audio playback on mobile
- Post-observation cooldown: 20 seconds

**Advisory** responses:
- Delivered normally after any current audio finishes
- Post-observation cooldown: 30 seconds

---

## No-Repeat Memory

The filter maintains a topic log — what Gemini has proactively commented on, with timestamps. Before the prompt builder constructs the next observation prompt, it reads this log to add "do not repeat these" context. The filter writes to this log after each non-silent response.

```typescript
interface TopicEntry {
  topic:      string      // extracted topic keyword
  saidAt:     number      // timestamp
  response:   string      // the first 100 chars of what Gemini said
}

class NoRepeatMemory {
  private entries: TopicEntry[] = []
  private MAX_ENTRIES = 20
  private REPEAT_WINDOW_MS = 3 * 60 * 1000  // 3 minutes — don't repeat within this window

  add(response: string): void {
    const topic = this.extractTopic(response)
    this.entries.push({ topic, saidAt: Date.now(), response: response.slice(0, 100) })
    if (this.entries.length > this.MAX_ENTRIES) this.entries.shift()
  }

  isRepeat(response: string): boolean {
    const topic = this.extractTopic(response)
    const cutoff = Date.now() - this.REPEAT_WINDOW_MS
    return this.entries.some(e => e.topic === topic && e.saidAt > cutoff)
  }

  getRecentTopics(): string[] {
    const cutoff = Date.now() - this.REPEAT_WINDOW_MS
    return this.entries
      .filter(e => e.saidAt > cutoff)
      .map(e => e.topic)
  }

  private extractTopic(response: string): string {
    // Simple keyword extraction — find the first food/cooking noun
    const TOPIC_KEYWORDS = [
      'onion', 'garlic', 'oil', 'meat', 'chicken', 'berbere', 'injera',
      'dough', 'heat', 'flame', 'stir', 'salt', 'water', 'sauce',
    ]
    const lower = response.toLowerCase()
    return TOPIC_KEYWORDS.find(k => lower.includes(k)) ?? 'general'
  }
}
```

**What no-repeat catches:**
Gemini says "your onions are starting to brown" at minute 5. At minute 7, the engine checks again. Gemini was going to say "I can see your onions are getting nicely golden" — a repeat of the same observation. The filter detects topic "onion" in both responses and marks the second as a repeat.

**What no-repeat does NOT block:**
If the onions were browning at minute 5, and at minute 12 they are now burning — that is a materially different observation even though the topic is the same. The urgency classifier will catch it as urgent and bypass the no-repeat check:

```typescript
function onObservationResponse(rawResponse: string): ObservationResponse {
  if (isSilent(rawResponse)) {
    return { forward: false, urgency: 'silent' }
  }

  const urgency = classifyUrgency(rawResponse)

  // Urgent responses bypass no-repeat check — safety is more important
  if (urgency === 'urgent') {
    this.noRepeatMemory.add(rawResponse)
    return { forward: true, urgency: 'urgent', topic: this.noRepeatMemory.extractTopic(rawResponse) }
  }

  // Advisory responses are checked against no-repeat
  if (this.noRepeatMemory.isRepeat(rawResponse)) {
    return { forward: false, urgency: 'silent' }   // discard — already said this
  }

  this.noRepeatMemory.add(rawResponse)
  return { forward: true, urgency: 'advisory', topic: this.noRepeatMemory.extractTopic(rawResponse) }
}
```

---

## Audio Discard Mechanism

When the filter returns `forward: false`, the Mira session runtime must prevent Gemini's audio from reaching the mobile. This is done by tracking whether the current Gemini output stream was triggered by an observation request:

```typescript
// In Mira session runtime
private pendingObservationRequest: ObservationRequest | null = null
private discardCurrentOutput: boolean = false

// When Gemini produces text output for a proactive observation turn
if (this.pendingObservationRequest && msg.server_content?.model_turn) {
  const textResponse = extractText(msg.server_content.model_turn.parts)
  const decision = this.speechEngine.onObservationResponse(textResponse)

  this.discardCurrentOutput = !decision.forward
  this.pendingObservationRequest = null
}

// When forwarding Gemini audio to mobile
if (!this.discardCurrentOutput) {
  this.mobileWs?.send(audioBytes)
}

// Reset on turn_complete
if (msg.server_content?.turn_complete) {
  this.discardCurrentOutput = false
}
```

---

## What the Response Filter Does NOT Do

- It does not block Gemini's responses to user-initiated turns — only proactive observation responses
- It does not modify Gemini's text or audio output — it either forwards or discards the entire turn
- It does not write to SQLite or agent_state
- It does not handle timer fire responses — those always forward (they are not observation requests)
