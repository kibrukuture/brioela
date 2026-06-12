# Draft: verified.person.profile.schema.ts (gap — file does not exist)

Target: `shared/drizzle/schema/verified.person.profile.schema.ts`

Source: `build-guide/23-verified-profiles/01-profile-types.md`, `04-verified-profile.md`

**Note:** Spec 18 `practitioner_profile` maps to this table — two-lane model (**C1**).

---

```typescript
import { sql } from 'drizzle-orm'
import { boolean, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { users } from './user.schema'

export const verifiedProfiles = pgTable(
  'verified_profiles',
  {
    profileId: uuid('profile_id').primaryKey().defaultRandom(),
    ownerUserId: uuid('owner_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    subtype: text('subtype').notNull(),
    displayName: text('display_name').notNull(),
    publicSlug: text('public_slug').notNull().unique(),
    credentialSummary: text('credential_summary'),
    verificationStatus: text('verification_status').notNull().default('draft'),
    publicRecipeProfileEnabled: boolean('public_recipe_profile_enabled').notNull().default(false),
    clientFeaturesEnabled: boolean('client_features_enabled').notNull().default(false),
    evidenceJson: jsonb('evidence_json'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    ownerIdx: index('verified_profiles_owner_idx').on(table.ownerUserId),
    slugIdx: index('verified_profiles_slug_idx').on(table.publicSlug),
    statusCheck: sql`check (${table.verificationStatus} in ('draft','pending_review','verified','rejected','suspended','expired'))`,
  }),
)

export type VerifiedProfileRow = typeof verifiedProfiles.$inferSelect
export type InsertVerifiedProfileRow = typeof verifiedProfiles.$inferInsert
```
