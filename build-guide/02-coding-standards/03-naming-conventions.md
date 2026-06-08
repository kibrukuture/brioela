# Naming Conventions

Every name in the codebase communicates intent. A reader who has never seen the code should understand what a file, function, or type does from its name alone. No abbreviations. No ambiguous nouns. No generic names like `data`, `info`, `result`, `handler`, `manager`, `utils`.

---

## Files

### The Suffix Rule

Every file has a suffix that declares its role. The suffix comes after the descriptive name, separated by a dot. A reader navigating the folder tree knows what every file does without opening it.

| Suffix | Role | Example |
|---|---|---|
| `.route.ts` | Hono router — registers paths, imports controller | `scan.route.ts` |
| `.controller.ts` | Thin HTTP layer — on{Action}() wraps handler + c.json | `scan.controller.ts` |
| `.handler.ts` | Pure business logic — returns data, never c.json | `create.scan.handler.ts` |
| `.helper.ts` | Pure utility function | `build.verdict.helper.ts` |
| `.middleware.ts` | Hono middleware | `auth.middleware.ts` |
| `.agent.ts` | Durable Object class | `brain.agent.ts` |
| `.tool.ts` | AI-callable tool function | `write.user.memory.tool.ts` |
| `.schema.ts` | Drizzle table definition (backend `db/` and `_schema/`) — or Zod entity/input schema (shared `validator/`) | `products.schema.ts`, `scan.schema.ts` |
| `.type.ts` | Pure TypeScript type declarations — only when not derivable from a Zod schema | `user.id.type.ts` |
| `.event.ts` | Domain event schemas (shared `validator/`) | `scan.event.ts` |
| `.job.ts` | Queue job schemas (shared `validator/`) | `import.recipe.job.ts` |
| `.routes.ts` | Shared route definitions — ROUTES + ROUTE_PATTERNS | `scan.routes.ts` |
| `.lib.ts` | Feature business logic | `resolve.product.lib.ts` |
| `.constant.ts` | Shared constant values | `verdict.constant.ts` |
| `.store.ts` | Zustand store (mobile) | `use.ambient.store.ts` |
| `.hook.ts` | Custom React hook (mobile) | `use.scanner.hook.ts` |
| `.api.ts` | Raw fetch functions for one domain (mobile network layer) | `scan.api.ts` |
| `.client.ts` | Third-party service client instance | `gemini.client.ts` |
| `.feature.tsx` | Feature root component (mobile) | `scanner.feature.tsx` |
| `.variants.ts` | CVA variant definition (mobile) | `button.variants.ts` |
| `.glsl.ts` | SkSL shader source string | `ambient.glsl.ts` |
| `.test.ts` | Test file | `create.scan.handler.test.ts` |

**Suffixes are not optional.** `create.scan.ts` is wrong. `create.scan.handler.ts` is correct.

**Dots separate all structural parts of a file name — never hyphens.** The pattern is `{action}.{feature}.{role}.ts`. Handler names use action verbs (`create`, `update`, `get`, `list`, `delete`, `check`, `submit`) — never HTTP method names (`post`, `put`, `patch`).

`index.ts` is the only file that does not get a role suffix — it is always a barrel export.

### General Rule

File names are `kebab-case`. The descriptive part comes first, the suffix last.

```
✓ create.scan.handler.ts              — handler that creates a scan
✓ write.user.memory.tool.ts           — AI tool that writes user memory
✓ build.verdict.response.helper.ts    — pure helper that formats a verdict
✓ brain.agent.ts               — the BrioelaBrain DO class
✓ use.scanner.hook.ts                 — custom React hook for the scanner
✓ ambient.glsl.ts                     — ambient SkSL shader source string

✗ post-scan.handler.ts           — uses HTTP method name, not action verb
✗ create-scan.handler.ts         — hyphens, not dots
✗ utils.ts                       — what utils? no suffix, no role
✗ helpers.ts                     — same problem
✗ handler.ts                     — handler for what?
✗ scan.ts                        — is this a route? a helper? a schema?
✗ index.ts alone (with logic)    — index.ts is barrel-only, never logic
```

### Underscore-Scoped Folders

Within any feature folder, files of the same type are grouped in underscore-prefixed folders. The underscore signals "scoped collection" — it is not a standalone feature, it belongs to its parent.

```
routes/scan/
├── scan.route.ts
├── _handlers/                              ← scoped: handlers for scan routes
│   ├── create.scan.handler.ts
│   ├── get.scan.handler.ts
│   ├── list.scan.handler.ts
│   └── index.ts                           ← always present
├── _helpers/                              ← scoped: helpers for scan routes
│   ├── build.verdict.response.helper.ts
│   └── index.ts
└── index.ts                               ← barrel for the whole scan route folder
```

Valid underscore folder names:
- `_handlers/` — handler functions
- `_helpers/` — pure utility functions
- `_schema/` — Drizzle schema files (inside DO agents)
- `_types/` — local TypeScript type files
- `_hooks/` — custom React hooks (mobile features)
- `_components/` — feature-scoped UI components (mobile features)

Every underscore folder has an `index.ts`. Consuming code imports from the folder (`from './_handlers'`), never from individual files inside it.

### Component Files

React Native component files are `PascalCase`. The file name matches the component name exactly.

```
Button.tsx        → exports function Button
GlassCard.tsx     → exports function GlassCard
VerdictField.tsx  → exports function VerdictField
```

One component per file. A file named `Button.tsx` contains exactly one exported component called `Button`. If you need `IconButton`, it gets its own `IconButton.tsx`.

### Schema Files

Zod schema files live in `shared/validator/{scope}/`. The suffix after the domain name is always a **category word** — never a domain noun. Each scope folder has an `index.ts` barrel. Files can import from each other within the same scope — no duplicate truth.

| Suffix | Category |
|---|---|
| `.schema.ts` | Zod entity or input schemas + inferred types |
| `.type.ts` | Pure TypeScript types — only when not derivable from Zod |
| `.event.ts` | Domain event schemas |
| `.job.ts` | Queue job schemas |

```
scan.schema.ts           → ScanEventSchema, ScanVerdictSchema, VerdictLevelSchema + types
create.scan.schema.ts    → CreateScanSchema, type CreateScan
recipe.schema.ts         → RecipeSchema, type Recipe
import.recipe.schema.ts  → ImportRecipeSchema, type ImportRecipe
import.recipe.job.ts     → ImportRecipeJobSchema, type ImportRecipeJob
user.id.type.ts          → UserId, RecipeId, OrderId + as*() constructors
```

### Shader Files

SkSL shader source files have a `.glsl.ts` extension:

```
ambient.glsl.ts           → ambientShaderSource (string constant)
texture.glsl.ts           → textureShaderSource
holographic.glsl.ts       → holographicShaderSource
```

---

## Functions and Methods

### General Rule

Functions are `camelCase`. They start with a verb. The verb communicates what the function does, not what it returns.

```ts
// ✓ verb-first
async function resolveProduct(upc: string): Promise<Product> {}
async function checkConstraint(product: Product, userId: UserId): Promise<ConstraintResult> {}
async function logScanEvent(event: ScanEvent): Promise<void> {}
function formatCurrency(amount: number, currency: string): string {}
function buildSystemPrompt(context: SessionContext): string {}

// ✗ noun-first or vague
async function product(upc: string) {}         // what does it do?
async function constraintCheck() {}             // noun used as verb
async function handle(req: Request) {}          // handle what?
function data(input: unknown) {}               // no
```

### React Hooks

Custom hooks always start with `use`:

```ts
function useScanner(): ScannerState {}
function useVerdictAnimation(verdict: VerdictLevel): AnimatedStyle {}
function useBarcodeDetector(onDetect: (upc: string) => void): void {}
```

### Event Handlers

Event handlers are named `on{Event}` when they are props, and `handle{Event}` when they are local:

```tsx
// Component prop
type ButtonProps = { onPress: () => void }

// Local handler inside a component
const handlePress = () => { ... }
<Button onPress={handlePress} />
```

---

## Types and Interfaces

Types and interfaces are `PascalCase`. Type names are nouns or noun phrases that describe the shape of data, not the function that uses it.

**Banned suffixes: `Result`, `Response`, `Request`, `Data`, `Info`, `Object`, `Payload`.** These are illegal padding — they add a word that says nothing. Name the type for what it IS.

```ts
// ✓ name it what it IS
type Scan             = { ... }   // the entity
type Verdict          = { ... }
type VerdictLevel     = 'safe' | 'caution' | 'danger'
type SpringConfig     = { stiffness: number; damping: number }
type CreateScan       = { ... }   // verb prefix — this is input for creating a scan
type ImportRecipe     = { ... }   // verb prefix — input for importing a recipe

// ✗ banned padding
type ScanResult       = { ... }   // "Result" adds nothing — it IS a scan
type ScanResponse     = { ... }   // "Response" adds nothing
type ScanRequest      = { ... }   // "Request" adds nothing — use CreateScan
type VerdictData      = { ... }   // "Data" adds nothing
type RecipePayload    = { ... }   // "Payload" adds nothing

// ✗ vague or verb-based
type Data             = { ... }
type Config           = { ... }   // config for what?
```

Zod-inferred types use `z.infer<>` or `z.output<>`. Never manually redeclare a type that can be inferred from a schema:

```ts
// ✗ redundant manual declaration
type ScanEvent = {
  userId: UserId
  upc: string
  verdict: VerdictLevel
}

// ✓ infer from the schema — stays in sync automatically
export const ScanEventSchema = z.object({
  userId: UserIdSchema,
  upc: z.string(),
  verdict: VerdictLevelSchema,
})
export type ScanEvent = z.output<typeof ScanEventSchema>
```

---

## Constants

Top-level constants are `SCREAMING_SNAKE_CASE` for truly fixed values with no structure. Named token objects use `camelCase`:

```ts
// SCREAMING_SNAKE_CASE — fixed primitive values
const MAX_RETRY_ATTEMPTS = 3
const PRODUCT_CACHE_TTL_SECONDS = 3600
const SCAN_VERDICT_TIMEOUT_MS = 3000

// camelCase — named objects / token maps
const spring = {
  landing: { stiffness: 200, damping: 0.82 },
  dismiss: { stiffness: 280, damping: 1.0 },
}

const colors = {
  background: { primary: '#F8F6F2', deep: '#EDE9E3' },
  text: { primary: '#1C1917', secondary: '#78716C' },
}
```

---

## Zod Schema Names

Zod schemas always end with `Schema`. The corresponding inferred type drops the `Schema` suffix and follows the no-padding rule — it IS the thing, named directly.

```ts
// Entity schemas — noun only
UserSchema          → type User
ScanEventSchema     → type ScanEvent
RecipeSchema        → type Recipe
VerdictLevelSchema  → type VerdictLevel
ConstraintSchema    → type Constraint

// Input schemas — verb prefix distinguishes from entity
CreateScanSchema    → type CreateScan
ImportRecipeSchema  → type ImportRecipe
UpdateRecipeSchema  → type UpdateRecipe
```

`ScanResultSchema`, `RecipeResponseSchema`, `ScanRequestSchema` — all illegal. The suffix is padding.

---

## Database Table and Column Names

Drizzle table names are `snake_case` strings (SQL convention). Drizzle column names are `camelCase` in TypeScript, mapped to `snake_case` in SQL:

```ts
export const scanEvents = pgTable('scan_events', {
  id:        varchar('id').primaryKey(),
  userId:    varchar('user_id').notNull(),          // TS: userId → SQL: user_id
  upc:       varchar('upc').notNull(),
  verdict:   varchar('verdict').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
```

---

## Boolean Names

Boolean variables and props use `is`, `has`, `can`, or `should` prefix:

```ts
// ✓
const isLoading = false
const hasVerdict = verdict !== null
const canSubmit = formIsValid && !isLoading
const shouldAnimate = !reduceMotion

// ✗
const loading = false
const verdict = null  // ambiguous — is this the value or a flag?
const submit = true   // not obviously a boolean
```

---

## Abbreviations

No abbreviations except:
- `id` for identifier
- `url` for URL
- `api` for API
- `db` for database (only in variable names for the Drizzle client instance)
- `upc` for UPC barcode (domain term)
- `do` / `DO` for Durable Object (CF term)
- `ws` for WebSocket (only in the WebSocket connection variable)

Everything else is spelled out. `img` → `image`. `btn` → `button`. `msg` → `message`. `err` → `error`. `res` → `response`. `req` → `request`.
