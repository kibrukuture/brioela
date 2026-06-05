# Shared Package — Zod Schemas and End-to-End Types

## The Contract

`@brioela/shared` is the contract between backend and mobile. Every shape of data that crosses the network boundary is defined here — once. Backend validates incoming requests against these schemas. Mobile validates API responses against these schemas. If the schema changes, both sides update together at compile time.

The shared package contains: Zod schemas, inferred types, branded ID types, and shared constants. It contains no UI code, no React, no Cloudflare-specific code, no Node.js APIs.

---

## Schema File Structure

Each schema file covers one domain. Schemas are organized from simple to complex — base schemas defined first, composed schemas below.

```ts
// shared/src/schemas/scan.ts
import { z } from 'zod'
import { UserIdSchema, ProductIdSchema } from './user'

// Atomic schemas first
export const VerdictLevelSchema = z.enum(['safe', 'caution', 'danger', 'unknown'])

export const ScanConstraintViolationSchema = z.object({
  constraintId: z.string(),
  type:         VerdictLevelSchema,
  reason:       z.string(),
})

// Composed schemas below
export const ScanVerdictSchema = z.object({
  level:      VerdictLevelSchema,
  reason:     z.string().max(200),
  violations: z.array(ScanConstraintViolationSchema),
  confidence: z.number().min(0).max(1),
})

export const ScanEventSchema = z.object({
  id:        z.string().uuid(),
  userId:    UserIdSchema,
  upc:       z.string().min(6).max(14),
  productId: ProductIdSchema.optional(),
  verdict:   ScanVerdictSchema,
  scannedAt: z.coerce.date(),
})

export const CreateScanSchema = z.object({
  upc: z.string().min(6).max(14),
})

// Inferred types — never declare manually
export type VerdictLevel = z.output<typeof VerdictLevelSchema>
export type ScanVerdict  = z.output<typeof ScanVerdictSchema>
export type ScanEvent    = z.output<typeof ScanEventSchema>
export type CreateScan   = z.output<typeof CreateScanSchema>
```

---

## Branded ID Types with Zod

All domain IDs are branded at the Zod level — the `transform` produces a branded type:

```ts
// shared/src/types/branded.ts
declare const _brand: unique symbol
type Brand<T, B extends string> = T & { readonly [_brand]: B }

export type UserId    = Brand<string, 'UserId'>
export type RecipeId  = Brand<string, 'RecipeId'>
export type OrderId   = Brand<string, 'OrderId'>
export type FindId    = Brand<string, 'FindId'>
export type ProductId = Brand<string, 'ProductId'>
export type SessionId = Brand<string, 'SessionId'>
export type ShopperId = Brand<string, 'ShopperId'>
export type AlertId   = Brand<string, 'AlertId'>

// Constructor functions
export const asUserId    = (s: string): UserId    => s as UserId
export const asRecipeId  = (s: string): RecipeId  => s as RecipeId
export const asOrderId   = (s: string): OrderId   => s as OrderId
export const asFindId    = (s: string): FindId    => s as FindId
export const asProductId = (s: string): ProductId => s as ProductId
export const asSessionId = (s: string): SessionId => s as SessionId
export const asShopperId = (s: string): ShopperId => s as ShopperId
export const asAlertId   = (s: string): AlertId   => s as AlertId
```

```ts
// shared/src/schemas/user.ts
import { z } from 'zod'
import { asUserId, asRecipeId } from '../types/branded'
import type { UserId, RecipeId } from '../types/branded'

// The Zod schema both validates AND brands the type in one step
export const UserIdSchema    = z.string().uuid().transform(asUserId)
export const RecipeIdSchema  = z.string().uuid().transform(asRecipeId)

// Re-export types so consumers only need to import from schemas
export type { UserId, RecipeId }
```

---

## Input vs Entity Schemas

Every API endpoint that accepts a body has an input schema separate from the entity schema. They are never the same schema. Type names never carry `Request`, `Response`, `Result`, or `Data` suffixes — name the type what it IS.

```ts
// shared/src/schemas/recipe.ts

// Input for the import action — verb prefix (ImportRecipe) distinguishes from entity (Recipe)
export const ImportRecipeSchema = z.object({
  sourceUrl:  z.string().url(),
  sourceType: z.enum(['tiktok', 'youtube', 'instagram', 'url']),
})

// What the server returns when import is queued — it IS a job, so name it that
export const ImportRecipeJobSchema = z.object({
  jobId:     z.string().uuid(),
  status:    z.enum(['queued', 'processing']),
  createdAt: z.coerce.date(),
})

// What a completed recipe looks like (returned by GET /recipes/:id)
export const RecipeSchema = z.object({
  id:          RecipeIdSchema,
  title:       z.string(),
  ingredients: z.array(RecipeIngredientSchema),
  steps:       z.array(z.string()),
  sourceUrl:   z.string().url().optional(),
  confidence:  z.number().min(0).max(1).optional(),
  createdAt:   z.coerce.date(),
})

export type ImportRecipe    = z.output<typeof ImportRecipeSchema>
export type ImportRecipeJob = z.output<typeof ImportRecipeJobSchema>
export type Recipe          = z.output<typeof RecipeSchema>
```

---

## Using Shared Schemas on the Backend

```ts
// backend/src/routes/recipes.ts
import { zValidator } from '@hono/zod-validator'
import { ImportRecipeSchema, ImportRecipeJobSchema } from '@brioela/shared'

recipes.post(
  '/import',
  zValidator('json', ImportRecipeSchema),
  async (c) => {
    const body = c.req.valid('json')  // type: ImportRecipe — fully typed

    const job = await queueRecipeImport(body.sourceUrl, body.sourceType, userId)

    // Validate before sending — ensures API contract is honored
    const parsed = ImportRecipeJobSchema.parse(job)
    return c.json({ data: parsed }, 201)
  }
)
```

---

## Using Shared Schemas on the Mobile

```ts
// mobile/src/api/recipes.ts
import { ImportRecipeSchema, RecipeSchema } from '@brioela/shared'
import type { Recipe } from '@brioela/shared'
import { apiClient } from './client'

export async function importRecipe(url: string): Promise<{ jobId: string }> {
  const body = ImportRecipeSchema.parse({ sourceUrl: url, sourceType: 'url' })
  const response = await apiClient.post('/api/recipes/import', body)
  return response.data  // already typed from the API response
}

export async function getRecipe(id: string): Promise<Recipe> {
  const response = await apiClient.get(`/api/recipes/${id}`)
  // Parse and validate the response — Zod throws if server returns wrong shape
  return RecipeSchema.parse(response.data)
}
```

---

## The `shared/src/index.ts` Export Strategy

The root barrel controls exactly what is public. Everything not exported here is internal:

```ts
// shared/src/index.ts

// Schemas — grouped by domain
export * from './schemas/user'
export * from './schemas/scan'
export * from './schemas/recipe'
export * from './schemas/constraint'
export * from './schemas/ground'
export * from './schemas/bela'
export * from './schemas/recall'

// Branded types
export * from './types/branded'

// Shared constants
export * from './constants/verdict'
export * from './constants/tiers'
```

---

## Rules

- Never duplicate a schema. If a shape is used in both backend and mobile, it lives in `shared/`. Period.
- Never manually declare a type that can be `z.output<typeof SomeSchema>`. If the schema changes, the type updates automatically.
- Type names never end with `Result`, `Response`, `Request`, `Data`, `Info`, `Object`, or `Payload`. These are illegal padding. Name the type what it IS.
- All `z.coerce.date()` for any timestamp field — JSON does not have a Date type; coercion is always needed at the boundary.
- Schemas in `shared/` have no side effects, no external API calls, no environment variables. They are pure structure declarations.
- When a Drizzle query returns a row, do not expose the raw Drizzle type to the mobile app. Map it through the entity schema first — this decouples the DB schema from the API contract.
