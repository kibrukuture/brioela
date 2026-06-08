# Error Handling

## The Principle

Errors are values. An operation that can fail returns either a result or an error — not a mystery exception that surfaces 10 layers up the call stack with no context.

Two error handling patterns are used in this codebase depending on context:
- **Backend route/middleware level**: throw typed errors, caught by Hono error middleware, formatted into consistent API response
- **Internal functions**: return `Result<T, E>` type — no throwing inside business logic

---

## AppError — The Error Type

All application errors are instances of `AppError`. This is a typed, serializable error class with a machine-readable `code` and a human-readable `message`.

```ts
// shared/validator/error/app.error.type.ts
export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'SCAN_RESOLVE_FAILED'
  | 'CONSTRAINT_VIOLATION'
  | 'RECIPE_IMPORT_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR'

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Factory functions — preferred over `new AppError(...)` inline
export const errors = {
  unauthorized:  (msg = 'Unauthorized') =>
    new AppError('UNAUTHORIZED', msg, 401),

  notFound:      (resource: string) =>
    new AppError('NOT_FOUND', `${resource} not found`, 404),

  rateLimited:   () =>
    new AppError('RATE_LIMIT_EXCEEDED', 'Too many requests', 429),

  validation:    (details: unknown) =>
    new AppError('VALIDATION_ERROR', 'Validation failed', 422, details),

  internal:      (msg = 'Internal server error') =>
    new AppError('INTERNAL_ERROR', msg, 500),
}
```

---

## Backend Error Middleware

One error middleware catches everything thrown in route handlers. It formats the error into the standard API envelope:

```ts
// backend/src/core/middleware/error.middleware.ts
import type { MiddlewareHandler } from 'hono'
import { ZodError } from 'zod'
import { AppError } from '@brioela/shared'

export const errorMiddleware: MiddlewareHandler = async (c, next) => {
  try {
    await next()
  } catch (error) {
    if (error instanceof AppError) {
      return c.json(
        { error: error.code, message: error.message, details: error.details },
        error.statusCode as never,
      )
    }

    if (error instanceof ZodError) {
      return c.json(
        { error: 'VALIDATION_ERROR', message: 'Validation failed', details: error.issues },
        422,
      )
    }

    // Unknown errors — do not expose internals
    console.error('[UNHANDLED]', error)
    return c.json({ error: 'INTERNAL_ERROR', message: 'Something went wrong' }, 500)
  }
}
```

Route handlers throw `AppError` instances — the middleware handles formatting:

```ts
// In a route handler
const product = await resolveProduct(upc)
if (!product) throw errors.notFound('Product')
```

---

## Result Type for Internal Functions

Internal library functions that can fail return a `Result<T, E>` rather than throwing. This makes error handling explicit at the call site and prevents silent error swallowing.

```ts
// shared/validator/result/result.type.ts
export type Ok<T>  = { ok: true;  value: T }
export type Err<E> = { ok: false; error: E }
export type Result<T, E = AppError> = Ok<T> | Err<E>

export const ok  = <T>(value: T): Ok<T>   => ({ ok: true, value })
export const err = <E>(error: E): Err<E>  => ({ ok: false, error })
```

```ts
// backend/src/lib/scan/resolve-product.ts
import { ok, err, type Result } from '@brioela/shared'
import type { Product } from '@brioela/shared'

export async function resolveProduct(upc: string): Promise<Result<Product>> {
  try {
    const cached = await checkRedisCache(upc)
    if (cached) return ok(cached)

    const product = await fetchFromOpenFoodFacts(upc)
    if (!product) return err(errors.notFound('Product'))

    await writeToCache(upc, product)
    return ok(product)
  } catch (cause) {
    return err(new AppError('SCAN_RESOLVE_FAILED', 'Failed to resolve product', 500, cause))
  }
}

// Call site — error is handled explicitly
const result = await resolveProduct(upc)
if (!result.ok) throw result.error  // now it becomes a thrown error at the route boundary
const product = result.value
```

---

## Mobile Error Handling

### API Errors

TanStack Query surfaces errors automatically. Components check the `error` state:

```tsx
function RecipeList() {
  const { data, error, isLoading } = useRecipes()

  if (error) return <ErrorState error={error} />
  if (isLoading) return null  // Breath animation handles the visual
  return <RecipeListContent recipes={data!} />
}
```

The `ErrorState` component is a shared design system component. It receives an `AppError` (or unknown error) and renders appropriate copy. It is never generative — always static.

### Zod Parse Errors

Zod parse errors on API responses indicate a backend/mobile contract mismatch — a bug, not a user-facing problem. These are logged and surfaced as generic errors:

```ts
// mobile/network/recipe/recipe.api.ts
export async function getRecipe(id: string): Promise<Recipe> {
  const raw = await api.get<unknown>(API_ROUTES.recipes.getById(id))
  try {
    return RecipeSchema.parse(raw)
  } catch (error) {
    if (error instanceof ZodError) {
      // Log the schema mismatch — this is a contract bug
      console.error('[CONTRACT MISMATCH] RecipeSchema parse failed', error.issues)
    }
    throw errors.internal('Failed to parse recipe response')
  }
}
```

### Error Boundaries

React error boundaries wrap each major screen section. If a component throws during render, the boundary catches it and renders a fallback without crashing the whole app.

```tsx
// mobile/components/ErrorBoundary/ErrorBoundary.tsx
import React from 'react'

type State = { hasError: boolean }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('[ERROR BOUNDARY]', error)
  }

  render() {
    if (this.state.hasError) return <FallbackView />
    return this.props.children
  }
}
```

Every screen root component is wrapped in `ErrorBoundary`:

```tsx
// mobile/app/(tabs)/index.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ScanView } from '@/features/scanner'

export default function ScanScreen() {
  return (
    <ErrorBoundary>
      <ScanView />
    </ErrorBoundary>
  )
}
```

---

## Rules

- Never swallow errors silently with an empty `catch {}`.
- Never `console.log` an error in production paths — use `console.error` with context.
- Internal functions that can fail return `Result<T>`. Route handlers and hooks throw.
- The error middleware is the only place where raw errors are caught at the HTTP layer. Route handlers do not try/catch — they throw and trust the middleware.
- Zod validation errors from `@hono/zod-validator` are automatically caught by the error middleware via Hono's built-in error forwarding.
- AppError is the ONLY error class used for application-level errors. No custom error subclasses beyond AppError.
