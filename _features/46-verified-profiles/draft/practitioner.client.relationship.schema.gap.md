# Draft: practitioner.client.relationship.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/practitioner.client.relationship.schema.ts`

Source: `build-guide/23-verified-profiles/05-client-and-practitioner-boundary.md`

**Storage:** Client's Brain DO SQLite — consent is per-user.

---

```typescript
import { check, index, integer, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const relationshipStatus = ['pending', 'active', 'revoked', 'expired'] as const

export const practitionerClientRelationships = sqliteTable(
  'practitioner_client_relationships',
  {
    id: text('id').primaryKey(),
    practitionerProfileId: text('practitioner_profile_id').notNull(),
    practitionerOwnerUserId: text('practitioner_owner_user_id').notNull(),
    userId: text('user_id').notNull(),
    scopesJson: text('scopes_json').notNull(),
    status: text('status', { enum: relationshipStatus }).notNull().default('pending'),
    grantedAt: integer('granted_at', { mode: 'number' }),
    revokedAt: integer('revoked_at', { mode: 'number' }),
    createdAt: integer('created_at', { mode: 'number' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
  },
  (table) => [
    check(
      'practitioner_client_relationships_status_check',
      sql`${table.status} in ('pending','active','revoked','expired')`,
    ),
    index('idx_practitioner_client_user_status').on(table.userId, table.status),
    index('idx_practitioner_client_practitioner').on(table.practitionerProfileId, table.status),
  ],
)

export type BrainPractitionerClientRelationship = typeof practitionerClientRelationships.$inferSelect
```
