# Draft: passport.audit.event.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/passport.audit.event.schema.ts`

**Gap (feature 47):** Private audit trail for Passport lifecycle events.

**Source:** `build-guide/28-passport/02-passport-data-model.md`

---

```typescript
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const passportAuditEventTypeValues = [
	'created',
	'viewed',
	'shared',
	'revoked',
	'expired',
] as const
export type PassportAuditEventType = (typeof passportAuditEventTypeValues)[number]

export const passportAuditEvents = sqliteTable(
	'passport_audit_event',
	{
		id: text('id').primaryKey(),
		passportId: text('passport_id').notNull(),
		eventType: text('event_type').notNull(),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		metadataJson: text('metadata_json').notNull().default('{}'),
	},
	(table) => [index('passport_audit_passport_index').on(table.passportId, table.createdAt)],
)

export type PassportAuditEventRow = typeof passportAuditEvents.$inferSelect
```
