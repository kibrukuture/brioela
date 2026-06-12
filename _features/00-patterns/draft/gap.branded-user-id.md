# Gap target: branded `UserId` on Hono context

**Pattern**: `05-backend-hono-patterns.md` — `AppContext` carries `userId: UserId` (branded).

**Shipped**: `backend/src/app/context.type.ts` sets `Variables.user: { id: string; email: string }`.

**Enforcement**: Documented only — no type guard for Hono context shape.

**Fix target**: Extend context type with `asUserId()` at auth middleware boundary; update all handlers.

**Related**: `_features/01-platform-foundation/status.md` G4; `02-typescript-strictness.md` branded types section
