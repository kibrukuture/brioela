# Draft: health.captures.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/health.captures.schema.ts`

Source: `build-guide/06-brain-memory/01-sqlite-schema.md`, `29-health-intelligence/01-medication-tracking.md`

Append-only measurement/document log. Wearables (**36**) write here with `source_connection_id`.

```typescript
import { check, index, integer, real, sqliteTable, text } from '@/database/sqlite/_schema'

export const healthCaptures = sqliteTable(
	'health_captures',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		captureType: text('capture_type').notNull(),
		domain: text('domain').notNull(),
		metricKey: text('metric_key'),
		valueJson: text('value_json').notNull(),
		unit: text('unit'),
		sourceType: text('source_type').notNull(),
		sourceDetail: text('source_detail'),
		sourceConnectionId: text('source_connection_id'),
		capturedAt: integer('captured_at', { mode: 'number' }).notNull(),
		ingestedAt: integer('ingested_at', { mode: 'number' }).notNull(),
		confidence: real('confidence'),
		tags: text('tags'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('health_captures_value_json_object_check', /* json_valid object */),
		index('idx_health_captures_recent').on(table.userId, table.capturedAt),
		index('idx_health_captures_source').on(table.userId, table.sourceConnectionId),
	],
)

export type BrainHealthCapture = typeof healthCaptures.$inferSelect
```

Example rows per `01-medication-tracking.md`: blood pressure, CGM glucose, HbA1c lab, prescription photo, Oura sleep summary.
