# Shared Package — Zod Validators and Types

## The Contract

`@brioela/shared` is the contract between backend and mobile. Every shape of data that crosses the network boundary is defined here — once. Backend validates incoming requests against these schemas. Mobile validates API responses against these schemas. If the schema changes, both sides update together at compile time.

The shared package contains: Zod validators (with inferred types), route definitions, and constants. No `src/` wrapper — folders sit directly under `shared/`. No UI code, no React, no Cloudflare-specific code, no Node.js APIs. No `types/` folder — all types are inferred from Zod schemas via `z.output<>`.

---

## Folder Layout

```
shared/
├── validator/          — all Zod schemas and inferred types, scoped by domain
├── routes/             — ROUTES + ROUTE_PATTERNS for every feature
├── constants/          — shared constant values
└── package.json
```

---

## Validator File Structure

Each scope folder holds individual `.zod.ts` files — one concern per file, never dumped together. Every scope folder has an `index.ts` barrel.

```
shared/validator/
├── user/
│   ├── user.schema.ts            # UserSchema → type User
│   ├── user.id.type.ts           # all branded ID types + as*() constructors
│   └── index.ts
├── scan/
│   ├── scan.schema.ts            # ScanEventSchema, ScanVerdictSchema, VerdictLevelSchema → types
│   ├── create.scan.schema.ts     # CreateScanSchema → type CreateScan
│   └── index.ts
├── recipe/
│   ├── recipe.schema.ts          # RecipeSchema → type Recipe
│   ├── import.recipe.schema.ts   # ImportRecipeSchema → type ImportRecipe
│   ├── import.recipe.job.ts      # ImportRecipeJobSchema → type ImportRecipeJob
│   └── index.ts
├── constraint/
│   ├── constraint.schema.ts
│   ├── allergy.schema.ts
│   └── index.ts
├── ground/
│   ├── ground.find.schema.ts
│   ├── submit.find.schema.ts
│   └── index.ts
├── bela/
│   ├── bela.order.schema.ts
│   ├── create.order.schema.ts
│   └── index.ts
├── recall/
│   ├── recall.alert.schema.ts
│   └── index.ts
├── error/
│   ├── app.error.type.ts         # AppError class, ErrorCode, errors factory
│   └── index.ts
└── result/
    ├── result.type.ts            # Result<T,E>, ok(), err()
    └── index.ts
```

---

## Validator File — One Concern Per File

The suffix after the domain name is always a category word: `.schema.ts`, `.type.ts`, `.event.ts`, `.job.ts`. Never a domain noun as suffix. Files within a scope import from each other — no duplicate truth.

```ts
// shared/validator/scan/scan.schema.ts
import { z } from 'zod'

export const VerdictLevelSchema = z.enum(['safe', 'caution', 'danger', 'unknown'])

export const ScanConstraintViolationSchema = z.object({
  constraintId: z.string(),
  type:         VerdictLevelSchema,
  reason:       z.string(),
})

export const ScanVerdictSchema = z.object({
  level:      VerdictLevelSchema,
  reason:     z.string().max(200),
  violations: z.array(ScanConstraintViolationSchema),
  confidence: z.number().min(0).max(1),
})

export type VerdictLevel           = z.output<typeof VerdictLevelSchema>
export type ScanConstraintViolation = z.output<typeof ScanConstraintViolationSchema>
export type ScanVerdict            = z.output<typeof ScanVerdictSchema>
```

```ts
// shared/validator/scan/scan.schema.ts (continued — ScanEvent composes ScanVerdict defined above)
import { z } from 'zod'
import { UserIdSchema, ProductIdSchema } from '../user'

export const ScanEventSchema = z.object({
  id:        z.uuid(),
  userId:    UserIdSchema,
  upc:       z.string().min(6).max(14),
  productId: ProductIdSchema.optional(),
  verdict:   ScanVerdictSchema,
  scannedAt: z.coerce.date(),
})

export type ScanEvent = z.output<typeof ScanEventSchema>
```

```ts
// shared/validator/scan/create.scan.schema.ts
import { z } from 'zod'

export const CreateScanSchema = z.object({
  upc: z.string().min(6).max(14),
})

export type CreateScan = z.output<typeof CreateScanSchema>
```

---

## Branded ID Types — `validator/user/user.id.type.ts`

All domain IDs are branded. The `transform` on the Zod schema produces the branded type — validate and brand in one step. No separate `types/` folder.

```ts
// shared/validator/user/user.id.type.ts
import { z } from 'zod'

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

export const asUserId    = (s: string): UserId    => s as UserId
export const asRecipeId  = (s: string): RecipeId  => s as RecipeId
export const asOrderId   = (s: string): OrderId   => s as OrderId
export const asFindId    = (s: string): FindId    => s as FindId
export const asProductId = (s: string): ProductId => s as ProductId
export const asSessionId = (s: string): SessionId => s as SessionId
export const asShopperId = (s: string): ShopperId => s as ShopperId
export const asAlertId   = (s: string): AlertId   => s as AlertId

// Zod schemas — validate AND brand in one step
export const UserIdSchema    = z.uuid().transform(asUserId)
export const RecipeIdSchema  = z.uuid().transform(asRecipeId)
export const OrderIdSchema   = z.uuid().transform(asOrderId)
export const FindIdSchema    = z.uuid().transform(asFindId)
export const ProductIdSchema = z.uuid().transform(asProductId)
export const SessionIdSchema = z.uuid().transform(asSessionId)
export const ShopperIdSchema = z.uuid().transform(asShopperId)
export const AlertIdSchema   = z.uuid().transform(asAlertId)
```

---

## Input vs Entity Validators

Every API endpoint that accepts a body has an input schema separate from the entity schema. They are never the same schema. Type names never carry `Request`, `Response`, `Result`, or `Data` suffixes — name the type what it IS.

```ts
// shared/validator/recipe/import.recipe.schema.ts
import { z } from 'zod'

// Input for the import action — verb prefix (ImportRecipe) distinguishes from entity (Recipe)
export const ImportRecipeSchema = z.object({
  sourceUrl:  z.url(),
  sourceType: z.enum(['tiktok', 'youtube', 'instagram', 'url']),
})

export type ImportRecipe = z.output<typeof ImportRecipeSchema>
```

```ts
// shared/validator/recipe/import.recipe.job.ts
import { z } from 'zod'

// What the server returns when import is queued — it IS a job, so name it that
export const ImportRecipeJobSchema = z.object({
  jobId:     z.uuid(),
  status:    z.enum(['queued', 'processing']),
  createdAt: z.coerce.date(),
})

export type ImportRecipeJob = z.output<typeof ImportRecipeJobSchema>
```

```ts
// shared/validator/recipe/recipe.schema.ts
import { z } from 'zod'
import { RecipeIdSchema } from '../user'

export const RecipeIngredientSchema = z.object({
  name:     z.string(),
  quantity: z.string(),
  unit:     z.string().optional(),
})

export const RecipeSchema = z.object({
  id:          RecipeIdSchema,
  title:       z.string(),
  ingredients: z.array(RecipeIngredientSchema),
  steps:       z.array(z.string()),
  sourceUrl:   z.url().optional(),
  confidence:  z.number().min(0).max(1).optional(),
  createdAt:   z.coerce.date(),
})

export type RecipeIngredient = z.output<typeof RecipeIngredientSchema>
export type Recipe           = z.output<typeof RecipeSchema>
```

---

## Using Validators on the Backend

```ts
// backend/src/api/recipes/_handlers/import.recipe.handler.ts
import { ImportRecipeSchema } from '@brioela/shared'
import type { AppContext } from '@/index'

export async function importRecipe(c: AppContext) {
  const userId = c.get('userId')
  const body   = await c.req.json()

  const { sourceUrl, sourceType } = ImportRecipeSchema.parse(body)

  const job = await queueRecipeImport(sourceUrl, sourceType, userId)
  return { job }
}
```

---

## Using Validators on the Mobile

```ts
// mobile/network/recipe/recipe.api.ts
import { ImportRecipeSchema, RecipeSchema } from '@brioela/shared'
import type { Recipe, ImportRecipeJob } from '@brioela/shared'
import * as api from '@/network/core'
import { API_ROUTES } from '@brioela/shared'

export async function importRecipe(url: string): Promise<ImportRecipeJob> {
  const body = ImportRecipeSchema.parse({ sourceUrl: url, sourceType: 'url' })
  return api.post<ImportRecipeJob>(API_ROUTES.recipes.import(), body)
}

export async function getRecipe(id: string): Promise<Recipe> {
  const raw = await api.get<unknown>(API_ROUTES.recipes.getById(id))
  return RecipeSchema.parse(raw)
}
```

---

## The `shared/index.ts` Export Barrel

The root barrel controls exactly what is public. Every domain's `index.ts` re-exports its validators, the root barrel re-exports every domain:

```ts
// shared/index.ts
export * from './validator/user'
export * from './validator/scan'
export * from './validator/recipe'
export * from './validator/constraint'
export * from './validator/ground'
export * from './validator/bela'
export * from './validator/recall'

export * from './routes'
export * from './constants'
```

---

## Rules

- Never duplicate a schema. If a shape is used in both backend and mobile, it lives in `shared/validator/`. Period.
- Never manually declare a type that can be `z.output<typeof SomeSchema>`. If the schema changes, the type updates automatically.
- Type names never end with `Result`, `Response`, `Request`, `Data`, `Info`, `Object`, or `Payload`. Illegal padding. Name the type what it IS.
- All timestamp fields use `z.coerce.date()` — JSON does not have a Date type; coercion is always needed at the boundary.
- Schemas in `shared/` have no side effects, no external API calls, no environment variables. They are pure structure declarations.
- One concern per file. Never dump unrelated schemas together. The file suffix is always a category word (`.schema.ts`, `.type.ts`, `.event.ts`, `.job.ts`) — never a domain noun.
- Every scope folder has an `index.ts`. Consumers import from `@brioela/shared` — never from individual files inside `validator/`.
- When a Drizzle query returns a row, do not expose the raw Drizzle type to the mobile app. Map it through the entity schema first — this decouples the DB schema from the API contract.
