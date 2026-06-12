# Draft: mesa.potential.member.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/mesa.potential.member.schema.ts`

**Gap:** No `mesa_potential_member` candidate table.

**Source:** `build-guide/26-mesa/08-potential-members.md`

---

```typescript
import { check, index, integer, real, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const mesaPotentialMemberStatusValues = [
	'candidate',
	'prompted',
	'accepted',
	'dismissed',
	'expired',
] as const

export const mesaPotentialMember = sqliteTable(
	'mesa_potential_member',
	{
		id: text('id').primaryKey(),
		mesaId: text('mesa_id').notNull(),
		suggestedLabel: text('suggested_label').notNull(),
		roleGuess: text('role_guess'),
		evidenceJson: text('evidence_json').notNull(),
		confidence: real('confidence').notNull(),
		status: text('status', { enum: mesaPotentialMemberStatusValues })
			.notNull()
			.default('candidate'),
		firstSeenAt: integer('first_seen_at', { mode: 'number' }).notNull(),
		lastSeenAt: integer('last_seen_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'mesa_potential_member_evidence_json_array_check',
			sql`json_valid(${table.evidenceJson}) and json_type(${table.evidenceJson}) = 'array'`,
		),
		check('mesa_potential_member_confidence_check', sql`${table.confidence} >= 0 and ${table.confidence} <= 1`),
		index('mesa_potential_member_mesa_status_confidence_index').on(
			table.mesaId,
			table.status,
			table.confidence,
		),
	],
)

export type MesaPotentialMemberRow = typeof mesaPotentialMember.$inferSelect
```
