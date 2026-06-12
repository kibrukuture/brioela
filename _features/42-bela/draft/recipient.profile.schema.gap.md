# Draft: recipient.profile.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/recipient.profile.schema.ts`

**Source:** `implementable-specs/bela/11-for-others.md`

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const recipientProfile = sqliteTable(
	'recipient_profiles',
	{
		id: text('id').primaryKey(),
		nickname: text('nickname').notNull(),
		phone: text('phone'),
		addressJson: text('address_json').notNull(),
		constraintsJson: text('constraints_json'),
		notes: text('notes'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('recipient_profiles_created_at_check', sql`${table.createdAt} >= 0`),
		check('recipient_profiles_updated_at_check', sql`${table.updatedAt} >= ${table.createdAt}`),
		index('recipient_profiles_nickname_index').on(table.nickname),
	],
)

export type RecipientProfileRow = typeof recipientProfile.$inferSelect
export type NewRecipientProfileRow = typeof recipientProfile.$inferInsert
```
