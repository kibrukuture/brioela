# Draft: build-guide/02-coding-standards/02-typescript-strictness.md

Target: `build-guide/02-coding-standards/02-typescript-strictness.md`

```
# TypeScript Strictness

## Root tsconfig.json

All packages extend this. The root config is the floor — packages may add stricter rules, never looser.

```json
{
  "compilerOptions": {
    "lib": ["ESNext"],
    "target": "ESNext",
    "module": "Preserve",
    "moduleDetection": "force",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "jsx": "react-jsx",

    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,

    "skipLibCheck": true,
    "allowJs": false,

    "paths": {
      "@brioela/shared": ["./shared/index.ts"],
      "@brioela/shared/*": ["./shared/*"],
      "@/": ["./src/"]
    }
  }
}
```

`noUncheckedIndexedAccess` is critical: `arr[0]` returns `T | undefined`, not `T`. This prevents a whole class of runtime crashes that TypeScript's default config silently allows.

`exactOptionalPropertyTypes` means `{ x?: string }` is NOT the same as `{ x?: string | undefined }`. Properties marked optional are absent or present — they cannot be explicitly set to `undefined`.

---

## The Hard Rules — No Exceptions

### No Padding Type Names

Type names never end with `Result`, `Response`, `Request`, `Data`, `Info`, `Object`, or `Payload`. These suffixes say nothing — they pad a name with a word that adds no meaning. Name the type for what it IS.

```ts
// ✗ banned — padding
type ScanResult      = { ... }
type ScanResponse    = { ... }
type ScanRequest     = { ... }
type VerdictData     = { ... }
type RecipePayload   = { ... }

// ✓ correct — name it what it is
type Scan            = { ... }   // the entity
type Verdict         = { ... }
type Recipe          = { ... }
type CreateScan      = { ... }   // verb prefix distinguishes input from entity
type ImportRecipe    = { ... }
```

To distinguish input from output shapes, use verb-prefixed names for inputs (`CreateScan`, `UpdateRecipe`, `ImportRecipe`) and noun-only names for entities (`Scan`, `Recipe`, `Verdict`). The `Result<T, E>` monad type in `error-handling.md` is exempt — it is a pattern name, not a domain type.

---

### No `any`

```ts
// ✗ banned
const data: any = fetchSomething()
function parse(input: any) {}

// ✓ correct — use unknown and narrow
function parse(input: unknown): Scan {
  return ScanSchema.parse(input)
}
```

`any` disables type checking entirely. It is not a shortcut — it is a lie to the compiler. If you do not know the type, use `unknown` and parse with Zod at the boundary.

### No `as unknown as T`

```ts
// ✗ banned — this is a duct-tape cast that bypasses the type system entirely
const result = fetchData() as unknown as Scan

// ✓ correct — parse at the boundary
const result = ScanSchema.parse(await fetchData())
```

If you need a type cast, the type boundary is in the wrong place. Fix the boundary.

### No type assertions for logic correctness

```ts
// ✗ banned — asserting non-null to paper over a nullable
const user = getUser()!

// ✓ correct — handle the null case
const user = getUser()
if (!user) throw new AppError('USER_NOT_FOUND')
```

The `!` non-null assertion is only permitted for DOM APIs and library types that are structurally non-null but typed as nullable for historical reasons. Never for application logic.

---

## Branded Types

Plain `string` IDs are a bug waiting to happen. A function that takes `userId: string` will happily accept a `recipeId`, an `orderId`, or a random UUID at runtime — no compile-time protection.

All domain IDs are branded types. Branded types are the same underlying type at runtime but distinct at compile time.

```ts
// shared/validator/user/user.id.type.ts

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

// Constructor functions — the only way to create a branded value
export const asUserId    = (s: string): UserId    => s as UserId
export const asRecipeId  = (s: string): RecipeId  => s as RecipeId
export const asOrderId   = (s: string): OrderId   => s as OrderId
export const asFindId    = (s: string): FindId    => s as FindId
export const asProductId = (s: string): ProductId => s as ProductId
export const asSessionId = (s: string): SessionId => s as SessionId
export const asShopperId = (s: string): ShopperId => s as ShopperId
export const asAlertId   = (s: string): AlertId   => s as AlertId
```

Branded types integrate with Zod:

```ts
// shared/validator/user/user.schema.ts
import { z } from 'zod'
import { asUserId } from './user.id.type'

export const UserIdSchema = z.uuid().transform(asUserId)
export type UserId = z.output<typeof UserIdSchema>
```

---

## Inference Over Declaration

Do not declare types that TypeScript can infer. Declare types at boundaries and let inference work everywhere else.

```ts
// ✗ redundant — TypeScript already knows this
const items: Array<Scan> = results.filter((r): r is Scan => r !== null)

// ✓ let inference do its job
const items = results.filter((r): r is Scan => r !== null)
// items is already Array<Scan>
```

Declare explicit types:
- Function parameters (always)
- Function return types on exported functions (always)
- `useSharedValue` initial value (Reanimated infers from initial, so this is usually fine)
- Zod schema inferred types via `z.infer<>` or `z.output<>`

---

## Type Narrowing Over Assertions

```ts
// ✗ — assertion bypasses narrowing
function processVerdict(verdict: unknown) {
  const v = verdict as Verdict
  return v.level
}

// ✓ — narrow with a type guard or Zod parse
function processVerdict(verdict: unknown): Verdict {
  return VerdictSchema.parse(verdict)
}
```

Use type predicates (`x is T`) for reusable runtime narrowing:

```ts
function isScanEvent(value: unknown): value is ScanEvent {
  return ScanEventSchema.safeParse(value).success
}
```

---

## `satisfies` for Literal Type Checking

When an object must conform to a type but you want TypeScript to infer the most specific type possible:

```ts
// ✓ — satisfies checks conformance, infers the narrowest type
const springConfigs = {
  landing: { stiffness: 200, damping: 0.82 },
  dismiss: { stiffness: 280, damping: 1.0 },
} satisfies Record<string, SpringConfig>

// springConfigs.landing.stiffness is 200, not number
```

---

## Exhaustive Switch Checks

Every `switch` over a union must be exhaustive. Use a `never` assertion in the default branch:

```ts
function getVerdictColor(verdict: VerdictLevel): string {
  switch (verdict) {
    case 'safe':    return colors.accent.primary
    case 'caution': return colors.accent.caution
    case 'danger':  return colors.accent.danger
    // If a new VerdictLevel is added, this line fails to compile
    default: {
      const _exhaustive: never = verdict
      throw new Error(`Unhandled verdict: ${_exhaustive}`)
    }
  }
}
```

---

## No `enum` — Use `const` Objects or Zod Enums

TypeScript `enum` generates runtime code, creates subtle nominal typing issues, and is not compatible with Zod well. Use `const` objects with `as const`:

```ts
// ✗ TypeScript enum
enum VerdictLevel { Safe = 'safe', Caution = 'caution', Danger = 'danger' }

// ✓ const object + Zod enum for schemas
export const VerdictLevel = {
  Safe:    'safe',
  Caution: 'caution',
  Danger:  'danger',
} as const

export type VerdictLevel = typeof VerdictLevel[keyof typeof VerdictLevel]

// In Zod schemas:
export const VerdictLevelSchema = z.enum(['safe', 'caution', 'danger'])
```

---

## Utility Types — Use, Don't Rewrite

TypeScript's built-in utility types (`Pick`, `Omit`, `Partial`, `Required`, `Readonly`, `ReturnType`, `Parameters`) are the correct tool for deriving types from existing ones. Never manually redeclare a subset of an interface.

```ts
// ✗ manually redeclaring
type ScanPreview = {
  id: ScanId
  verdict: VerdictLevel
}

// ✓ derived
type ScanPreview = Pick<Scan, 'id' | 'verdict'>
```
```
