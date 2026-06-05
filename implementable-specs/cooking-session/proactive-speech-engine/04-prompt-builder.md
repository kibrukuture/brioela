# Proactive Speech Engine — Prompt Builder

## Purpose

The prompt builder constructs the exact text sent to Gemini as a `client_content` turn when the engine decides to make an observation. The prompt is the difference between Gemini behaving like a thoughtful coach and Gemini generating a generic response.

---

## Two Prompt Types

### Urgent Prompt

Used when `urgencySignal: true` from the visual change detector. Designed to produce an immediate, specific, safety-focused response.

```typescript
function buildUrgentPrompt(context: ObservationContext): string {
  return [
    `[URGENT KITCHEN CHECK]`,
    `Something significant just changed in the kitchen.`,
    `Look at what you see right now and immediately tell ${context.userName} what you notice.`,
    `If it is dangerous (smoke, burning, overflow, fire) — say so directly and urgently.`,
    `If it turns out to be nothing serious, say so briefly and reassuringly.`,
    `Respond now. Do not wait.`,
  ].join(' ')
}
```

### Advisory Prompt

Used for normal proactive observation — periodic check when the user has been silent and the kitchen may have progressed. Designed to produce a relevant comment IF something is worth saying, and silence if nothing is.

```typescript
function buildAdvisoryPrompt(context: ObservationContext): string {
  const parts: string[] = ['[KITCHEN OBSERVATION]']

  // Timer context
  if (context.activeTimers.length > 0) {
    const timerList = context.activeTimers.map(t => `"${t.label}" (${t.remainingSeconds}s left)`).join(', ')
    parts.push(`Active timers: ${timerList}.`)
  }

  // Silence context
  const silenceMin = Math.floor(context.silenceMs / 60_000)
  const silenceSec = Math.floor((context.silenceMs % 60_000) / 1_000)
  if (silenceMin > 0) {
    parts.push(`${context.userName} has been quiet for ${silenceMin} minute${silenceMin > 1 ? 's' : ''}.`)
  } else {
    parts.push(`${context.userName} has been quiet for ${silenceSec} seconds.`)
  }

  // Phase context
  const phaseHints: Record<CookingPhase, string> = {
    prep:      'They are in the preparation phase.',
    active:    'They are actively cooking.',
    simmering: 'Something is simmering or cooking slowly.',
    finishing: 'They appear to be finishing the dish.',
  }
  parts.push(phaseHints[context.phase])

  // The actual instruction
  parts.push([
    `Look at what you see in the kitchen right now.`,
    `If you notice something worth mentioning — food ready to flip, technique to suggest,`,
    `something looking done or not done, an ingredient to add — say it naturally and briefly.`,
    `If everything looks fine and there is nothing useful to add, respond with exactly: ok`,
    `Do not explain why you are saying ok. Do not narrate your observation process.`,
    `Either say something useful or say: ok`,
  ].join(' '))

  return parts.join('\n')
}
```

---

## "ok" as the Silence Signal

Gemini is instructed to respond with exactly "ok" when it has nothing worth saying. This is the silence signal that the response filter (`05-response-filter.md`) checks. "ok" means: I looked, I see nothing urgent, stay quiet.

Why "ok" and not silence? Gemini cannot produce zero output when it receives a `turn_complete: true` message — it will always generate something. "ok" is the shortest, most unambiguous silence signal. The response filter catches it before any audio is sent to the mobile.

**Alternative silence signals that the filter also catches:**
- "ok." (with period)
- "Okay." 
- "Everything looks fine."
- "Looks good."
- "Nothing to report."
- "All good."

All of these are treated as silence by the response filter. The filter uses a short list of known silence phrases, not exact string matching.

---

## Context Object

```typescript
interface ObservationContext {
  userName:       string
  phase:          CookingPhase
  silenceMs:      number
  activeTimers:   Array<{ label: string; remainingSeconds: number }>
  recentTopics:   string[]     // topics Gemini already commented on (for prompt enrichment)
}
```

When `recentTopics` contains items, the prompt appends:

```
You already mentioned: [topic list]. Do not repeat these unless something significantly changed.
```

This prevents Gemini from saying "your onions are browning" three times in a row. The no-repeat list lives in the response filter — see `05-response-filter.md`.

---

## Milestone Prompts

A special prompt type triggered by specific events — not by the frequency controller, but by CookingAgent event hooks.

### Timer Fire Milestone

When a cooking timer fires, the CookingAgent injects the timer alert into Gemini directly (see `06-timers.md`). The proactive engine does not handle timer fires — the CookingAgent handles those directly to ensure immediate response.

### Long Cook Complete

When a simmering phase has been running for a long time and the visual change score suddenly increases (food is starting to look done), the engine can emit a milestone prompt:

```typescript
function buildMilestonePrompt(context: ObservationContext, milestone: string): string {
  return [
    `[MILESTONE CHECK]`,
    `${milestone}`,
    `Look at what you see and tell ${context.userName} what you observe.`,
    `Keep it warm and brief — acknowledge the moment.`,
  ].join(' ')
}
```

Example milestone: `"The visual scene changed significantly after a long quiet period — the dish may be ready."`

---

## What the Prompt Builder Does NOT Do

- It does not decide whether to send the prompt — the frequency controller does that
- It does not filter the response — the response filter does that
- It does not track what was said — the response filter does that
- It does not write to SQLite or log anything
