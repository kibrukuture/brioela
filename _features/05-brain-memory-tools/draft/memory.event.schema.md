# Draft: memory.event.schema.ts

Target: `backend/src/agents/brain/_schemas/memory.event.schema.ts`

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const memoryEvent = sqliteTable(
	'memory_event',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		kind: text('kind').notNull(),
		payloadJson: text('payload_json').notNull(),
		capturedAt: integer('captured_at', { mode: 'number' }).notNull(),
		ingestedAt: integer('ingested_at', { mode: 'number' }).notNull(),
		source: text('source').notNull(),
		sessionId: text('session_id'),
		entityKind: text('entity_kind'),
		entityId: text('entity_id'),
		geoHash: text('geo_hash'),
	},
	(table) => [
		check('memory_event_payload_json_object_check', sql`json_valid(${table.payloadJson}) and json_type(${table.payloadJson}) = 'object'`),
		check('memory_event_captured_at_check', sql`${table.capturedAt} >= 0`),
		check('memory_event_ingested_at_check', sql`${table.ingestedAt} >= 0`),
		index('memory_event_kind_captured_at_index').on(table.kind, table.capturedAt),
		index('memory_event_entity_captured_at_index').on(table.entityKind, table.entityId, table.capturedAt),
		index('memory_event_captured_at_id_index').on(table.capturedAt, table.id),
		index('memory_event_session_id_index').on(table.sessionId),
	],
)

export type BrainMemoryEvent = typeof memoryEvent.$inferSelect
export type NewBrainMemoryEvent = typeof memoryEvent.$inferInsert
```
