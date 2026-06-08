# Foundation — Database Setup

## Two Drizzle Instances — No Mixing

| Instance | DB | Where |
|---|---|---|
| Supabase Postgres | Shared cross-user data (products, community, map) | `shared/drizzle/` |
| DO SQLite | Per-user private data (memory, constraints, recipes, sessions) | `backend/src/agents/{agent}/_schema/` |

Never query Supabase from inside a Durable Object. If a DO needs shared data, it calls the backend HTTP API.

---

## Supabase Postgres

### Schema Name

All tables live in a dedicated Postgres schema named `brioela` — not `public`. Drizzle's `pgSchema()` enforces this.

```ts
// shared/drizzle/schema/brioela.ts
import { pgSchema } from 'drizzle-orm/pg-core'
export const brioelaSchema = pgSchema('brioela')
```

Every table is created with `brioelaSchema.table(...)`, and `enableRLS()` is called on every user-identifiable table.

### Table Structure

```ts
// shared/drizzle/schema/user.schema.ts
import { text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'
import { brioelaSchema } from './brioela'

export const users = brioelaSchema.table('users', {
  id:          uuid('id').defaultRandom().primaryKey(),
  email:       text('email').notNull().unique(),
  brioelaTag:  text('brioela_tag').unique(),
  firstName:   text('first_name'),
  lastName:    text('last_name'),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}).enableRLS()

export type User    = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
```

### Shared Column Helpers

```ts
// shared/drizzle/schema/_shared.schema.ts
import { timestamp } from 'drizzle-orm/pg-core'

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const softDelete = {
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}
```

### Schema Index

```ts
// shared/drizzle/schema/index.ts
import * as userSchema       from './user.schema'
import * as productsSchema   from './products.schema'
import * as communitySchema  from './community.schema'
import * as mapSchema        from './map.schema'
import * as belaSchema       from './bela.schema'
import * as recallSchema     from './recall.schema'

export * from './user.schema'
export * from './products.schema'
export * from './community.schema'
export * from './map.schema'
export * from './bela.schema'
export * from './recall.schema'

export const schema = {
  ...userSchema,
  ...productsSchema,
  ...communitySchema,
  ...mapSchema,
  ...belaSchema,
  ...recallSchema,
}
```

### Drizzle Config

```ts
// shared/drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema:       './drizzle/schema/index.ts',
  out:          './drizzle/migrations',
  dialect:      'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL as string, ssl: true },
  schemaFilter: ['brioela'],
  verbose:      true,
  strict:       true,
})
```

`schemaFilter: ['brioela']` — Drizzle only manages the `brioela` schema. Supabase's own `auth` and `public` schemas are untouched.

### DB Commands (run from `shared/`)

```bash
bun run db:gen    # generate migration from schema diff
bun run db:mig    # apply migrations
bun run db:studio # open Drizzle Studio
```

Never manually edit generated migration files. If a migration is wrong, generate a new one that corrects it.

---

## Postgres Database Client — Backend

```ts
// backend/src/core/database/db.client.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { schema } from '@brioela/shared/drizzle/schema'

let _db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (_db) return _db
  const client = postgres(env.DATABASE_URL)
  _db = drizzle({ client, schema })
  return _db
}
```

`maxUses: 1` is required for Cloudflare Workers — connections are single-use per request isolation.

---

## Supabase Client — Backend

The Supabase client is used for auth only. Data queries use Drizzle directly.

```ts
// backend/src/core/clients/supabase.client.ts
import { createClient } from '@supabase/supabase-js'
import { env } from '@/core/config/env'

export const supabase = createClient(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { db: { schema: 'brioela' } }
)
```

The service role key bypasses RLS — it is never exposed to clients. Mobile uses Supabase with the `anon` key for auth only; all data goes through the backend API.

---

## DO SQLite — Per Durable Object

Each DO has its own isolated SQLite database via `this.ctx.storage`. Drizzle manages the schema.

```ts
// backend/src/agents/brain/_schema/memory.schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const userMemory = sqliteTable('user_memory', {
  key:       text('key').primaryKey(),
  value:     text('value').notNull(),     // JSON stored as text
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export const memoryEvents = sqliteTable('memory_events', {
  id:        text('id').primaryKey(),
  type:      text('type').notNull(),
  payload:   text('payload').notNull(),   // JSON
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
```

```ts
// backend/src/agents/brain/_schema/constraints.schema.ts
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const constraints = sqliteTable('constraints', {
  id:        text('id').primaryKey(),
  type:      text('type').notNull(),     // 'allergy' | 'dislike' | 'boycott' | 'dietary'
  value:     text('value').notNull(),
  severity:  text('severity').notNull(), // 'hard' | 'soft'
  source:    text('source').notNull(),   // 'user' | 'ai_proposed' | 'medical'
  confirmed: integer('confirmed', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
```

DO SQLite migrations are declared in `wrangler.jsonc` migration tags — Drizzle Kit does NOT manage them.

---

## RLS Policy Baseline

Every Supabase table with user data must have RLS enabled. The service role key (used by the backend) bypasses RLS. The mobile anon key (if ever used directly) is constrained by RLS policies.

```sql
-- Applied once per table in Supabase SQL editor or migration
ALTER TABLE brioela.users ENABLE ROW LEVEL SECURITY;

-- Policy: users can only read their own row
CREATE POLICY "users_self_select"
  ON brioela.users FOR SELECT
  USING (auth.uid() = id);
```

All user-private behavioral data (scans, constraints, recipes, sessions, memory) lives in DO SQLite — not Supabase. Supabase holds only shared, cross-user data.

---

## Rules

- Never mix schemas: Supabase tables never reference DO SQLite and vice versa.
- Never expose raw Drizzle types to the API. Map through the entity validator before returning.
- All timestamps use `withTimezone: true` in Postgres. DO SQLite uses `integer` with `mode: 'timestamp'`.
- `drizzle.config.ts` always points to `drizzle/schema/index.ts` — never individual files.
- Never `JSON.stringify` / `JSON.parse` at the query layer. Parse at the handler boundary.
