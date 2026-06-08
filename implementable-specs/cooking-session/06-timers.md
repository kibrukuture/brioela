# Cooking Session — Cooking Timers

## How Timers Work in a Cooking Session

Timers are the most time-sensitive feature in the cooking session. When Gemini sets a timer, the timer must fire at exactly the right moment — whether the session has been running for 3 minutes or 43 minutes. The DO alarm mechanism provides this precision because DO alarms persist in Cloudflare's infrastructure, survive DO eviction, and fire exactly when scheduled.

The flow:

```
User: "set a timer for the eggs, 8 minutes"
Gemini: calls schedule_timer({ label: "eggs", seconds: 480 })
DO: schedules DO alarm at Date.now() + 480_000
DO: writes alarm to scheduled_alarms table
DO: returns { success: true, fires_in_seconds: 480 } to Gemini
Gemini: "Done, I'll let you know in 8 minutes when your eggs are ready."

... 8 minutes pass ...

DO alarm fires → DO injects "Eggs timer fired" message into Gemini session
Gemini: speaks "Your eggs are done! Take them off the heat."
```

---

## Timer Tool Implementation

`schedule_timer` is handled directly by the CookingAgent DO — not forwarded to the Brain. The DO has direct access to its own alarm mechanism.

```typescript
private activeTimers = new Map<string, { alarmTime: number; alarmId: string }>()

async scheduleTimer(label: string, seconds: number): Promise<string> {
  // Check for duplicate label
  if (this.activeTimers.has(label)) {
    throw new Error(`Timer already exists: "${label}". Cancel it first or use a different label.`)
  }

  const firesAt  = Date.now() + seconds * 1000
  const alarmId  = crypto.randomUUID()

  // Schedule DO alarm
  // DO.alarm() fires at the closest scheduled time — we store per-timer state
  // in scheduled_alarms to know WHICH timer fired when the alarm triggers
  await this.state.storage.put(`timer:${alarmId}`, {
    label,
    firesAt,
    sessionId: this.sessionState.sessionId,
  })

  // Schedule the alarm for the earliest pending timer
  await this.rescheduleAlarm()

  // Persist to scheduled_alarms table via Brain
  await this.forwardToolToBrain('schedule_user_alarm', {
    alarm_id:   alarmId,
    label,
    fires_at:   firesAt,
    session_id: this.sessionState.sessionId,
    alarm_type: 'cooking_timer',
  })

  this.activeTimers.set(label, { alarmTime: firesAt, alarmId })

  return alarmId
}
```

### Why DO Storage for Timer State (Not Just SQLite)

The DO alarm fires even if the DO was evicted and restarted. When the DO restarts, it needs to know which timer fired without making an async SQLite call in the synchronous alarm handler. `state.storage` (Durable Object storage) provides synchronous-ish access inside the alarm handler. Timer metadata is stored in DO storage for fast access at alarm fire time, and also persisted to `scheduled_alarms` for audit and recovery.

---

## Alarm Scheduling — One Alarm for Multiple Timers

A DO can only have one scheduled alarm at a time. With multiple concurrent timers (eggs + sauce + dough), the DO must schedule the alarm for the NEXT timer to fire and then reschedule after each one fires.

```typescript
private async rescheduleAlarm(): Promise<void> {
  // Find the earliest pending timer
  let earliest: { label: string; alarmId: string; firesAt: number } | null = null

  for (const [label, timer] of this.activeTimers) {
    if (!earliest || timer.alarmTime < earliest.firesAt) {
      earliest = { label, alarmId: timer.alarmId, firesAt: timer.alarmTime }
    }
  }

  if (!earliest) {
    // No pending timers — cancel any existing alarm
    await this.state.storage.deleteAlarm()
    return
  }

  // Schedule alarm for the earliest timer
  await this.state.storage.setAlarm(earliest.firesAt)
}
```

---

## When the Alarm Fires

```typescript
async alarm(): Promise<void> {
  const now = Date.now()

  // Find all timers that have fired (firesAt <= now)
  const fired: string[] = []

  for (const [label, timer] of this.activeTimers) {
    if (timer.alarmTime <= now + 1000) {  // 1s grace — alarm may fire slightly early
      fired.push(label)
    }
  }

  for (const label of fired) {
    await this.fireTimer(label)
  }

  // Reschedule for any remaining timers
  await this.rescheduleAlarm()
}

private async fireTimer(label: string): Promise<void> {
  const timer = this.activeTimers.get(label)
  if (!timer) return

  this.activeTimers.delete(label)

  // Clear from DO storage
  await this.state.storage.delete(`timer:${timer.alarmId}`)

  // Mark as fired in scheduled_alarms
  await this.forwardToolToBrain('cancel_user_alarm', {
    alarm_id: timer.alarmId,
    reason:   'fired',
  })

  // Inject into active Gemini session
  if (this.sessionState.geminiWs && this.sessionState.status === 'active') {
    this.sessionState.geminiWs.send(JSON.stringify({
      client_content: {
        turns: [{
          role:  'user',
          parts: [{
            text: `[SYSTEM: Timer fired — "${label}" is done. Alert the user now.]`,
          }],
        }],
        turn_complete: true,  // this IS a complete turn — Gemini should respond
      },
    }))
  }
  // If Gemini session is not active (reconnecting), the timer fire is logged
  // and injected as a context note when the session reconnects
}
```

---

## Timer Cancellation

```typescript
async cancelTimer(label: string): Promise<void> {
  const timer = this.activeTimers.get(label)
  if (!timer) {
    throw new Error(`No active timer with label: "${label}"`)
  }

  this.activeTimers.delete(label)
  await this.state.storage.delete(`timer:${timer.alarmId}`)

  await this.forwardToolToBrain('cancel_user_alarm', {
    alarm_id: timer.alarmId,
    reason:   'user_cancelled',
  })

  await this.rescheduleAlarm()
}
```

---

## Timer State Recovery After DO Eviction

If the DO is evicted mid-session, DO alarms still fire (Cloudflare runs them even if the DO is not in memory). On the next wake from the alarm, the DO cold-starts and calls `alarm()`.

The timer state needs to be reconstructable on cold start:

```typescript
private async restoreTimers(): Promise<void> {
  // Restore from DO storage — all timer:* keys
  const stored = await this.state.storage.list({ prefix: 'timer:' })

  for (const [key, value] of stored) {
    const timerData = value as { label: string; firesAt: number; alarmId: string }
    if (timerData.firesAt > Date.now()) {
      // Timer has not fired yet — restore it
      this.activeTimers.set(timerData.label, {
        alarmTime: timerData.firesAt,
        alarmId:   timerData.alarmId,
      })
    }
    // If firesAt is in the past — it fired while DO was evicted
    // The alarm() handler will catch it via the 1s grace window
  }
}
```

`restoreTimers()` is called in `recover()` before reopening the Gemini session.

---

## Timer Fired While Gemini Was Reconnecting

If the alarm fires while the Gemini session is reconnecting (`status === 'reconnecting'`), the timer fire message is queued and injected once the Gemini session is re-established:

```typescript
private pendingTimerFires: string[] = []  // labels of timers that fired during reconnect

private async fireTimer(label: string): Promise<void> {
  // ...
  if (this.sessionState.status !== 'active') {
    this.pendingTimerFires.push(label)
    return
  }
  // inject immediately if active
  this.injectTimerFire(label)
}

// Called after successful Gemini reconnect
private async drainPendingTimerFires(): Promise<void> {
  for (const label of this.pendingTimerFires) {
    this.injectTimerFire(label)
  }
  this.pendingTimerFires = []
}
```

---

## Concurrent Timer Example

Grandma is making doro wat and injera simultaneously:

```
Timer 1: "eggs" — 8 minutes (480s) → alarm at T+480s
Timer 2: "injera ferment" — 30 minutes (1800s) → alarm at T+1800s
Timer 3: "onions" — 3 minutes (180s) → alarm at T+180s
```

DO alarm is set for T+180s (earliest). When it fires:
1. `fireTimer("onions")` — Gemini notified
2. `rescheduleAlarm()` — alarm reset to T+480s
3. At T+480s: `fireTimer("eggs")` — Gemini notified
4. `rescheduleAlarm()` — alarm reset to T+1800s
5. At T+1800s: `fireTimer("injera ferment")` — Gemini notified
6. `rescheduleAlarm()` — no pending timers, alarm cancelled
