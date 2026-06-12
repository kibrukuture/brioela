# Gap snapshot: find.schema.ts (Drizzle)

Target: `shared/drizzle/schema/find.schema.ts`

**Status:** Not in repo. From `brioela-specs/35-ground-community-intelligence.md` SQL block.

```typescript
import { sql } from 'drizzle-orm'
import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const find = pgTable('find', {
  findId: uuid('find_id').primaryKey().defaultRandom(),
  locationId: uuid('location_id').notNull(),
  signalType: text('signal_type')
    .notNull()
    .$type<'health' | 'ingredient' | 'price' | 'new_product' | 'general'>(),
  content: text('content').notNull(),
  mediaUrls: text('media_urls').array(),
  capturedAt: timestamp('captured_at', { withTimezone: true }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  status: text('status')
    .notNull()
    .default('active')
    .$type<'active' | 'stale' | 'archived' | 'removed'>(),
  contributorHash: text('contributor_hash'),
  gatePassed: boolean('gate_passed').notNull().default(false),
  gateLog: jsonb('gate_log'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  signalTypeCheck: sql`check (${table.signalType} in ('health','ingredient','price','new_product','general'))`,
  statusCheck: sql`check (${table.status} in ('active','stale','archived','removed'))`,
  contentLengthCheck: sql`check (char_length(${table.content}) <= 280)`,
}))
```

**Note:** `location_id` FK to places/`map_place` deferred until **28** migration lands.
