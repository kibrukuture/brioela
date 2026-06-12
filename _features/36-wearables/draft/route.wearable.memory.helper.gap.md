# Draft: route.wearable.memory.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/wearables/route.wearable.memory.helper.ts`

**Gap:** Dual write — rolling `user_memory.health.*` keys from daily summary. Uses `write_user_memory` repository boundary, not direct SQL on `user_memory`.

**Source:** `build-guide/20-wearables/03-memory-routing.md`, `brioela-specs/40-wearables-integration.md`

---

```typescript
import type { WearableDailySummary } from '@brioela/shared/validator/wearables/wearable.daily.summary.schema'
import type { BrainWearableConnection } from '@/agents/brain/_schemas/wearable.connection.schema'
import type { BrainSqlite } from '@/agents/brain/types'
import { mergeUserMemory } from '@/agents/brain/_repositories/merge.user.memory.repository'

type RouteInput = {
  userId: string
  summary: WearableDailySummary
  connection: BrainWearableConnection
}

export async function routeWearableMemory(db: BrainSqlite, input: RouteInput): Promise<void> {
  const { summary, connection } = input
  const observedAt = summary.generatedAt
  const meta = {
    source: 'wearable' as const,
    sourceConnectionId: summary.connectionId,
    sourceProvider: summary.provider,
    observedAt,
    localDate: summary.localDate,
  }

  if (summary.recovery) {
    await mergeUserMemory(db, {
      userId: input.userId,
      namespace: 'health.biometrics',
      key: 'recovery_today',
      value: {
        ...meta,
        readinessScore: summary.recovery.readinessScore,
        hrvAvgMs: summary.recovery.hrvAvgMs,
        hrvBaseline7d: summary.recovery.hrvBaseline7d,
        hrvDelta: summary.recovery.hrvDelta,
        restingHrBpm: summary.recovery.restingHrBpm,
        temperatureDeviationC: summary.recovery.temperatureDeviationC,
      },
      confidence: 0.9,
      source: 'wearable',
    })
  }

  if (summary.sleep) {
    await mergeUserMemory(db, {
      userId: input.userId,
      namespace: 'health.sleep',
      key: 'sleep_quality_trend',
      value: {
        ...meta,
        lastNight: summary.sleep,
      },
      confidence: 0.9,
      source: 'wearable',
    })
  }

  if (summary.activity) {
    await mergeUserMemory(db, {
      userId: input.userId,
      namespace: 'health.activity',
      key: 'weekly_activity_level',
      value: {
        ...meta,
        day: summary.activity,
      },
      confidence: 0.85,
      source: 'wearable',
    })
  }

  if (summary.glucose?.fastingMgdl != null) {
    await mergeUserMemory(db, {
      userId: input.userId,
      namespace: 'health.glucose',
      key: 'baseline_fasting',
      value: {
        ...meta,
        fastingMgdl: summary.glucose.fastingMgdl,
        dailyMeanMgdl: summary.glucose.dailyMeanMgdl,
        timeAboveRangeMin: summary.glucose.timeAboveRangeMin,
      },
      confidence: 0.85,
      source: 'wearable',
    })
  }

  void connection
}
```

**Blocked:** `merge.user.memory.repository` must enforce spread-merge and `id = namespace:key` composite per **05**.
