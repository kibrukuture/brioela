# Draft: build-guide/02-coding-standards/07-data-layer-drizzle.md

Target: `build-guide/02-coding-standards/07-data-layer-drizzle.md`

```
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
  _db = drizzle({ client, schema })
  return _db
}
```

Cloudflare Workers are stateless — the `_db` module-level variable persists within the same isolate instance but not across cold starts. This is acceptable — the connection overhead is minimal and the Worker handles it correctly.

---

## Query Patterns

### Drizzle Is The Only Database Gatekeeper

Production code never reaches a database directly. The database engine is not the application interface.

```text
Community/shared data: Supabase Postgres -> Drizzle -> typed repositories/stores -> app code
Private Brain data:    Cloudflare DO SQLite -> Drizzle -> typed repositories/stores -> app code
```

Hard rules:

- No direct Supabase data queries in production code.
- No direct Postgres client data queries in production code.
- No direct Durable Object SQLite queries in production code.
- No raw Drizzle SQL in production runtime code.
- No handwritten SQLite migration runner.
- No database reads or writes outside typed Drizzle repositories/stores.

Drizzle's typed query builder catches column name typos, wrong types, and missing fields at compile time. Raw SQL (`db.execute(sql\`...\``) loses all of this and is illegal in production runtime code.

```ts
// ✓ typed query builder
const product = await db.query.products.findFirst({
  where: eq(products.id, upc),
  with: { sightings: true },
})

// ✗ raw SQL — illegal in Brioela production runtime
const product = await db.execute(sql`SELECT * FROM products WHERE id = ${upc}`)
```

Generated Drizzle migration artifacts and Drizzle schema declarations are approved Drizzle-owned boundaries. Application runtime code does not use raw SQL as an escape hatch. If Drizzle cannot express a future production query, treat that as an architecture event: design an approved adapter or generated boundary, document it, and gate it mechanically before shipping.

Raw Durable Object SQLite is metal, not Brioela's application language. Product Brain code must not call `ctx.storage.sql`, `.storage.sql`, `db.run`, `db.get`, `db.all`, `db.values`, or `sql\`...\`` directly. The only approved metal boundary is Drizzle itself and the tiny Brain database adapter/runtime layer that wires Cloudflare DO storage to Drizzle and, when unavoidable, configures SQLite pragmas. All Brain feature code talks through typed Drizzle repositories/stores.

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
// Inside a Brain repository/store, not directly inside UI, route, or feature code.
const memory = await db.query.userMemory.findFirst({
  where: eq(userMemory.key, 'dietary_identity'),
})

if (!memory) return null
return DietaryIdentitySchema.parse(JSON.parse(memory.value))
```

Feature code does not import Brain tables directly. It calls a typed repository/store or a typed Brain RPC method. This keeps all validation, JSON decoding, permissions, and write policy in one enforceable layer.

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

Wrangler declares the Durable Object class and creates the SQLite-backed DO storage:

```toml
[[migrations]]
tag = "v1"
new_sqlite_classes = ["BrioelaBrain"]
```

Drizzle owns the Brain SQLite schema and migration artifacts. Use Drizzle Kit with the Durable Object SQLite driver to generate migration SQL from `backend/src/agents/brain/_schema/`. Import the generated migration bundle into the Worker, then apply it inside `BrioelaBrain` with `drizzle-orm/durable-sqlite/migrator`.

Brioela does not hand-write a competing SQLite migrator. Brioela's migration runtime is the fortress above Drizzle: rollout policy, per-Brain lock, active-session checks, smoke tests, readiness state, telemetry, and destructive-change blocking. Drizzle answers whether SQL migrations applied. Brioela answers whether this user's Brain is safe to serve.

Generated Drizzle migration artifacts are an approved generated boundary. Do not rename or hand-edit applied generated migrations. If a migration is wrong, update the schema and generate a new correcting migration.

---

## Supabase RLS

Supabase tables that contain any user-identifiable data must have Row Level Security (RLS) enabled. The backend service role key bypasses RLS — it is used only for trusted server-side operations. The anon key (if ever used) is constrained by RLS policies.

All user-private data lives in DO SQLite, not Supabase. Supabase contains only shared, non-private data. If a Supabase table might contain any user identifier, audit whether it should instead be in the DO SQLite.

---

## Rules

- Never `this.ctx.storage.get/put` for structured data — use Drizzle.
- Never use raw SQL in production runtime code for Supabase Postgres or Brain SQLite.
- Never use direct Supabase/Postgres/SQLite data access in production runtime code. Drizzle is the gatekeeper.
- Only approved Drizzle schema files, generated Drizzle migrations, and tiny database adapter/runtime boundaries may touch database-specific primitives.
- Never `JSON.parse` or `JSON.stringify` at the query layer — Drizzle's `jsonb` handles it for Postgres; for DO SQLite, parse at the repository function level, not inside components or route handlers.
- Column names in SQL: `snake_case`. TypeScript property names: `camelCase`. Drizzle maps them — declare both.
- Never expose raw Drizzle types in HTTP responses or mobile types. Map to Zod-validated response schemas before returning.
- `drizzle.config.ts` points to `src/db/schema/index.ts` — never to individual schema files directly.
```
