# Draft: passport.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/passport.schema.ts`

**Gap (feature 47):** `passport` header table in Brain DO SQLite.

**Source:** `build-guide/28-passport/02-passport-data-model.md`

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const passportStatusValues = ['active', 'expired', 'revoked'] as const
export type PassportStatus = (typeof passportStatusValues)[number]

export const passportSensitivityValues = [
	'public_safe',
	'limited_sensitive',
	'blocked',
] as const
export type PassportSensitivity = (typeof passportSensitivityValues)[number]

export const passportAudienceValues = [
	'self',
	'mesa',
	'selected_members',
	'guest_session',
] as const
export type PassportAudience = (typeof passportAudienceValues)[number]

export const passports = sqliteTable(
	'passport',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		kind: text('kind').notNull(),
		audience: text('audience', { enum: passportAudienceValues }).notNull(),
		title: text('title').notNull(),
		language: text('language').notNull(),
		shareMode: text('share_mode').notNull(),
		sensitivity: text('sensitivity', { enum: passportSensitivityValues }).notNull(),
		status: text('status', { enum: passportStatusValues }).notNull().default('active'),
		consentLevel: text('consent_level').notNull(),
		linkToken: text('link_token'),
		expiresAt: integer('expires_at', { mode: 'number' }).notNull(),
		revokedAt: integer('revoked_at', { mode: 'number' }),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check('passport_status_check', sql`${table.status} in ('active', 'expired', 'revoked')`),
		check('passport_expires_at_check', sql`${table.expiresAt} > 0`),
		index('passport_user_status_index').on(table.userId, table.status),
		index('passport_link_token_index').on(table.linkToken),
	],
)

export type PassportRow = typeof passports.$inferSelect
export type NewPassportRow = typeof passports.$inferInsert
```
