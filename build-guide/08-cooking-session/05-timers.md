# Cooking Session — Cooking Timers

## What This File Covers

Timer tool implementation, DO alarm mechanics for multiple concurrent timers, timer fire dispatch, cancellation, and cleanup at session end.

---

## How Timers Work

```
User: "set a timer for the eggs, 8 minutes"
Gemini: calls schedule_timer({ label: "eggs", seconds: 480 })
DO: schedules DO alarm at Date.now() + 480_000
DO: writes timer to DO storage (fast) + scheduled_alarms via Orchestrator (audit)
DO: returns { success: true, fires_in_seconds: 480 }
Gemini: "Done, I'll let you know in 8 minutes."

... 8 minutes pass ...

DO alarm fires → DO injects "eggs timer fired" message into Gemini
Gemini: "Your eggs are done! Take them off the heat."
```

DO alarms persist in Cloudflare's infrastructure and survive DO eviction. The timer fires at exactly the right moment whether the session has been running for 3 minutes or 43 minutes.

---

## Timer Tool — `schedule_timer`

Handled directly by CookingAgent DO — not forwarded to Orchestrator. Timer management requires immediate access to DO storage and DO alarm scheduling, which only the CookingAgent DO has.

```typescript
// backend/src/agents/cooking/_handlers/alarm.handler.ts

// In-memory timer registry — rebuilt from DO storage on eviction recovery
// activeTimers: Map<label, { alarmTime: number; alarmId: string }>

export async function scheduleTimer(
  args:      { label: string; seconds: number },
  cookingDo: CookingAgent,
): Promise<{ success: boolean; alarmId: string; fires_in_seconds: number }> {
  const { label, seconds } = args

  // Prevent duplicate labels
  if (cookingDo.activeTimers.has(label)) {
    throw new Error(`Timer "${label}" already exists. Cancel it first or use a different label.`)
  }

  if (seconds <= 0 || seconds > 4 * 60 * 60) {
    throw new Error(`Timer must be between 1 second and 4 hours.`)
  }

  const firesAt  = Date.now() + seconds * 1000
  const alarmId  = crypto.randomUUID()

  // Write to DO storage — survives eviction, fast synchronous access at alarm fire time
  await cookingDo.ctx.storage.put(`timer:${alarmId}`, {
    label,
    firesAt,
    sessionId: cookingDo.sessionState!.sessionId,
  })

  cookingDo.activeTimers.set(label, { alarmTime: firesAt, alarmId })

  // Reschedule the DO alarm for the earliest pending timer
  await rescheduleAlarm(cookingDo)

  // Also persist to scheduled_alarms table via Orchestrator (audit trail)
  // Fire-and-forget — timer functionality does not depend on this write completing
  cookingDo.ctx.waitUntil(
    forwardToolToOrchestrator('schedule_user_alarm', {
      alarm_id:   alarmId,
      label,
      fires_at:   firesAt,
      session_id: cookingDo.sessionState!.sessionId,
      alarm_type: 'cooking_timer',
    }, cookingDo.sessionState!, cookingDo.env).catch(() => {
      // Log failure but do not fail the timer
    })
  )

  return { success: true, alarmId, fires_in_seconds: seconds }
}
```

---

## One DO Alarm for Multiple Timers

A DO can only have one scheduled alarm at a time. With multiple concurrent timers (eggs + sauce + rest dough), the DO schedules the alarm for the NEXT timer to fire and reschedules after each one fires.

```typescript
async function rescheduleAlarm(cookingDo: CookingAgent): Promise<void> {
  // Find earliest pending timer
  let earliest: number | null = null
  for (const [, { alarmTime }] of cookingDo.activeTimers) {
    if (earliest === null || alarmTime < earliest) {
      earliest = alarmTime
    }
  }

  if (earliest !== null) {
    await cookingDo.ctx.storage.setAlarm(earliest)
  }
}
```

---

## Alarm Fire — `alarm()` Handler

When the DO alarm fires, it finds all due timers and injects them into the Gemini session one by one:

```typescript
// backend/src/agents/cooking/_handlers/alarm.handler.ts

export async function handleAlarm(cookingDo: CookingAgent): Promise<void> {
  const now = Date.now()
  const fired: string[] = []

  for (const [label, { alarmTime, alarmId }] of cookingDo.activeTimers) {
    if (alarmTime <= now + 500) {   // 500ms grace — fire if within 500ms of due time
      fired.push(label)

      // Remove from DO storage
      await cookingDo.ctx.storage.delete(`timer:${alarmId}`)
    }
  }

  // Remove from in-memory registry
  for (const label of fired) {
    cookingDo.activeTimers.delete(label)
  }

  // Inject each fired timer into Gemini
  for (const label of fired) {
    await injectTimerFireIntoGemini(label, cookingDo)
  }

  // Reschedule alarm for next pending timer
  await rescheduleAlarm(cookingDo)
}

async function injectTimerFireIntoGemini(
  label:     string,
  cookingDo: CookingAgent,
): Promise<void> {
  const ws = cookingDo.sessionState?.geminiWs
  if (!ws) return

  // Inject as client_content turn — Gemini treats this as a user message
  ws.send(JSON.stringify({
    client_content: {
      turns: [{
        role:  'user',
        parts: [{ text: `[TIMER FIRED: "${label}" is done]` }],
      }],
      turn_complete: true,   // Gemini must respond
    },
  }))
}
```

Gemini receives `[TIMER FIRED: "eggs" is done]` as a user turn and responds with voice — naturally, as if it remembered the timer itself.

---

## Cancellation — `cancel_timer`

```typescript
export async function cancelTimer(
  label:     string,
  cookingDo: CookingAgent,
): Promise<{ success: boolean; cancelled: boolean }> {
  const timer = cookingDo.activeTimers.get(label)
  if (!timer) {
    return { success: true, cancelled: false }  // already gone — not an error
  }

  cookingDo.activeTimers.delete(label)
  await cookingDo.ctx.storage.delete(`timer:${timer.alarmId}`)

  // Reschedule alarm — the cancelled timer may have been the next due one
  await rescheduleAlarm(cookingDo)

  return { success: true, cancelled: true }
}
```

---

## Session End — Cancel All Timers

```typescript
export async function cancelAllTimers(cookingDo: CookingAgent): Promise<void> {
  for (const [label] of cookingDo.activeTimers) {
    try { await cancelTimer(label, cookingDo) } catch {}
  }
  cookingDo.activeTimers.clear()
  await cookingDo.ctx.storage.deleteAlarm()   // remove DO alarm entirely
}
```

Called as step 4 of the session end sequence — before closing the Realtime room.

---

## DO Eviction Recovery — Rebuilding Timer State

If the DO is evicted mid-session, the in-memory `activeTimers` map is gone. Recovery reads it from DO storage:

```typescript
async function rebuildTimerState(cookingDo: CookingAgent): Promise<void> {
  // List all timer keys in DO storage
  const allKeys = await cookingDo.ctx.storage.list({ prefix: 'timer:' })

  for (const [key, value] of allKeys) {
    const { label, firesAt } = value as { label: string; firesAt: number }
    const alarmId = key.replace('timer:', '')

    if (firesAt > Date.now()) {
      // Timer still in the future — restore to active map
      cookingDo.activeTimers.set(label, { alarmTime: firesAt, alarmId })
    } else {
      // Timer already fired while DO was evicted — inject now and clean up
      await injectTimerFireIntoGemini(label, cookingDo)
      await cookingDo.ctx.storage.delete(key)
    }
  }

  // Reschedule alarm for any remaining timers
  await rescheduleAlarm(cookingDo)
}
```

This is called as part of `recover()` in the CookingAgent DO after eviction.
