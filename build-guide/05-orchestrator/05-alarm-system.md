# Orchestrator — Alarm System

## What This File Covers

DO alarm dispatch, all alarm types, the `scheduled_alarms` table as the queue, keepAlive heartbeat, and the ambient intelligence loop that runs without any external cron.

---

## How DO Alarms Work

The Orchestrator calls `this.ctx.storage.setAlarm(timestamp)`. At that time, Cloudflare wakes the DO and calls `alarm()`. One alarm fires at a time — the next alarm is set inside the handler. No external scheduler. No cron job. No Upstash for per-user timed events.

```typescript
// brioela.orchestrator.agent.ts

override async alarm(): Promise<void> {
  await handleAlarm(this.db, this.env, this.ctx)
}
```

```typescript
// backend/src/agents/orchestrator/_handlers/alarm.handler.ts

export async function handleAlarm(
  db: DrizzleDB,
  env: Env,
  ctx: DurableObjectState,
): Promise<void> {
  // Check keepAlive first — takes priority over all other alarm logic
  const isKeepAlive = await ctx.storage.get<boolean>('keepAlive:active')
  if (isKeepAlive) {
    await ctx.storage.setAlarm(Date.now() + 20_000)
    return
  }

  // Find the next pending alarm in the queue
  const nextAlarm = db.select()
    .from(scheduledAlarms)
    .where(and(
      eq(scheduledAlarms.status, 'pending'),
      lte(scheduledAlarms.scheduledAt, Date.now()),
    ))
    .orderBy(asc(scheduledAlarms.scheduledAt))
    .limit(1)
    .get()

  if (!nextAlarm) return

  // Mark as running before execution — prevents double-fire if DO wakes twice
  db.update(scheduledAlarms)
    .set({ status: 'running' })
    .where(eq(scheduledAlarms.id, nextAlarm.id))
    .run()

  try {
    await dispatchAlarm(nextAlarm, db, env, ctx)
    db.update(scheduledAlarms)
      .set({ status: 'completed', completedAt: Date.now() })
      .where(eq(scheduledAlarms.id, nextAlarm.id))
      .run()
  } catch (err) {
    db.update(scheduledAlarms)
      .set({ status: 'failed', failureReason: String(err) })
      .where(eq(scheduledAlarms.id, nextAlarm.id))
      .run()
  }

  // Schedule next alarm for any remaining pending alarms
  const next = db.select({ scheduledAt: scheduledAlarms.scheduledAt })
    .from(scheduledAlarms)
    .where(eq(scheduledAlarms.status, 'pending'))
    .orderBy(asc(scheduledAlarms.scheduledAt))
    .limit(1)
    .get()

  if (next) {
    await ctx.storage.setAlarm(next.scheduledAt)
  }
}
```

---

## All Alarm Types

| Type | Trigger | What runs |
|---|---|---|
| `keep_alive` | Every 20s during active streaming session | Re-schedule self, return — prevents DO eviction |
| `session_watchdog` | 2h (chat) or 4h (cooking) after session open | Detect abandoned sessions, mark as abandoned |
| `curator_run` | Every 7 days | Spawn CuratorAgent sub-agent |
| `pattern_detection` | Every 14 days | Spawn PatternDetectionAgent sub-agent |
| `weekly_food_summary` | Every Sunday morning (user's local time) | Generate and push weekly summary notification |
| `sickness_followup` | 24h after `sickness_logged` event | Check if user still feels sick, surface probable culprits |
| `travel_preload` | 48h before travel departure date | Pre-load destination food intel into user_memory |
| `scan_followup` | 7 days after certain scans | "You scanned X a week ago — did you buy it?" |
| `recall_check` | Every 6h | Poll FDA/EFSA recall feeds, match against scan history |

---

## Dispatching

```typescript
// backend/src/agents/orchestrator/_handlers/alarm.handler.ts

async function dispatchAlarm(
  alarm: ScheduledAlarm,
  db: DrizzleDB,
  env: Env,
  ctx: DurableObjectState,
): Promise<void> {
  const payload = JSON.parse(alarm.payload)

  switch (alarm.type) {
    case 'session_watchdog':
      await handleSessionWatchdog(db, payload.sessionId)
      break

    case 'curator_run':
      await spawnCurator(db, env, ctx, payload.userId)
      break

    case 'pattern_detection':
      await spawnPatternDetection(db, env, ctx, payload.userId)
      break

    case 'weekly_food_summary':
      await generateWeeklySummary(db, env, payload.userId)
      await scheduleNextWeeklySummary(db, ctx)
      break

    case 'sickness_followup':
      await runSicknessFollowup(db, env, payload.userId, payload.eventId)
      break

    case 'travel_preload':
      await runTravelPreload(db, env, payload.userId, payload.destination, payload.departureDate)
      break

    case 'scan_followup':
      await runScanFollowup(db, env, payload.userId, payload.productId, payload.scanEventId)
      break

    case 'recall_check':
      await runRecallCheck(db, env, payload.userId)
      await scheduleNextRecallCheck(ctx)
      break

    default:
      console.warn(`Unknown alarm type: ${alarm.type}`)
  }
}
```

---

## Scheduling an Alarm From a Tool

The `schedule_user_alarm` tool writes to `scheduled_alarms` and also sets the DO's next alarm if the new alarm fires sooner than any existing pending alarm.

```typescript
// backend/src/agents/orchestrator/_tools/schedule-user-alarm.tool.ts

export const scheduleUserAlarmTool = (db: DrizzleDB, ctx: DurableObjectState) => tool({
  description: 'Schedule a time-based alarm. Use for cooking timers, sickness follow-ups, travel pre-loads, and any timed ambient action.',
  parameters: z.object({
    type:        z.string().describe('alarm type — e.g. sickness_followup, travel_preload, scan_followup'),
    payload:     z.record(z.unknown()).describe('data the alarm handler will receive'),
    scheduledAt: z.number().describe('unix timestamp ms when the alarm should fire'),
    label:       z.string().optional().describe('human-readable label for this alarm'),
  }),
  execute: async ({ type, payload, scheduledAt, label }) => {
    const id = crypto.randomUUID()

    db.insert(scheduledAlarms).values({
      id,
      type,
      payload:     JSON.stringify(payload),
      scheduledAt,
      label:       label ?? null,
      status:      'pending',
      createdAt:   Date.now(),
    }).run()

    // Update the DO's alarm if this fires sooner than what's already scheduled
    const currentAlarm = await ctx.storage.getAlarm()
    if (!currentAlarm || scheduledAt < currentAlarm) {
      await ctx.storage.setAlarm(scheduledAt)
    }

    return { id, type, scheduledAt, status: 'scheduled' }
  },
})
```

---

## First-Boot Alarm Initialization

When a user's Orchestrator DO is first created (their first interaction with Brioela), the recurring alarms are bootstrapped once:

```typescript
// In brioela.orchestrator.agent.ts constructor, after migration:

const isFirstBoot = !(await ctx.storage.get<boolean>('alarms:initialized'))
if (isFirstBoot) {
  await ctx.storage.put('alarms:initialized', true)

  // Curator — first run 7 days from now
  db.insert(scheduledAlarms).values({
    id: crypto.randomUUID(),
    type: 'curator_run',
    payload: JSON.stringify({ userId: this.userId }),
    scheduledAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    status: 'pending',
  }).run()

  // Pattern detection — first run 14 days from now
  db.insert(scheduledAlarms).values({
    id: crypto.randomUUID(),
    type: 'pattern_detection',
    payload: JSON.stringify({ userId: this.userId }),
    scheduledAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
    status: 'pending',
  }).run()

  // Recall check — first run 6 hours from now
  db.insert(scheduledAlarms).values({
    id: crypto.randomUUID(),
    type: 'recall_check',
    payload: JSON.stringify({ userId: this.userId }),
    scheduledAt: Date.now() + 6 * 60 * 60 * 1000,
    status: 'pending',
  }).run()

  // Set the DO alarm to the soonest pending alarm
  await ctx.storage.setAlarm(Date.now() + 6 * 60 * 60 * 1000)
}
```
