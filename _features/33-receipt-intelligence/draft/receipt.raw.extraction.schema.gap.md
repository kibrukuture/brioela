# Draft: receipt.raw.extraction.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/receipt.raw.extraction.schema.ts`

**Gap (feature 33):** Immutable GPT-4o mini vision output — never overwritten (model-upgrade reprocess reads this row).

**Source:** `build-guide/13-receipt-intelligence/00-overview.md`, `01-receipt-ingestion.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { receipts } from './receipt.schema'

export const receiptRawExtractions = sqliteTable('receipt_raw_extraction', {
  id: text('id').primaryKey(),
  receiptId: text('receipt_id')
    .notNull()
    .references(() => receipts.id, { onDelete: 'cascade' }),
  modelId: text('model_id').notNull(),
  modelVersion: text('model_version'),
  payloadJson: text('payload_json').notNull(),
  confidence: integer('confidence'),
  warningsJson: text('warnings_json'),
  createdAt: integer('created_at').notNull(),
})

export type ReceiptRawExtractionRow = typeof receiptRawExtractions.$inferSelect
```

**Rule:** No `ON CONFLICT UPDATE` on this table. Reprocess creates a new normalization pass from existing raw row.
