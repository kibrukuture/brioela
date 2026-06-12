# Draft: health.events.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/health.events.schema.ts`

Source: `build-guide/06-brain-memory/01-sqlite-schema.md`, `29-health-intelligence/01-medication-tracking.md`

Symptomatic outcome log — separate from `health_captures` (measurements/docs).

```typescript
import { check, index, integer, sqliteTable, text } from '@/database/sqlite/_schema'

const healthEventTypes = [
	'allergic_reaction',
	'gi_distress',
	'glucose_spike',
	'fatigue',
	'headache',
	'inflammation',
	'sickness',
	'bp_elevated',
	'stool_bristol',
] as const

export const healthEvents = sqliteTable(
	'health_events',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		eventType: text('event_type').notNull(),
		severity: integer('severity', { mode: 'number' }),
		onsetAt: integer('onset_at', { mode: 'number' }).notNull(),
		loggedAt: integer('logged_at', { mode: 'number' }).notNull(),
		source: text('source').notNull(),
		payloadJson: text('payload_json').notNull(),
		possibleAssociations: text('possible_associations'),
		resolvedAt: integer('resolved_at', { mode: 'number' }),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('health_events_payload_json_object_check', /* json_valid object */),
		index('idx_health_events_recent').on(table.userId, table.onsetAt),
		index('idx_health_events_type').on(table.userId, table.eventType, table.onsetAt),
	],
)

export type BrainHealthEvent = typeof healthEvents.$inferSelect
```

HealthInsightAgent Pass 1 reads 14-day window. **32** illness detective may cross-ref later — not required for **22** MVP.
