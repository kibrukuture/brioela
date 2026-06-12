# Draft: mesa.contribution.event.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/mesa.contribution.event.schema.ts`

**Gap:** No `mesa_contribution_event` for scoped shared enrichment.

**Source:** `build-guide/26-mesa/07-shared-enrichment-and-invites.md`, `brioela-specs/41-mesa.md` § Shared Enrichment

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const mesaContributionEntityKindValues = [
	'scan',
	'receipt',
	'recipe',
	'pantry_item',
	'menu',
	'note',
] as const

export const mesaContributionEvent = sqliteTable(
	'mesa_contribution_event',
	{
		id: text('id').primaryKey(),
		mesaId: text('mesa_id').notNull(),
		contributorUserId: text('contributor_user_id'),
		entityKind: text('entity_kind', { enum: mesaContributionEntityKindValues }).notNull(),
		entityId: text('entity_id'),
		payloadJson: text('payload_json').notNull(),
		acceptedByOwner: integer('accepted_by_owner', { mode: 'boolean' }).notNull().default(false),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'mesa_contribution_event_payload_json_object_check',
			sql`json_valid(${table.payloadJson})`,
		),
		check('mesa_contribution_event_accepted_by_owner_check', sql`${table.acceptedByOwner} in (0, 1)`),
		index('mesa_contribution_event_mesa_created_index').on(table.mesaId, table.createdAt),
	],
)

export type MesaContributionEventRow = typeof mesaContributionEvent.$inferSelect
```
