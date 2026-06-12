# Cross-Cutting Patterns — Spec

Feature **00**. Not a shippable product feature. This folder is the **pattern catalog and contract** for engineering rules, conventions, process lessons, and enforcement relationships that apply repo-wide. Numbered features **01–54** inherit these patterns; they do not redefine them unless a feature spec explicitly documents an exception.

---

## Purpose

`00-patterns` answers:

1. **What rules apply everywhere** — monorepo layout, TypeScript strictness, backend/DO/brain-tool shapes, Drizzle boundaries, mobile hooks, testing, agent behavior.
2. **When they apply** — new Brioela code vs legacy Schnl code; sovereign vs free territory; boundary vs internal logic.
3. **How features relate** — which patterns are owned by **01** (platform shell), **03** (auth), **04+** (brain/product), and which are cross-cutting only.
4. **What is enforced mechanically** — name/type/lexicon guards, reading gate (partial), baselines — vs documented-only.

Source of truth for pattern *text* remains `build-guide/02-coding-standards/`, `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/`, and production exemplars. This spec **indexes and contracts** those sources; it does not replace them.

---

## Meta-rules (govern all patterns)

From `build-guide/02-coding-standards/00-overview.md`:

| # | Rule | Meaning |
|---|---|---|
| M1 | **One file, one responsibility** | File name declares role via suffix; `index.ts` is barrel-only. |
| M2 | **Types flow from shared outward** | Zod schemas, branded IDs, route constants live in `@brioela/shared`; backend/mobile import — never duplicate. |
| M3 | **Validate at the boundary, trust inside** | External input Zod-parsed at entry; no re-validation in business logic. |

From `build-guide/00-rules.md` (build-guide authoring — still relevant where code has not superseded):

| # | Rule | Meaning |
|---|---|---|
| M4 | **Feature-first docs** | Build-guide organized by product feature; tools described inside feature folders. |
| M5 | **One file one responsibility** (duplicate emphasis) | Same as M1 — conflicts with any monolithic file. |

---

## Pattern categories

### 1. Monorepo and folder structure

**Contract** (`01-monorepo-and-folder-structure.md`):

- Workspaces: `backend`, `shared`, `mobile`, plus `tools/brioela-{name,type,lexicon}-guard`, `tools/brioela-guard`, `tools/brioela-reading-gate` (scripts; not in root `workspaces` array today).
- **Suffix scoping**: `.route.ts`, `.controller.ts`, `.handler.ts`, `.helper.ts`, `.rpc.ts`, `.policy.ts`, `.agent.ts`, `.tool.ts`, `.schema.ts`, `.hook.ts`, `.feature.tsx`, etc.
- **Dot-separated names** — never hyphens in TS filenames: `create.scan.handler.ts` not `create-scan.handler.ts`.
- **Underscore folders** (`_handlers/`, `_schemas/`, `_tools/`, …) each require `index.ts` barrel; consumers import from folder, not inner files.
- **Routes from shared** — `API_ROUTES` / `API_ROUTE_PATTERNS`; no raw URL strings in backend or mobile.
- **Network vs feature hooks** — TanStack Query hooks in `mobile/network/`; UI state hooks in `mobile/features/*/_hooks/`.

**Intended backend layout** (Brioela product): `backend/src/api/{scan,recipes,ground,map,bela,recall,auth,notifications}/`, `backend/src/agents/{brain,mira}/`, `backend/src/tools/` (guide sample — see conflict G-doc-1).

**Intended shared layout**: `shared/validator/`, `shared/routes/`, `shared/constants/` (guide). **Shipped**: `shared/api/`, `shared/validators/`, `shared/drizzle/` (**01** G7).

**Relationship to features**: **01-platform-foundation** owns monorepo shell alignment; **02** mobile structure; **04** brain subtree under `backend/src/agents/brain/`.

---

### 2. TypeScript strictness

**Contract** (`02-typescript-strictness.md` + `CLAUDE.md` + `AGENTS.md`):

| Rule | Detail |
|---|---|
| Root `strict: true` | Floor for all packages; packages may add stricter flags, never looser. |
| `noUncheckedIndexedAccess` | Required — array access is `T \| undefined`. |
| `exactOptionalPropertyTypes` | Required in guide root tsconfig — **not enabled in shipped root** (G-enf-1). |
| No `any` | Use `unknown` + Zod at boundaries. |
| No `as unknown as T` | Fix the boundary instead. |
| No padding type names | No `ScanResult`, `ScanResponse`, `ScanPayload` — use `Scan`, `CreateScan`. |
| Branded IDs | `UserId`, `RecipeId`, … via `Brand<T,B>` + `asUserId()` constructors in `shared/validator/user/user.id.type.ts` (guide path). |
| No `enum` | `const` objects + `z.enum` for schemas. |
| Exhaustive `switch` | `never` in default branch. |
| `satisfies` | For literal objects needing narrow inference. |

**Legacy rule** (`AGENTS.md`): Schnl dead code — fix to compile, do not over-engineer. New Brioela code fully typed.

**Relationship**: **01** context types; all **04+** brain repos/tools; **03** auth IDs.

---

### 3. Naming and lexicon

**Contract** (`03-naming-conventions.md`, `13-file-name-enforcement.md`, lexicon guard):

- Verb-first handlers: `create`, `get`, `list` — never HTTP method names (`post`, `put`).
- Banned generic names: `utils`, `helpers`, `manager`, `data`, `result`, `payload` (as identifiers).
- Brain subtree: no redundant `brain.` in filenames when already under `agents/brain/` (`_records/.../002-brain-filenames-audit.md` — **FIXED**).
- Lexicon guard enforces product vocabulary (brain, memory, sessions, executable artifact naming, etc.) in `tools/brioela-lexicon-guard/_lexicon/`.

---

### 4. Imports and barrels

**Contract** (`04-imports-and-barrel-exports.md`):

- Path aliases: `@brioela/shared`, `@brioela/shared/*`, `@/` per workspace.
- Type-only imports where appropriate; barrel `index.ts` at underscore-folder boundaries.
- Guide requires root `shared/index.ts` barrel — **missing in production** (**01** G8).

---

### 5. Backend Hono patterns

**Contract** (`05-backend-hono-patterns.md`):

- Single Hono app; routes mounted via `API_ROUTES.{feature}.base`.
- Three layers: `.route.ts` → `.controller.ts` (`on{Action}()` + `c.json`) → `_handlers/*.handler.ts` (pure data return).
- `AppContext` with branded `userId` — **shipped uses `user: { id, email }`** (**01** G4).
- Response envelope `apiSuccessResponse` — guide `{ data }` only vs shipped `meta.requestId` (**01** G5).
- Auth middleware on `/api/*` — shipped uses `/v1/*` + `userId` query param (**01** G19–G20).

**Relationship**: **01** shell; product APIs **24–54**.

---

### 6. Durable Object and Agent patterns

**Contract** (`06-backend-do-agent-patterns.md`, `brioela-specs/24-technical-architecture-backbone.md`):

- Agent-backed DO extends `Agent` from `agents` package.
- Per-DO `_schema/` with Drizzle `sqliteTable`; business logic in `_handlers/`, `_rpc/`, `_policies/`, `_schedules/`, `_subagents/`.
- `@callable()` RPC methods on agent class; thin wrappers delegating to `_rpc/` or `_handlers/`.
- DO addressing: `env.BRIOELA_BRAIN.idFromName(userId)` (production binding name).
- KV storage only for scalars (alarm metadata); structured data in SQLite via Drizzle.
- `wrangler` `new_sqlite_classes` for every SQLite DO.
- WebSocket hibernation pattern for session DOs (**29**, **30**).

**Relationship**: **04-brain-foundation** owns Brain DO spine; **11–20** brain product; **29-cooking-session** MiraSession (not exported yet — **01** G3).

---

### 7. Brain tool pattern (split layout)

**Contract** (`build-guide/05-brain/02-tool-protocol.md`, `_features/05-brain-memory-tools/spec.md`):

Every AI-callable Brain tool uses four layers under `backend/src/agents/brain/_tools/`:

```text
{name}.tool.ts              — AI SDK tool() wrapper only
_schemas/{name}.schema.ts   — Zod input (import z from @brioela/shared/zod)
_prompts/{name}.prompt.ts   — model-facing description string
_executables/{name}.executable.ts — async logic; calls repositories only
```

**Strict rules**:

- Repositories own all Drizzle access; executables never import schema tables directly.
- Each `_schemas`, `_prompts`, `_executables` has `index.ts` barrel.
- Banned lexicon in tool files: `input`, `output`, `result`, `payload` as parameter names.
- Tools are the **only** LLM→SQLite interface for Brain tables.
- Registration via `getBrainTools(db, userId, sessionKind, …)` — **19-brain-tool-registry**.

**Production exemplar**: `write.user.memory.tool.ts` uses `tool({ inputSchema, execute })` without `any` (guide sample still shows `(tool as any)` — production is ahead of guide snippet).

**Relationship**: **05–18** implement tools; **19** registry; **20** wires `streamText`.

---

### 8. Data layer — Drizzle

**Contract** (`07-data-layer-drizzle.md`):

| Context | Driver | Location |
|---|---|---|
| Supabase Postgres | `drizzle-orm` + `pg` / `postgres` | `shared/drizzle/`, `backend/core/database/` |
| DO SQLite | `drizzle-orm/durable-sqlite` | `backend/src/agents/brain/_schemas/`, `_repositories/` |

**Hard rules**:

- No raw SQL in production runtime.
- No `ctx.storage.sql` in product code.
- No direct `db.execute(sql\`...\`)` escape hatches.
- JSON: parse at repository layer with Zod (`jsonValueSchema`), not `JSON.parse(x) as T`.
- Postgres: `pgSchema('brioela')`; user-private data in DO SQLite only.
- Migrations: Drizzle Kit `db:gen` / `db:mig`; Brain SQLite via generated SQL + Brioela migration runtime (**04**).

Type guard policies: `ban.raw.database.access`, `enforce.database.drizzle.surface`, `ban.drizzle.select.get`.

---

### 9. Shared package and Zod

**Contract** (`08-shared-package-zod.md`):

- Single Zod v4 entry: `@brioela/shared/zod`.
- Schemas infer types; separate `.type.ts` only when not derivable from Zod.
- Branded IDs via `z.uuid().transform(asUserId)`.
- `AppError` + `Result<T,E>` in shared error modules.

---

### 10. Mobile patterns

**Contract** (`09-mobile-patterns.md`, `CLAUDE.md`):

- Thin Expo Router screens (`mobile/app/`).
- Feature root `.feature.tsx`; logic in `_hooks/`.
- TanStack Query in `mobile/network/`.
- Zustand in `mobile/stores/`.
- NativeWind + CVA variants — **02-platform-design-system**.

**Effect hooks (hard rule)**:

- `usehooks-ts` only; `useIsomorphicLayoutEffect` — never `useEffect` / `useLayoutEffect` from `react`.
- Effect hooks only in `.hook.ts` or `/_hooks/` (enforced by type guard).

---

### 11. Error handling

**Contract** (`10-error-handling.md`):

- Routes: throw `AppError`, caught by Hono error middleware.
- Internal pure functions: `Result<T,E>` — no throw in business logic.
- Mobile: parse API errors from envelope; error boundaries for render failures.

---

### 12. Packages and bans

**Contract** (`11-packages.md`):

| Banned | Use instead |
|---|---|
| `express` | `hono` |
| `jest` / `vitest` (guide) | `bun test` (guide); **brain tests use vitest** — conflict G-doc-2 |
| `ioredis` | `@upstash/redis` / `Bun.redis` |
| `pg` (CLAUDE.md) | `Bun.sql` (CLAUDE.md) — **backend still uses `pg`** |
| `axios` | `fetch` |
| `better-sqlite3` | `bun:sqlite` / Drizzle durable-sqlite |
| `dotenv` | Bun auto-loads `.env` — root still has `dotenv` dep |

Install new packages only after recording in `11-packages.md`.

---

### 13. Testing

**Contract** (`12-testing-standards.md`):

- Runner: `bun test` with `bun:test` imports.
- Collocated `{name}.test.ts` next to source.
- Must test: Zod schemas, tools, pure helpers, `AppError` factories.
- Skip: component snapshots, design tokens, Reanimated, Skia.
- Mock external services — no real network in unit tests.

**Brain package exception**: `brain:test` runs `vitest` via `@cloudflare/vitest-pool-workers` for DO-isolate tests.

---

### 14. File-name enforcement

**Contract** (`13-file-name-enforcement.md`):

- `bun run check:names` / `watch:names` via `tools/brioela-name-guard`.
- Scope: `backend/`, `shared/`, `mobile/`, `build-guide/`, `implementable-specs/`, `brioela-specs/`, `_records/`.
- Validates suffixes, underscore folders, banned names, test pairing.

---

### 15. Reading gate and agent loop (process patterns)

**Contract** (`14-reading-gate.md`, `15-agent-loop-orchestration.md`):

- **Sovereign territory** (OS-locked): `tools/`, gate daemon state, hooks — agents cannot edit.
- **Free territory**: application code, specs, `_records/` — full agent write access.
- **Mechanical proof of reading**: `gate:read` → root-written manifest → attestation → signed pass record.
- **Work unit**: one implementation-ledger entry per assignment; `Required Reading` + `Touched Files` frontmatter.
- **Human role**: `sudo bun gate:up`, approve merges, rare sovereign ritual.

**Shipped slice 1** (`tools/brioela-reading-gate/`): `up`, `down`, `read`, `status`, `watch`, `verdict`, `smoke`, daemon socket, manifest append. **Not shipped**: `attest`, `check`, ed25519 pass records, clean-room merge executor, orchestrator services (G-enf-2).

---

### 16. Bun vs Node conventions

**Contract** (`CLAUDE.md`, `.cursor/rules/use-bun-instead-of-node-vite-npm-pnpm.mdc`):

- Package manager and scripts: `bun install`, `bun run`, `bun test`, `bun build`.
- Prefer `Bun.serve`, `bun:sqlite`, `Bun.redis`, `Bun.sql`, `Bun.file`.
- No `dotenv` (Bun loads `.env`).

**Production drift**: backend `build` uses `--target=node`; `@sentry/node` preload; `pg` Pool; `engines.node: 24.x` in `backend/package.json` (**01** G2). Mobile uses Expo (not `Bun.serve` frontend pattern from CLAUDE.md).

---

### 17. Web-first research

**Contract** (`CLAUDE.md`, `AGENTS.md`, `.cursor/rules/web-search-preapproved.mdc`):

- Always verify APIs, package versions, compatibility via official docs/web before assuming.
- External research pre-approved — never ask user for network permission.

---

### 18. Assistant and agent behavior

**Contract** (`CLAUDE.md`, `AGENTS.md`):

| Rule | Detail |
|---|---|
| Talk before code | No file edits without explicit user instruction ("go ahead", "do it", …). |
| Evidence-based | File paths, line numbers, spec text — no invented examples or numbers. |
| No yes-man | Challenge wrong ideas with proof. |
| Concise | Short answers; one recommended path. |
| No subagents | Unless user asks for parallel agent work. |
| No lazy shortcuts | Install missing deps; find current API; no stubs to silence errors. |
| Legacy Schnl | Ignore unless blocking Brioela work. |

---

### 19. Feature doc structure (`_features/`)

**Contract** (`_features/README.md`):

Each numbered feature folder holds:

| File | Role |
|---|---|
| `spec.md` | Behavior contract — intended vs shipped, gaps, relationships |
| `build.md` | File list, scripts, acceptance — no implementation code |
| `status.md` | `open` / `partial` / `shipped` + numbered gaps, blocked-by, blocks, sources |
| `draft/` | Production code snapshots (`.md` wrappers with real file contents) |

**00-patterns** uses same shape but status stays **`partial`** — patterns are living, not "shipped".

Migration: source docs in `build-guide/`, `implementable-specs/`, `brioela-specs/` remain until feature migration approved. **Do not delete sources.**

---

### 20. Process lessons (`_records/`)

Recurring failure modes documented in `_records/while-implementation-user-complaints/`:

| Lesson | Source | Pattern implication |
|---|---|---|
| Schema column name drift | `003-scheduled-alarms-scheduled-for-mismatch` | Align specs to Drizzle `scheduledAt` / `scheduled_at`; attest columns before implementing. |
| Invented columns from memory | reading-gate origin story | Required Reading + attestation — don't trust agent memory. |
| `JSON.parse` + `as T` | `010-json-parse-cast-guard` | Use `jsonValueSchema.parse()`; violations may hide in baselines. |
| Scattered `nanoid(24)` | `001-nanoid-centralize` | `createId()` from `shared/_ids/`. |
| Redundant `brain.` in paths | `002-brain-filenames-audit` | Folder provides context; suffix declares role. |
| Drizzle operator import drift | `010-drizzle-operator-imports-mismatch` | Import operators from `drizzle-orm` consistently. |
| Skill/recipe schema mismatches | `001-skill-versions`, `002-recipes-active-status` | Read schema files before tool executables. |

---

## Documented vs production conflicts (summary)

| ID | Pattern doc says | Production does | Owner |
|---|---|---|---|
| G-doc-1 | `tools/{feature}/` + `tools/index.ts` (`build-guide/00-rules.md` Rule 2) | Brain tools under `backend/src/agents/brain/_tools/` | **04+** brain features supersede old tools/ layout |
| G-doc-2 | `bun test` only (`12-testing-standards.md`) | `brain:test` uses `vitest` + CF pool | **04** DO test harness |
| G-doc-3 | `@brioela/backend`, `/api/*`, product routers | `@brioela/api`, `/v1/*`, Schnl routers | **01** |
| G-doc-4 | `shared/routes/`, `shared/validator/` | `shared/api/`, `shared/validators/` | **01** |
| G-doc-5 | `Bun.sql` not `pg` (CLAUDE.md) | `pg` Pool in `core/database/client.ts` | **01** |
| G-doc-6 | `tool-protocol` sample uses `(tool as any)` | Production `tool({ inputSchema })` typed | Guide stale |
| G-doc-7 | `_executable/` folder name in guide table | Production `_executables/` (plural) | Naming drift — pick one |

---

## Relationship to features 01–54

```text
00-patterns (cross-cutting rules + enforcement map)
    │
    ├── 01-platform-foundation    monorepo, Hono shell, shared drizzle spine, guards
    ├── 02-platform-design-system mobile tokens, components, motion
    ├── 03-platform-auth-onboarding auth UX on middleware from 01
    │
    ├── 04-brain-foundation       DO SQLite spine, migration runtime, exemplar repos
    ├── 05–18                     brain tool implementations (split layout)
    ├── 19-brain-tool-registry    getBrainTools + TOOL_PERMISSIONS
    ├── 20-brain-chat-runtime     streamText + tool wiring
    │
    └── 21–54                     product features — inherit M1–M3, Hono layers, shared routes
```

**Dependency rule**: Features cite **00** implicitly via coding standards. Feature `status.md` files list concrete `blocked-by` (usually **01**, **04**). Pattern gaps (G-enf-*) block *enforcement fidelity*, not individual product features, unless a feature spec depends on a missing guard.

---

## Exceptions

| Case | Rule relaxed | Evidence |
|---|---|---|
| Legacy Schnl backend/mobile | Full Brioela naming/layout | `AGENTS.md` — fix compile only |
| Type guard baselines | Known violations suppressed until fixed | `type:guard:baseline:update` workflow |
| Brain vitest tests | `bun test` for DO isolate harness | `backend/package.json` `brain:test` |
| Guide `tools/` tree | Brain tools live in agent subtree | G-doc-1 |

No other exceptions without updating this spec and the underlying coding-standards file.

---

## Acceptance (00 fully done when)

`00-patterns` is **never** `shipped` in the product sense. "Done" for this migration means:

- [x] `spec.md`, `build.md`, `status.md`, `draft/` exist with evidence-based gaps.
- [ ] Reading gate slices 2–4 implemented (attest, check, merge fortress) — tracked as G-enf-2.
- [ ] `bun run verify` runs all guards + tests — tracked as G-enf-3.
- [ ] Root tsconfig matches guide (`exactOptionalPropertyTypes`, path aliases) — G-enf-1.
- [ ] Production aligns with guide on `/api/*`, branded `UserId`, package names — **01** gaps.

---

## Source documents

- `build-guide/02-coding-standards/` (all 16 files)
- `build-guide/00-rules.md`
- `build-guide/05-brain/02-tool-protocol.md`
- `AGENTS.md`, `CLAUDE.md`
- `.cursor/rules/*.mdc`
- `brioela-specs/24-technical-architecture-backbone.md`
- `_records/while-implementation-user-complaints/`
- `_records/implementation-ledger/tooling/`
- `tools/brioela-{name,type,lexicon}-guard/`, `tools/brioela-guard/`, `tools/brioela-reading-gate/`
- `_features/README.md`
- `_features/01-platform-foundation/`, `_features/04-brain-foundation/`, `_features/19-brain-tool-registry/`
- Production exemplars: `backend/src/agents/brain/_tools/`, `shared/_ids/`
