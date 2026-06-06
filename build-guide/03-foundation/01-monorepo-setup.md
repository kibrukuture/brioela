# Foundation — Monorepo Setup

## Root Structure

```
brioela/
├── backend/
├── shared/
├── mobile/
├── build-guide/
├── brioela-specs/
├── package.json          ← workspace root
├── tsconfig.json         ← base tsconfig all packages extend
└── bun.lock
```

No `src/` at the root. Each workspace is standalone.

---

## Root `package.json`

```json
{
  "name": "brioela-monorepo",
  "private": true,
  "workspaces": ["backend", "shared", "mobile"],
  "scripts": {
    "dev:backend": "bun run --cwd backend dev",
    "dev:mobile":  "bun run --cwd mobile start"
  }
}
```

Nothing lives in root `dependencies`. All packages go in the workspace that uses them.

---

## Root `tsconfig.json`

The base config every workspace extends. Sets the floor — no workspace may go looser.

```json
{
  "compilerOptions": {
    "lib":                        ["ESNext"],
    "target":                     "ESNext",
    "module":                     "ESNext",
    "moduleDetection":            "force",
    "moduleResolution":           "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax":       true,
    "noEmit":                     true,
    "jsx":                        "react-jsx",

    "strict":                     true,
    "noImplicitAny":              true,
    "strictNullChecks":           true,
    "strictFunctionTypes":        true,
    "noImplicitReturns":          true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess":   true,
    "noImplicitOverride":         true,
    "exactOptionalPropertyTypes": true,

    "skipLibCheck": true,
    "allowJs":      false,

    "paths": {
      "@brioela/shared":   ["./shared/index.ts"],
      "@brioela/shared/*": ["./shared/*"]
    }
  }
}
```

---

## Path Alias Convention

| Alias | Resolves to | Who uses it |
|---|---|---|
| `@brioela/shared` | `shared/index.ts` | backend + mobile |
| `@brioela/shared/*` | `shared/*` | backend + mobile |
| `@/*` | `src/*` (backend) or `./` (mobile) | each workspace internally |

Each workspace has its own `tsconfig.json` that extends the root and adds its own `paths`.
