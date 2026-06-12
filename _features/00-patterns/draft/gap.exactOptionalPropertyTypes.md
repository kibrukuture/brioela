# Gap target: `exactOptionalPropertyTypes`

**Pattern**: `build-guide/02-coding-standards/02-typescript-strictness.md` requires `exactOptionalPropertyTypes: true` in root `tsconfig.json`.

**Shipped**: Root `tsconfig.json` does not set this flag.

**Evidence**:

```json
// tsconfig.json — missing exactOptionalPropertyTypes
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Enforcement**: TypeScript compiler only — not covered by type guard.

**Fix target**: Enable in root `tsconfig.json`; fix compile errors workspace-wide.

**Related**: `_features/01-platform-foundation/status.md` G21
