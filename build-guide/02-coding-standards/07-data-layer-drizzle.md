# Data Layer — Drizzle ORM

## Two Drizzle Instances

Brioela uses Drizzle in two separate contexts:

| Context | DB | Import | Where |
|---|---|---|---|
| Supabase Postgres | Shared global data | `drizzle-orm/postgres-js` | `shared/drizzle/` |
| DO SQLite | Per-user private data | `drizzle-orm/durable-sqlite` | `backend/src/agents/{agent}/` |

They are completely separate. Never mix schemas between them. Never query Supabase from inside a DO — if DO logic needs shared data, it calls the appropriate backend endpoint via HTTP.

---

## Supabase Postgres Schema Organization

Tables are grouped by domain. Each domain file is a Drizzle schema file with related tables. A `_shared.ts` file defines reusable column helpers.

```ts
// shared/drizzle/schema/_shared.schema.ts
import { timestamp } from 'drizzle-orm/pg-core'

export const timestamps = {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}

export const softDelete = {
  deletedAt: timestamp('deleted_at'),
}
```

```ts
// shared/drizzle/schema/products.schema.ts
import { pgTable, varchar, text, jsonb, real } from 'drizzle-orm/pg-core'
import { timestamps } from './_shared'

export const products = pgTable('products', {
  id:           varchar('id').primaryKey(),           // UPC
  name:         text('name').notNull(),
  brand:        text('brand'),
  ingredients:  jsonb('ingredients'),                 // parsed ingredient list
  nutrition:    jsonb('nutrition'),                   // nutrition facts JSON
  originCountry:varchar('origin_country'),
  certifications: jsonb('certifications'),
  ...timestamps,
})

export const productSightings = pgTable('product_sightings', {
  id:        varchar('id').primaryKey(),
  productId: varchar('product_id').notNull().references(() => products.id),
  storeId:   varchar('store_id').notNull(),
  price:     real('price'),
  inStock:   varchar('in_stock').notNull(),
  geohash:   varchar('geohash').notNull(),
  ...timestamps,
})
```

```ts
// shared/drizzle/schema/index.ts
// This file is the Drizzle schema entry point for migrations
export * from './_shared.schema'
export * from './products.schema'
export * from './community.schema'
export * from './map.schema'
export * from './businesses.schema'
export * from './bela.schema'
export * from './recall.schema'
```

---

## Database Client

The Drizzle client for Supabase is created once and reused:

```ts
// backend/src/core/database/db.client.ts
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from '@brioela/shared/drizzle/schema'

let _db: ReturnType<typeof drizzle> | null = null

export function getDb(env: Env) {
  if (_db) return _db
  const client = postgres(env.DATABASE_URL)
  _db = drizzle(client, { schema })
  return _db
}
```

Cloudflare Workers are stateless — the `_db` module-level variable persists within the same isolate instance but not across cold starts. This is acceptable — the connection overhead is minimal and the Worker handles it correctly.

---

## Query Patterns

### Never write raw SQL

Drizzle's typed query builder catches column name typos, wrong types, and missing fields at compile time. Raw SQL (`db.execute(sql\`...\``) loses all of this.

```ts
// ✓ typed query builder
const product = await db.query.products.findFirst({
  where: eq(products.id, upc),
  with: { sightings: true },
})

// ✗ raw SQL — loses type safety
const product = await db.execute(sql`SELECT * FROM products WHERE id = ${upc}`)
```

Raw SQL is only permitted for: complex aggregations that Drizzle's query builder cannot express, and full-text search queries (PostgreSQL `tsvector`). Document why whenever raw SQL is used.

### Transactions

Mutations that touch multiple tables always use transactions:

```ts
await db.transaction(async (tx) => {
  const order = await tx.insert(belaOrders).values(orderData).returning()
  await tx.insert(escrowRecords).values({ orderId: order[0].id, amount: order[0].total })
})
```

### DO SQLite Queries

DO SQLite queries use Drizzle exactly like Postgres except for the adapter:

```ts
// Inside a DO method
const memory = await this.db.query.userMemory.findFirst({
  where: eq(userMemory.key, 'dietary_identity'),
})

if (!memory) return null
return JSON.parse(memory.value) as DietaryIdentity
```

---

## Migration Strategy

### Supabase Postgres

Migrations live with the shared Drizzle package configuration. Drizzle Kit generates them from `shared/drizzle/schema/`:

```bash
# Generate migration from schema diff
bun run db:gen

# Apply migrations
bun run db:mig
```

Never manually edit generated migration files. If a migration is wrong, generate a new one that corrects it.

### DO SQLite

DO SQLite migrations are declared in `wrangler.jsonc`:

```toml
[[migrations]]
tag = "v1"
new_sqlite_classes = ["BrioelOrchestrator"]

[[migrations]]
tag = "v2"
# new tables or schema changes declared per migration tag
```

Drizzle Kit does NOT manage DO SQLite migrations. They are managed via wrangler migration tags.

---

## Supabase RLS

Supabase tables that contain any user-identifiable data must have Row Level Security (RLS) enabled. The backend service role key bypasses RLS — it is used only for trusted server-side operations. The anon key (if ever used) is constrained by RLS policies.

All user-private data lives in DO SQLite, not Supabase. Supabase contains only shared, non-private data. If a Supabase table might contain any user identifier, audit whether it should instead be in the DO SQLite.

---

## Rules

- Never `this.ctx.storage.get/put` for structured data — use Drizzle.
- Never `JSON.parse` or `JSON.stringify` at the query layer — Drizzle's `jsonb` handles it for Postgres; for DO SQLite, parse at the repository function level, not inside components or route handlers.
- Column names in SQL: `snake_case`. TypeScript property names: `camelCase`. Drizzle maps them — declare both.
- Never expose raw Drizzle types in HTTP responses or mobile types. Map to Zod-validated response schemas before returning.
- `drizzle.config.ts` points to `src/db/schema/index.ts` — never to individual schema files directly.
