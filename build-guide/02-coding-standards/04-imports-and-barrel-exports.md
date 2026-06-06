# Imports and Barrel Exports

## Path Aliases — Never Relative Hell

Every package uses path aliases. No `../../../` relative imports that traverse multiple folder levels. The rule: if a relative import goes up more than one level (`../`), it must use a path alias instead.

### Root `tsconfig.json` paths:

```json
{
  "compilerOptions": {
    "paths": {
      "@brioela/shared":   ["./shared/index.ts"],
      "@brioela/shared/*": ["./shared/*"]
    }
  }
}
```

### Backend `tsconfig.json` paths:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@/":              ["./src/"],
      "@/api/*":         ["./src/api/*"],
      "@/agents/*":      ["./src/agents/*"],
      "@/tools":         ["./src/tools/index.ts"],
      "@/core/*":        ["./src/core/*"],
      "@/db/*":          ["./src/db/*"],
      "@brioela/shared": ["../shared/index.ts"]
    }
  }
}
```

### Mobile `tsconfig.json` paths:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "paths": {
      "@/":                    ["./src/"],
      "@/features/*":          ["./src/features/*"],
      "@/components/*":        ["./src/components/*"],
      "@/design-system/*":     ["./src/design-system/*"],
      "@/generative-ui/*":     ["./src/generative-ui/*"],
      "@/network":             ["./src/network/index.ts"],
      "@/network/*":           ["./src/network/*"],
      "@/stores/*":            ["./src/stores/*"],
      "@/providers/*":         ["./src/providers/*"],
      "@/lib/*":               ["./src/lib/*"],
      "@brioela/shared":       ["../shared/index.ts"]
    }
  }
}
```

### Import examples:

```ts
// ✓ — clean alias imports
import { UserIdSchema } from '@brioela/shared'
import { spring } from '@/design-system/motion'
import { haptic } from '@/design-system/haptics'
import { useCreateScan } from '@/network/scan'
import { useScanner } from '@/features/scanner'

// ✗ — relative traversal banned
import { spring } from '../../../design-system/motion'
import { UserIdSchema } from '../../../../shared/validator/user'
```

---

## Barrel Exports — The Rule

A barrel file (`index.ts`) is a re-export file. It controls what is public from a folder. Nothing is imported from a non-barrel file in another folder — always from the barrel.

### When to use a barrel:

- Every feature folder in `mobile/src/features/{feature}/` has an `index.ts`
- Every shared component folder (`mobile/src/components/{Component}/`) has an `index.ts`
- Every tool domain folder (`backend/src/tools/{domain}/`) does NOT need a barrel — only `backend/src/tools/index.ts` exists (the single tool access point)
- `shared/src/index.ts` — the single entry point for the shared package

### Barrel rules:

**Only export what other folders/packages actually need.** A barrel is not "export everything." It is a deliberate public API for that module.

```ts
// mobile/src/features/scanner/index.ts
// ✓ — exports what other parts of the app need
export { useScanner } from './hooks/useScanner'
export { useBarcodeDetector } from './hooks/useBarcodeDetector'
export type { ScannerState, VerdictAnimationState } from './hooks/useScanner'
// Does NOT export: internal-only components, private helpers
```

```ts
// backend/src/tools/index.ts
// ✓ — ALL tools exported from one place, feature code imports from here
export { checkConstraint, logScanEvent } from './scan'
export { writeUserMemory, readUserMemory, logMemoryEvent } from './memory'
export { viewRecipe, updateRecipe, archiveRecipe } from './recipes'
export { proposeConstraint, confirmConstraint } from './constraints'
// ...all other tool domains
```

### Barrel anti-patterns:

```ts
// ✗ — re-exporting everything blindly
export * from './components'
export * from './hooks'
export * from './types'
export * from './utils'

// ✓ — named, intentional exports
export { Button } from './components/Button'
export { useScanner } from './hooks/useScanner'
export type { ScannerState } from './hooks/useScanner'
```

`export *` is banned. It creates invisible coupling — any new export in any sub-file immediately becomes part of the public API without a deliberate decision.

---

## Import Order

Imports are sorted in this order, with a blank line between each group:

```ts
// 1. Node built-ins (rarely needed in this stack)
import { createHash } from 'node:crypto'

// 2. External packages (npm/bun)
import { z } from 'zod'
import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'

// 3. Monorepo packages
import { UserIdSchema, type UserId } from '@brioela/shared'

// 4. Internal absolute imports (path aliases)
import { spring } from '@/design-system/motion'
import { checkConstraint } from '@/tools'

// 5. Relative imports (same folder or one level up only)
import { buildVerdict } from './build-verdict'
import type { ScanContext } from '../types'
```

Enforced by the project linter. No manual sorting required in practice — the linter fixes on save.

---

## Type-Only Imports

When importing a type, always use `import type`. This is enforced by `verbatimModuleSyntax` in the tsconfig — violations are compile errors.

```ts
// ✓
import type { UserId } from '@brioela/shared'
import type { ScanResult } from './types'

// ✗ — compile error with verbatimModuleSyntax
import { UserId } from '@brioela/shared'  // if UserId is only a type
```

Mixed imports are fine — types and values can share an import line:

```ts
import { UserIdSchema, type UserId } from '@brioela/shared'
```

---

## Circular Dependency Prevention

The dependency graph has a strict one-way flow. Violations are detected by the linter.

```
shared → (nothing)
backend → shared
mobile → shared
features → shared components, design-system, api, lib
components → design-system
design-system → (nothing internal — only external packages)
```

**Features never import from other features.** If two features need to share something, it moves to `mobile/src/components/` (if UI) or `mobile/src/lib/` (if logic) or `shared/` (if needed on backend too).

```ts
// ✗ feature importing from another feature — circular risk
// mobile/src/features/ground/hooks/useGround.ts
import { useScannerState } from '@/features/scanner'

// ✓ — extract the shared need to a neutral location
// mobile/src/lib/scan-state.ts
export function getScanContext(): ScanContext {}

// Both features import from lib
import { getScanContext } from '@/lib/scan-state'
```
