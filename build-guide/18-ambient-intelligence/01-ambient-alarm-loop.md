# Ambient Intelligence — Ambient Alarm Loop

## What This File Covers

The shared background execution model for Ambient Intelligence: Brain DO alarms, idle checks, candidate queues, and why there is no separate cron or dashboard system.

---

## Core Rule

Ambient Intelligence runs from the user's Brain DO. It does not create a new backend service.

The Brain already owns:

- private SQLite memory
- scheduled alarms
- session history
- constraints
- recipes
- user facts
- tool forwarding

So ambient jobs run where the user's private context already lives.

---

## Shared Cadence

The ambient layer uses the existing DO alarm queue from `05-brain/05-alarm-system.md`.

Existing alarm types involved:

| Alarm | Role in Ambient Intelligence |
|---|---|
| `behavior_pattern_detection` | behavioral pattern pass and wellbeing correlations |
| `brain_maintenance_run` | memory maintenance and guest-pattern promotion support |
| `weekly_food_summary` | one possible surface for Time Machine moments |
| `travel_preload` | destination food intelligence preload |

Ambient features do not each need their own scheduler. They register work into the same `scheduled_alarms` queue and follow the same one-alarm-at-a-time dispatch model.

---

## Idle Rule

Ambient jobs should not interrupt active user sessions.

Before running any write-heavy ambient pass, check for active sessions in the last 2 hours:

```typescript
type AmbientIdleCheck = {
  activeSessionId: string | null
  lastSessionStartedAt: number | null
  canRunNow: boolean
  rescheduleAt: number | null
}
```

Rules:

- Pattern reads may run while active only if they do not surface anything.
- Memory writes should wait until idle unless the user explicitly triggered the action.
- No push or in-app intervention should appear during cooking, voice, live scan, or Bela sessions unless it is critical safety.
- If blocked by activity, reschedule 2 hours later.

---

## Candidate Queues

Ambient Intelligence should compute candidates before surfacing them.

Candidate types:

- pattern intervention candidate
- travel preload candidate
- time machine moment candidate
- guest-pattern memory candidate

Candidate queues prevent raw background inference from immediately becoming user-facing copy.

```typescript
type AmbientCandidate = {
  id: string
  kind: "behavior_pattern_intervention" | "travel_preload" | "time_machine_moment" | "guest_memory_promotion"
  payloadJson: string
  confidence: number
  priority: "low" | "medium" | "high"
  createdAt: number
  expiresAt: number | null
  surfacedAt: number | null
  status: "candidate" | "surfaced" | "dismissed" | "expired"
}
```

Implementation can store candidates in feature-specific tables or `agent_state` for the first version. If the schema grows, create explicit tables inside the Brain SQLite migration.

---

## No Dashboard

Ambient Intelligence is not a dashboard feature.

It should surface in existing moments:

- during a relevant conversation
- below a scan result
- inside a recipe open
- in weekly summary
- on destination map arrival
- during cooking when a guest constraint matters

The user should feel Brioela remembered and prepared, not that they need to manage a control panel.

---

## Alarm Dispatch Shape

Ambient alarm handlers should be small dispatchers:

```typescript
async function runAmbientPass(input: {
  userId: string
  pass: "patterns" | "time_machine" | "guest_review"
  now: number
}) {
  const idle = await checkAmbientIdle(input.userId)
  if (!idle.canRunNow) {
    await rescheduleAmbientPass(input.pass, idle.rescheduleAt!)
    return
  }

  switch (input.pass) {
    case "patterns":
      await runBehaviorPatternPass(input.userId, input.now)
      break
    case "time_machine":
      await buildTimeMachineCandidates(input.userId, input.now)
      break
    case "guest_review":
      await reviewGuestSessionArchive(input.userId, input.now)
      break
  }
}
```

Travel preload is scheduled from a detected travel intent and can run before departure even if the weekly ambient pass has not arrived.

---

## Failure Behavior

Ambient failures should be quiet.

- Mark the alarm failed with `failure_reason`.
- Do not notify the user.
- Retry only if the job is still useful.
- Expire stale candidates instead of surfacing old advice.
- Never write low-confidence inference as user memory just because a retry failed.

Ambient Intelligence is valuable because it is quiet. A failed ambient job should not become user-visible noise.
