# Brain — Alarm System

## What This File Covers

Current rule: `scheduled_alarms` is the product/audit ledger, and Agents SDK `schedule()` is the preferred wake/callback mechanism. Older raw `ctx.storage.setAlarm()` examples in this file are fallback guidance only for behavior the SDK cannot express.

---

## How Scheduled Alarm Wakeups Work

The Brain creates a `scheduled_alarms` row, then schedules a small SDK callback payload like `{ scheduledAlarmId }`. The callback loads the row, checks status for idempotency, dispatches the work, and records lifecycle/action outcome fields. Raw DO alarms are at-least-once and single-slot; use them only as fallback plumbing.

```typescript
// backend/src/agents/brain/_handlers/alarm.handler.ts

export async function runScheduledAlarm(
  agent: BrioelaBrain,
  payload: { scheduledAlarmId: string },
): Promise<void> {
  const alarm = agent.db.select()
    .from(scheduledAlarms)
    .where(eq(scheduledAlarms.id, payload.scheduledAlarmId))
    .get()

  if (!alarm || alarm.status !== 'pending') return

  // Mark as processing before execution — guards at-least-once callback delivery.
  agent.db.update(scheduledAlarms)
    .set({ status: 'processing', startedAt: Date.now(), attempts: alarm.attempts + 1 })
    .where(and(eq(scheduledAlarms.id, alarm.id), eq(scheduledAlarms.status, 'pending')))
    .run()

  try {
    await dispatchAlarm(alarm, agent)
    agent.db.update(scheduledAlarms)
      .set({ status: 'completed', completedAt: Date.now() })
      .where(eq(scheduledAlarms.id, alarm.id))
      .run()
  } catch (err) {
    agent.db.update(scheduledAlarms)
      .set({ status: 'failed', failureReason: String(err) })
      .where(eq(scheduledAlarms.id, alarm.id))
      .run()
  }
}
```

---

## All Alarm Types

| Type | Trigger | What runs |
|---|---|---|
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
// backend/src/agents/brain/_handlers/alarm.handler.ts

async function dispatchAlarm(
  alarm: ScheduledAlarm,
  agent: BrioelaBrain,
): Promise<void> {
  const payload = JSON.parse(alarm.payload)

  switch (alarm.alarmType) {
    case 'session_watchdog':
      await handleSessionWatchdog(agent.db, payload.sessionId)
      break

    case 'curator_run':
      await spawnCurator(agent, payload.userId)
      break

    case 'pattern_detection':
      await spawnPatternDetection(agent, payload.userId)
      break

    case 'weekly_food_summary':
      await generateWeeklySummary(agent, payload.userId)
      await scheduleNextWeeklySummary(agent)
      break

    case 'sickness_followup':
      await runSicknessFollowup(agent, payload.userId, payload.eventId)
      break

    case 'travel_preload':
      await runTravelPreload(agent, payload.userId, payload.destination, payload.departureDate)
      break

    case 'scan_followup':
      await runScanFollowup(agent, payload.userId, payload.productId, payload.scanEventId)
      break

    case 'recall_check':
      await runRecallCheck(agent, payload.userId)
      await scheduleNextRecallCheck(agent)
      break

    default:
      console.warn(`Unknown alarm type: ${alarm.alarmType}`)
  }
}
```

---

## Scheduling an Alarm From a Tool

The `schedule_user_alarm` tool writes to `scheduled_alarms` and also creates an Agents SDK schedule with a tiny pointer payload.

```typescript
// backend/src/agents/brain/_tools/schedule-user-alarm.tool.ts

export const scheduleUserAlarmTool = (agent: BrioelaBrain) => tool({
  description: 'Schedule a time-based alarm. Use for cooking timers, sickness follow-ups, travel pre-loads, and any timed ambient action.',
  parameters: z.object({
    alarmType:   z.string().describe('alarm type — e.g. sickness_followup, travel_preload, scan_followup'),
    payload:     z.record(z.unknown()).describe('data the alarm handler will receive'),
    scheduledAt: z.number().describe('unix timestamp ms when the alarm should fire'),
    label:       z.string().optional().describe('human-readable label for this alarm'),
  }),
  execute: async ({ alarmType, payload, scheduledAt, label }) => {
    const id = crypto.randomUUID()

    agent.db.insert(scheduledAlarms).values({
      id,
      alarmType,
      payload:     JSON.stringify(payload),
      scheduledAt,
      label:       label ?? null,
      status:      'pending',
      createdAt:   Date.now(),
    }).run()

    const schedule = await agent.schedule(
      new Date(scheduledAt),
      'runScheduledAlarm',
      { scheduledAlarmId: id },
      { idempotent: true },
    )

    agent.db.update(scheduledAlarms)
      .set({ sdkScheduleId: schedule.id, updatedAt: Date.now() })
      .where(eq(scheduledAlarms.id, id))
      .run()

    return { id, alarmType, scheduledAt, status: 'scheduled' }
  },
})
```

---

## First-Boot Alarm Initialization

When a user's Brain Agent is first created (their first interaction with Brioela), the recurring alarm ledger rows and SDK schedules are bootstrapped once:

```typescript
// In brioela.brain.agent.ts first-boot method, after migration:

const isFirstBoot = !(await this.ctx.storage.get<boolean>('alarms:initialized'))
if (isFirstBoot) {
  await this.ctx.storage.put('alarms:initialized', true)

  // Curator — first run 7 days from now
  await scheduleUserAlarm({
    id: crypto.randomUUID(),
    alarmType: 'curator_run',
    payload: JSON.stringify({ userId: this.userId }),
    scheduledAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
  })

  // Pattern detection — first run 14 days from now
  await scheduleUserAlarm({
    id: crypto.randomUUID(),
    alarmType: 'pattern_detection',
    payload: JSON.stringify({ userId: this.userId }),
    scheduledAt: Date.now() + 14 * 24 * 60 * 60 * 1000,
  })

  // Recall check — first run 6 hours from now
  await scheduleUserAlarm({
    id: crypto.randomUUID(),
    alarmType: 'recall_check',
    payload: JSON.stringify({ userId: this.userId }),
    scheduledAt: Date.now() + 6 * 60 * 60 * 1000,
  })
}
```
