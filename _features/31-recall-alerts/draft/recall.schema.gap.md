# Gap snapshot: recall.schema.ts

Target: `shared/drizzle/schema/recall.schema.ts`

**Status:** Not in repo. From `build-guide/15-recall-alerts/05-data-model.md`, `brioela-specs/26-personalized-recall-alerts.md`.

---

```typescript
import { index, jsonb, pgSchema, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { brioela } from './brioela'

export const recallSourceEnum = ['fda', 'efsa', 'cfia', 'rasff'] as const
export type RecallSource = (typeof recallSourceEnum)[number]

export const recallEntryStatusEnum = ['active', 'retracted', 'expired'] as const
export type RecallEntryStatus = (typeof recallEntryStatusEnum)[number]

export const recallEntries = brioela.table(
  'recall_entry',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recallId: text('recall_id').notNull(),
    source: text('source').notNull(),
    productName: text('product_name').notNull(),
    upc: text('upc'),
    lotNumbersJson: jsonb('lot_numbers_json').$type<string[]>().notNull().default([]),
    reason: text('reason').notNull(),
    issuedAt: timestamp('issued_at', { withTimezone: true }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    rawNoticeUrl: text('raw_notice_url').notNull(),
    status: text('status').notNull().default('active'),
    rawPayloadJson: jsonb('raw_payload_json').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('recall_entry_source_issued_idx').on(table.source, table.issuedAt),
    index('recall_entry_upc_idx').on(table.upc),
    index('recall_entry_recall_id_source_idx').on(table.recallId, table.source),
  ],
)

export const matchConfidenceEnum = ['confirmed', 'probable', 'informational'] as const
export type MatchConfidence = (typeof matchConfidenceEnum)[number]

export const recallScanMatches = brioela.table(
  'recall_scan_match',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    recallId: uuid('recall_id')
      .notNull()
      .references(() => recallEntries.id),
    userId: text('user_id').notNull(),
    scanEventId: uuid('scan_event_id'),
    productExposureId: uuid('product_exposure_id'),
    matchConfidence: text('match_confidence').notNull(),
    notifiedAt: timestamp('notified_at', { withTimezone: true }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('recall_scan_match_user_idx').on(table.userId),
    index('recall_scan_match_recall_idx').on(table.recallId),
    index('recall_scan_match_user_open_idx').on(table.userId, table.resolvedAt),
  ],
)

export type RecallEntry = typeof recallEntries.$inferSelect
export type NewRecallEntry = typeof recallEntries.$inferInsert
export type RecallScanMatch = typeof recallScanMatches.$inferSelect
export type NewRecallScanMatch = typeof recallScanMatches.$inferInsert
```

**Unique constraint (add in migration):** `(recall_id, user_id, scan_event_id)` WHERE scan_event_id IS NOT NULL — idempotent notify.
