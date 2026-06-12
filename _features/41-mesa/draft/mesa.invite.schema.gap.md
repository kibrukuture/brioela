# Draft: mesa.invite.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/mesa.invite.schema.ts`

**Gap:** No `mesa_invite` table; cross-brain delivery (G1) still undefined.

**Source:** `build-guide/26-mesa/07-shared-enrichment-and-invites.md`

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const mesaInviteRoleValues = ['adult_member', 'caregiver', 'guest_contributor'] as const

export const mesaInviteStatusValues = [
	'pending',
	'accepted',
	'declined',
	'revoked',
	'expired',
] as const

export const mesaInvite = sqliteTable(
	'mesa_invite',
	{
		id: text('id').primaryKey(),
		mesaId: text('mesa_id').notNull(),
		inviterUserId: text('inviter_user_id').notNull(),
		inviteeUserId: text('invitee_user_id'),
		inviteeContactHash: text('invitee_contact_hash'),
		role: text('role', { enum: mesaInviteRoleValues }).notNull(),
		scopesJson: text('scopes_json').notNull(),
		status: text('status', { enum: mesaInviteStatusValues }).notNull().default('pending'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		respondedAt: integer('responded_at', { mode: 'number' }),
	},
	(table) => [
		check(
			'mesa_invite_scopes_json_array_check',
			sql`json_valid(${table.scopesJson}) and json_type(${table.scopesJson}) = 'array'`,
		),
		index('mesa_invite_mesa_status_index').on(table.mesaId, table.status),
	],
)

export type MesaInviteRow = typeof mesaInvite.$inferSelect
```
