# Gap target: shared package root barrel

**Pattern**: `04-imports-and-barrel-exports.md` + `02-typescript-strictness.md` paths — `@brioela/shared` → `./shared/index.ts`.

**Shipped**: No `shared/index.ts`. Imports use subpaths: `@brioela/shared/zod`, `@brioela/shared/api`, etc.

**Enforcement**: None.

**Fix target**: Add `shared/index.ts` re-exporting public surface; align tsconfig paths.

**Related**: `_features/01-platform-foundation/status.md` G8
