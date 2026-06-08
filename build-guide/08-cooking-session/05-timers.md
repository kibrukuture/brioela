# Cooking Session — Cooking Timers

## What This File Covers

Timer tool implementation, Agents SDK schedule mechanics for concurrent timers, timer fire dispatch, cancellation, and cleanup at session end.

---

## How Timers Work

```
User: "set a timer for the eggs, 8 minutes"
Gemini: calls schedule_timer({ label: "eggs", seconds: 480 })
CookingAgent: writes timer row to local Agent SQLite
CookingAgent: calls schedule(new Date(firesAt), "fireCookingTimer", { timerId })
CookingAgent: returns { success: true, fires_in_seconds: 480 }
Gemini: "Done, I'll let you know in 8 minutes."

... 8 minutes pass ...

Agents SDK scheduled callback fires → CookingAgent injects "eggs timer fired" message into Gemini
Gemini: "Your eggs are done! Take them off the heat."
```

Agents SDK schedules are durable Agent runtime callbacks. Delivery is at-least-once, not exactly-once, so timer handlers must be idempotent and guarded by persisted timer status.

---

## Timer Tool — `schedule_timer`

Handled directly by CookingAgent — not forwarded to Brain for firing. Timer management requires immediate access to the live Gemini session and local Agent storage. Brain can receive an audit mirror, but it is not the source of timer firing.

```typescript
// backend/src/agents/cooking/_handlers/alarm.handler.ts

// In-memory timer registry — rebuilt from local Agent SQLite on eviction recovery
// activeTimers: Map<label, { firesAt: number; timerId: string; sdkScheduleId: string }>

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
  const timerId  = crypto.randomUUID()

  // Write local timer row first — survives eviction and guards at-least-once callbacks.
  await cookingDo.sql.exec(
    `INSERT INTO cooking_timers (id, session_id, label, fires_at, status, created_at)
     VALUES (?, ?, ?, ?, 'pending', ?)`,
    timerId,
    cookingDo.sessionState!.sessionId,
    label,
    firesAt,
    Date.now(),
  )

  const schedule = await cookingDo.schedule(
    new Date(firesAt),
    'fireCookingTimer',
    { timerId },
    { idempotent: true },
  )

  await cookingDo.sql.exec(
    `UPDATE cooking_timers SET sdk_schedule_id = ? WHERE id = ?`,
    schedule.id,
    timerId,
  )

  cookingDo.activeTimers.set(label, { firesAt, timerId, sdkScheduleId: schedule.id })

  // Also persist to scheduled_alarms table via Brain (audit trail)
  // Fire-and-forget — timer functionality does not depend on this write completing
  cookingDo.ctx.waitUntil(
    forwardToolToBrain('schedule_user_alarm', {
      alarm_id:   timerId,
      label,
      fires_at:   firesAt,
      session_id: cookingDo.sessionState!.sessionId,
      alarm_type: 'cooking_timer',
    }, cookingDo.sessionState!, cookingDo.env).catch(() => {
      // Log failure but do not fail the timer
    })
  )

  return { success: true, alarmId: timerId, fires_in_seconds: seconds }
}
```

---

## One Schedule Per Timer

Agents SDK multiplexes durable schedules over the underlying DO alarm slot. CookingAgent creates one SDK schedule per timer and stores `sdk_schedule_id` for cancellation/debugging.

```typescript
type CookingTimerRow = {
  id: string
  sessionId: string
  label: string
  firesAt: number
  status: 'pending' | 'fired' | 'cancelled'
  sdkScheduleId: string | null
}
```

---

## Timer Fire — Scheduled Callback

When the SDK schedule fires, it loads the timer row and no-ops unless it is still pending:

```typescript
// backend/src/agents/cooking/_handlers/alarm.handler.ts

export async function fireCookingTimer(
  cookingDo: CookingAgent,
  payload: { timerId: string },
): Promise<void> {
  const timer = await cookingDo.sql.exec(
    `SELECT id, label, status FROM cooking_timers WHERE id = ?`,
    payload.timerId,
  ).one<{ id: string; label: string; status: string }>()

  if (!timer || timer.status !== 'pending') return

  await cookingDo.sql.exec(
    `UPDATE cooking_timers SET status = 'fired', fired_at = ? WHERE id = ? AND status = 'pending'`,
    Date.now(),
    timer.id,
  )

  cookingDo.activeTimers.delete(timer.label)
  await injectTimerFireIntoGemini(timer.label, cookingDo)
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
  await cookingDo.sql.exec(
    `UPDATE cooking_timers SET status = 'cancelled', cancelled_at = ? WHERE id = ? AND status = 'pending'`,
    Date.now(),
    timer.timerId,
  )
  await cookingDo.cancelSchedule(timer.sdkScheduleId)

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
  // SDK schedules are cancelled per timer. No raw DO alarm cleanup is needed here.
}
```

Called as step 4 of the session end sequence — before closing the Realtime room.

---

## Eviction Recovery — Rebuilding Timer State

If the Agent is evicted mid-session, the in-memory `activeTimers` map is gone. Recovery reads it from local Agent SQLite:

```typescript
async function rebuildTimerState(cookingDo: CookingAgent): Promise<void> {
  const rows = await cookingDo.sql.exec(
    `SELECT id, label, fires_at, sdk_schedule_id FROM cooking_timers WHERE status = 'pending'`,
  ).toArray<{ id: string; label: string; fires_at: number; sdk_schedule_id: string }>()

  for (const row of rows) {
    cookingDo.activeTimers.set(row.label, {
      firesAt: row.fires_at,
      timerId: row.id,
      sdkScheduleId: row.sdk_schedule_id,
    })
  }
}
```

This is called as part of `recover()` in the CookingAgent DO after eviction.
