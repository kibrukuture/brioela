# Draft: verified.business.profile.schema.ts (gap — file does not exist)

Target: `shared/drizzle/schema/verified.business.profile.schema.ts`

Source: `build-guide/23-verified-profiles/03-verified-business.md`

On `verified` + `place_id`, call `linkVerifiedBusinessToMapPlace` (**28** `verification_status`).

---

```typescript
import { sql } from 'drizzle-orm'
import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './user.schema'

export const verifiedBusinesses = pgTable(
  'verified_businesses',
  {
    profileId: uuid('profile_id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subtype: text('subtype').notNull(),
    displayName: text('display_name').notNull(),
    publicSlug: text('public_slug').notNull().unique(),
    placeId: uuid('place_id'),
    verificationStatus: text('verification_status').notNull().default('draft'),
    transparencyFieldsJson: jsonb('transparency_fields_json').notNull().default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('verified_businesses_owner_idx').on(table.ownerUserId),
    placeIdx: index('verified_businesses_place_idx').on(table.placeId),
    statusCheck: sql`check (${table.verificationStatus} in ('draft','pending_review','verified','rejected','suspended','expired'))`,
  }),
)

export type VerifiedBusinessRow = typeof verifiedBusinesses.$inferSelect
export type InsertVerifiedBusinessRow = typeof verifiedBusinesses.$inferInsert
```
