# Draft: harden.craving.correlation.patterns.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/ambient/harden.craving.correlation.patterns.helper.ts`

**Gap:** Weekly pass does not consume `craving_decoded` → `craving_correlation` patterns. **Owner: 35** ambient — documented here because **37** produces the events.

**Source:** `brioela-specs/52-craving-decoder.md`, `brioela-specs/17-behavioral-food-pattern-detection.md`

---

```typescript
import type { BrainSqlite } from '@/agents/brain/types'
import { memoryEvent } from '@/agents/brain/_schemas'
import { behaviorPattern } from '@/agents/brain/_schemas/behavior.pattern.schema'
import { CRAVING_DECODED_EVENT_KIND, CravingDecodedPayloadSchema } from '@brioela/shared/validator/craving-decoder/craving.decoded.event.schema'
import { and, desc, eq, gte } from 'drizzle-orm'
import { createId } from '@/ids/create.id'

const MIN_DECODE_EVENTS = 3
const MIN_CONFIDENCE = 0.65

export type HardenCravingCorrelationInput = {
  userId: string
  lookbackDays?: number
}

export async function hardenCravingCorrelationPatterns(
  db: BrainSqlite,
  input: HardenCravingCorrelationInput,
): Promise<{ patternsWritten: number }> {
  const since = Date.now() - (input.lookbackDays ?? 60) * 24 * 60 * 60 * 1000

  const rows = await db
    .select({ id: memoryEvent.id, payloadJson: memoryEvent.payloadJson, capturedAt: memoryEvent.capturedAt })
    .from(memoryEvent)
    .where(
      and(
        eq(memoryEvent.userId, input.userId),
        eq(memoryEvent.kind, CRAVING_DECODED_EVENT_KIND),
        gte(memoryEvent.capturedAt, since),
      ),
    )
    .orderBy(desc(memoryEvent.capturedAt))

  const pairCounts = new Map<string, { category: string; cause: string; eventIds: string[] }>()

  for (const row of rows) {
    const payload = CravingDecodedPayloadSchema.parse(JSON.parse(row.payloadJson))
    for (const cause of payload.namedCauses) {
      if (cause === 'no_pattern') continue
      const key = `${payload.category}:${cause}`
      const entry = pairCounts.get(key) ?? { category: payload.category, cause, eventIds: [] }
      entry.eventIds.push(row.id)
      pairCounts.set(key, entry)
    }
  }

  let patternsWritten = 0

  for (const [, entry] of pairCounts) {
    if (entry.eventIds.length < MIN_DECODE_EVENTS) continue

    const confidence = Math.min(0.95, 0.5 + entry.eventIds.length * 0.08)
    if (confidence < MIN_CONFIDENCE) continue

    await db.insert(behaviorPattern).values({
      id: createId(),
      userId: input.userId,
      behaviorPatternType: 'craving_correlation',
      evidenceJson: JSON.stringify({ eventIds: entry.eventIds, category: entry.category, cause: entry.cause }),
      confidence,
      firstSeenAt: since,
      lastSeenAt: Date.now(),
    })

    patternsWritten += 1
  }

  return { patternsWritten }
}
```

**Note:** Dedup against existing `craving_correlation` rows required at implementation — sketch omits for brevity.
