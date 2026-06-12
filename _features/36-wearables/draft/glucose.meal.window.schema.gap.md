# Draft: glucose.meal.window.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/glucose.meal.window.schema.ts`

**Gap (feature 36):** CGM scan-triggered meal windows — derived metrics only in long-term storage. Raw readings ephemeral per G23.

**Source:** `build-guide/20-wearables/04-cgm-food-response.md`, `brioela-specs/40-wearables-integration.md`

---

```typescript
import { check, index, integer, real, sqliteTable, text } from '@/database/sqlite/_schema'

export const glucoseMealWindowStatusValues = [
  'open',
  'derived',
  'expired',
  'cancelled',
] as const
export type GlucoseMealWindowStatus = (typeof glucoseMealWindowStatusValues)[number]

export const glucoseMealWindows = sqliteTable(
  'glucose_meal_window',
  {
    windowId: text('window_id').primaryKey(),
    userId: text('user_id').notNull(),
    scanEventId: text('scan_event_id'),
    productId: text('product_id'),
    connectionId: text('connection_id').notNull(),
    status: text('status').notNull().$type<GlucoseMealWindowStatus>(),
    derivedJson: text('derived_json').notNull(),
    peakMgdl: real('peak_mgdl'),
    peakTimeMin: integer('peak_time_min', { mode: 'number' }),
    auc: real('auc'),
    baselineMgdl: real('baseline_mgdl'),
    returnToBaselineMin: integer('return_to_baseline_min', { mode: 'number' }),
    confidence: real('confidence').notNull(),
    openedAt: integer('opened_at', { mode: 'number' }).notNull(),
    closesAt: integer('closes_at', { mode: 'number' }).notNull(),
    capturedAt: integer('captured_at', { mode: 'number' }).notNull(),
    createdAt: integer('created_at', { mode: 'number' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
  },
  (table) => [
    check(
      'glucose_meal_window_derived_json_object_check',
      `json_valid(${table.derivedJson.name}) AND json_type(${table.derivedJson.name}) = 'object'`,
    ),
    check('glucose_meal_window_confidence_range_check', `${table.confidence.name} >= 0 AND ${table.confidence.name} <= 1`),
    index('idx_glucose_meal_window_user_product').on(table.userId, table.productId, table.capturedAt),
    index('idx_glucose_meal_window_scan').on(table.scanEventId),
    index('idx_glucose_meal_window_status').on(table.userId, table.status, table.closesAt),
  ],
)

export type BrainGlucoseMealWindow = typeof glucoseMealWindows.$inferSelect
export type InsertBrainGlucoseMealWindow = typeof glucoseMealWindows.$inferInsert
```

`derived_json` shape:

```typescript
type GlucoseWindowDerivedPayload = {
  readingCount: number
  averagePeakDeltaMgdl: number | null
  attributionFlags: string[]
  evidenceWindowIds: string[]
}
```
