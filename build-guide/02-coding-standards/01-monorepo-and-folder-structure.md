# Monorepo and Folder Structure

## The Scoping Pattern — Applies Everywhere

Every folder in this codebase uses the same pattern:

1. **File suffixes** tell you the file's role at a glance — without opening it:
   - `.route.ts` — Hono router definition
   - `.controller.ts` — thin HTTP layer: on{Action}() wrappers that call handlers and return c.json
   - `.handler.ts` — pure business logic — returns data, never c.json
   - `.helper.ts` — pure utility function
   - `.middleware.ts` — Hono middleware
   - `.agent.ts` — Durable Object class
   - `.tool.ts` — AI-callable tool function
   - `.schema.ts` — Drizzle table definition (backend `db/` and `_schema/`) or Zod entity/input schema (shared `validator/`)
   - `.type.ts` — pure TypeScript type declarations — only when not derivable from a Zod schema
   - `.event.ts` — domain event schemas (shared `validator/`)
   - `.job.ts` — queue job schemas (shared `validator/`)
   - `.routes.ts` — shared route definitions (ROUTES + ROUTE_PATTERNS)
   - `.lib.ts` — feature business logic
   - `.constant.ts` — shared constant values
   - `.store.ts` — Zustand store (mobile)
   - `.hook.ts` — custom React hook (mobile)
   - `.feature.tsx` — feature root component (mobile)
   - `.variants.ts` — CVA variant definition (mobile)
   - `.glsl.ts` — SkSL shader source string
   - `.api.ts` — raw fetch functions for one domain (mobile network layer)
   - `.client.ts` — third-party service client instance

2. **Dots separate all structural parts of a file name — never hyphens.** The pattern is `{action}.{feature}.{role}.ts`. Handler names use action verbs (`create`, `update`, `get`, `list`, `delete`, `check`, `submit`) — never HTTP method names (`post`, `put`, `patch`).

3. **Underscore-prefixed folders** scope files of the same type within a parent feature:
   - `_handlers/` — all handler files for this scope + `index.ts`
   - `_helpers/` — all helper files for this scope + `index.ts`
   - `_schema/` — all Drizzle schema files for this scope (DO agents) + `index.ts`
   - `_types/` — local type files for this scope + `index.ts`
   - `_hooks/` — UI state hook files for this scope (mobile features) + `index.ts`
   - `_components/` — components for this scope (mobile features) + `index.ts`

4. **Every underscore folder has `index.ts`** that re-exports everything in it. Consumers import from the folder, never from individual files inside it.

5. **This pattern is not optional and not just for routes.** It applies to agents, tools, lib, features, components — everywhere.

---

## Top-Level Layout

```
brioela/
├── backend/                      # @brioela/backend — Cloudflare Workers + DOs
├── shared/                       # @brioela/shared  — routes, schemas, types, constants
├── mobile/                       # @brioela/mobile  — Expo React Native
├── build-guide/
├── brioela-specs/
├── _records/
├── tsconfig.json
├── package.json
└── bun.lock
```

---

## Backend — `backend/`

The root `index.ts` mounts all routes using `API_ROUTES.{feature}.base` from shared — no raw URL strings anywhere in the backend.

```
backend/
├── src/
│   ├── index.ts                        # Hono root — mounts routes via API_ROUTES, exports AppContext + DO classes
│   │
│   ├── api/                            # Feature route folders — one folder per feature
│   │   ├── scan/
│   │   │   ├── scan.route.ts           # Hono router — uses ROUTE_PATTERNS from shared, no raw strings
│   │   │   ├── scan.controller.ts      # on{Action}() wrappers: calls handler, returns c.json(apiSuccessResponse(result))
│   │   │   ├── _handlers/
│   │   │   │   ├── create.scan.handler.ts   # pure logic — returns data, not c.json
│   │   │   │   ├── get.scan.handler.ts
│   │   │   │   ├── list.scan.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── _helpers/
│   │   │   │   ├── build.verdict.helper.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── recipes/
│   │   │   ├── recipes.route.ts
│   │   │   ├── recipes.controller.ts
│   │   │   ├── _handlers/
│   │   │   │   ├── create.recipe.handler.ts
│   │   │   │   ├── get.recipe.handler.ts
│   │   │   │   ├── list.recipe.handler.ts
│   │   │   │   ├── update.recipe.handler.ts
│   │   │   │   ├── archive.recipe.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── _helpers/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── ground/
│   │   │   ├── ground.route.ts
│   │   │   ├── ground.controller.ts
│   │   │   ├── _handlers/
│   │   │   │   ├── submit.find.handler.ts
│   │   │   │   ├── list.find.handler.ts
│   │   │   │   ├── vote.find.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── _helpers/
│   │   │   │   ├── run.ai.gate.helper.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── map/
│   │   │   ├── map.route.ts
│   │   │   ├── map.controller.ts
│   │   │   ├── _handlers/
│   │   │   │   ├── get.places.handler.ts
│   │   │   │   ├── get.signals.handler.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── bela/
│   │   │   ├── order.route.ts
│   │   │   ├── order.controller.ts
│   │   │   ├── _handlers/
│   │   │   │   ├── create.order.handler.ts
│   │   │   │   ├── confirm.order.handler.ts
│   │   │   │   ├── dispute.order.handler.ts
│   │   │   │   ├── register.shopper.handler.ts
│   │   │   │   ├── submit.scan.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── _helpers/
│   │   │   │   ├── calculate.escrow.helper.ts
│   │   │   │   ├── build.route.plan.helper.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── recall/
│   │   │   ├── recall.route.ts
│   │   │   ├── recall.controller.ts
│   │   │   ├── _handlers/
│   │   │   │   ├── check.recall.handler.ts
│   │   │   │   ├── list.alert.handler.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.route.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── _handlers/
│   │   │   │   ├── create.session.handler.ts
│   │   │   │   ├── refresh.session.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── _helpers/
│   │   │   │   ├── verify.jwt.helper.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── notifications/
│   │       ├── notifications.route.ts
│   │       ├── notifications.controller.ts
│   │       ├── _handlers/
│   │       │   ├── register.device.handler.ts
│   │       │   ├── send.notification.handler.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   ├── agents/                         # Durable Object classes — one folder per DO
│   │   ├── orchestrator/
│   │   │   ├── orchestrator.agent.ts   # DO class — fetch(), alarm(), WebSocket lifecycle
│   │   │   ├── _schema/
│   │   │   │   ├── memory.schema.ts
│   │   │   │   ├── constraints.schema.ts
│   │   │   │   ├── recipes.schema.ts
│   │   │   │   ├── sessions.schema.ts
│   │   │   │   ├── skills.schema.ts
│   │   │   │   └── index.ts
│   │   │   ├── _handlers/
│   │   │   │   ├── read.memory.handler.ts
│   │   │   │   ├── read.constraint.handler.ts
│   │   │   │   ├── read.recipe.handler.ts
│   │   │   │   ├── load.context.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── _helpers/
│   │   │   │   ├── load.context.helper.ts
│   │   │   │   ├── compress.context.helper.ts
│   │   │   │   ├── extract.facts.helper.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── cooking/
│   │       ├── cooking.agent.ts
│   │       ├── _schema/
│   │       │   ├── session.schema.ts
│   │       │   ├── turns.schema.ts
│   │       │   └── index.ts
│   │       ├── _handlers/
│   │       │   ├── websocket.handler.ts
│   │       │   ├── alarm.handler.ts
│   │       │   └── index.ts
│   │       ├── _helpers/
│   │       │   ├── connect.gemini.helper.ts
│   │       │   ├── generate.speech.helper.ts
│   │       │   ├── build.system.prompt.helper.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   ├── tools/                          # AI-callable tools — one file per tool
│   │   ├── memory/
│   │   │   ├── write.user.memory.tool.ts
│   │   │   ├── read.user.memory.tool.ts
│   │   │   ├── log.memory.event.tool.ts
│   │   │   └── index.ts
│   │   ├── scan/
│   │   │   ├── check.constraint.tool.ts
│   │   │   ├── log.scan.event.tool.ts
│   │   │   └── index.ts
│   │   ├── recipes/
│   │   │   ├── view.recipe.tool.ts
│   │   │   ├── update.recipe.tool.ts
│   │   │   ├── archive.recipe.tool.ts
│   │   │   └── index.ts
│   │   ├── constraints/
│   │   │   ├── propose.constraint.tool.ts
│   │   │   ├── confirm.constraint.tool.ts
│   │   │   └── index.ts
│   │   ├── skills/
│   │   │   ├── create.skill.tool.ts
│   │   │   ├── update.skill.tool.ts
│   │   │   ├── archive.skill.tool.ts
│   │   │   └── index.ts
│   │   ├── alarms/
│   │   │   ├── schedule.alarm.tool.ts
│   │   │   ├── cancel.alarm.tool.ts
│   │   │   └── index.ts
│   │   ├── session/
│   │   │   ├── load.context.tool.ts
│   │   │   ├── search.history.tool.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── core/                           # Backend infrastructure — not feature-specific
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   ├── rate.limit.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   └── cors.middleware.ts
│   │   ├── clients/                    # Third-party service clients
│   │   │   ├── gemini.client.ts
│   │   │   ├── upstash.redis.client.ts
│   │   │   ├── upstash.qstash.client.ts
│   │   │   └── stripe.client.ts
│   │   ├── database/
│   │   │   └── db.client.ts            # Drizzle + Supabase connection
│   │   ├── email/
│   │   │   ├── email.client.ts
│   │   │   └── templates/              # JSX email templates
│   │   └── config/
│   │       └── env.ts
│   │
│   ├── db/                             # Supabase Postgres — Drizzle
│   │   ├── schema/
│   │   │   ├── _shared.schema.ts       # shared columns (timestamps, soft-delete)
│   │   │   ├── products.schema.ts
│   │   │   ├── community.schema.ts
│   │   │   ├── map.schema.ts
│   │   │   ├── bela.schema.ts
│   │   │   ├── recall.schema.ts
│   │   │   └── index.ts
│   │   ├── migrations/
│   │   └── drizzle.config.ts
│   │
│   └── types.ts                        # AppContext type, Env, Bindings
│
├── wrangler.toml
├── tsconfig.json
└── package.json
```

---

## Shared — `shared/`

The shared package is the contract between backend and mobile. It contains: Zod validators, route definitions, and constants. No UI code, no Cloudflare APIs, no React. No `src/` wrapper — `validator/`, `routes/`, and `constants/` sit directly under `shared/`.

```
shared/
├── validator/                          # All Zod schemas and inferred types — scoped by domain
│   ├── user/
│   │   ├── user.schema.ts              # UserSchema → type User
│   │   ├── user.id.type.ts             # UserId, RecipeId, OrderId, FindId, ... + as*() constructors
│   │   └── index.ts
│   ├── scan/
│   │   ├── scan.schema.ts              # ScanEventSchema, ScanVerdictSchema, VerdictLevelSchema → types
│   │   ├── create.scan.schema.ts       # CreateScanSchema → type CreateScan
│   │   └── index.ts
│   ├── recipe/
│   │   ├── recipe.schema.ts            # RecipeSchema → type Recipe
│   │   ├── import.recipe.schema.ts     # ImportRecipeSchema → type ImportRecipe
│   │   ├── import.recipe.job.ts        # ImportRecipeJobSchema → type ImportRecipeJob
│   │   └── index.ts
│   ├── constraint/
│   │   ├── constraint.schema.ts
│   │   ├── allergy.schema.ts
│   │   └── index.ts
│   ├── ground/
│   │   ├── ground.find.schema.ts
│   │   ├── submit.find.schema.ts
│   │   └── index.ts
│   ├── bela/
│   │   ├── bela.order.schema.ts
│   │   ├── create.order.schema.ts
│   │   └── index.ts
│   ├── recall/
│   │   ├── recall.alert.schema.ts
│   │   └── index.ts
│   ├── error/
│   │   ├── app.error.type.ts       # AppError class, ErrorCode, errors factory
│   │   └── index.ts
│   └── result/
│       ├── result.type.ts          # Result<T,E>, ok(), err()
│       └── index.ts
│
├── routes/                             # Route definitions — single source of truth for all URLs
│   ├── scan.routes.ts                  # SCAN_ROUTES (full URLs for mobile) + SCAN_ROUTE_PATTERNS (Hono patterns for backend)
│   ├── recipe.routes.ts
│   ├── ground.routes.ts
│   ├── map.routes.ts
│   ├── bela.routes.ts
│   ├── recall.routes.ts
│   ├── auth.routes.ts
│   ├── notifications.routes.ts
│   └── index.ts                        # exports API_ROUTES (mobile) + API_ROUTE_PATTERNS (backend)
│
├── constants/                          # Shared constant values — scoped by domain
│   ├── verdict/
│   │   └── verdict.constant.ts
│   ├── tiers/
│   │   └── tiers.constant.ts
│   └── index.ts
│
└── package.json
```

### How routes work — two exports per file

Every `{feature}.routes.ts` exports two objects:
- `{FEATURE}_ROUTES` — full URL strings: `create: () => "/api/scan"`. Used by mobile `{domain}.api.ts`.
- `{FEATURE}_ROUTE_PATTERNS` — Hono path patterns: `create: "/scan"`. Used by backend `{feature}.route.ts`.

`shared/routes/index.ts` assembles them into `API_ROUTES` and `API_ROUTE_PATTERNS`. Neither backend nor mobile ever writes a raw URL string.

---

## Mobile — `mobile/`

```
mobile/
├── app/                                # Expo Router screens — thin wrappers only
│   ├── _layout.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx                   # scan tab
│   │   ├── ground.tsx
│   │   ├── map.tsx
│   │   └── profile.tsx
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── onboarding.tsx
│   ├── recipe/[id].tsx
│   ├── cooking-session/[sessionId].tsx
│   └── +not-found.tsx
│
├── network/                            # ALL server state — one folder per API domain
│   ├── core/
│   │   ├── client.ts                  # fetch-based HTTP client — auth headers, retry, error parsing
│   │   ├── query.keys.ts              # QUERY_KEYS — all TanStack query key arrays in one place
│   │   └── index.ts
│   │
│   ├── scan/
│   │   ├── scan.api.ts                # pure fetch functions — uses API_ROUTES.scan.*
│   │   ├── use.create.scan.hook.ts
│   │   ├── use.scan.hook.ts
│   │   ├── use.scan.history.hook.ts
│   │   └── index.ts
│   │
│   ├── recipe/
│   │   ├── recipe.api.ts
│   │   ├── use.recipes.hook.ts
│   │   ├── use.recipe.hook.ts
│   │   ├── use.create.recipe.hook.ts
│   │   ├── use.update.recipe.hook.ts
│   │   ├── use.archive.recipe.hook.ts
│   │   └── index.ts
│   │
│   ├── ground/
│   │   ├── ground.api.ts
│   │   ├── use.finds.hook.ts
│   │   ├── use.submit.find.hook.ts
│   │   ├── use.vote.find.hook.ts
│   │   └── index.ts
│   │
│   ├── map/
│   │   ├── map.api.ts
│   │   ├── use.places.hook.ts
│   │   ├── use.signals.hook.ts
│   │   └── index.ts
│   │
│   ├── bela/
│   │   ├── bela.api.ts
│   │   ├── use.create.order.hook.ts
│   │   ├── use.confirm.order.hook.ts
│   │   └── index.ts
│   │
│   ├── recall/
│   │   ├── recall.api.ts
│   │   ├── use.recall.hook.ts
│   │   ├── use.alerts.hook.ts
│   │   └── index.ts
│   │
│   └── auth/
│       ├── auth.api.ts
│       ├── use.create.session.hook.ts
│       └── index.ts
│
├── features/                           # Feature UI — composes network hooks + local UI state
│   ├── scanner/
│   │   ├── scanner.feature.tsx         # root component rendered by the screen
│   │   ├── _components/
│   │   │   ├── VerdictCard.tsx
│   │   │   ├── ScanOverlay.tsx
│   │   │   └── index.ts
│   │   ├── _hooks/                    # UI state hooks only — imports from network/ for data
│   │   │   ├── use.scanner.hook.ts
│   │   │   ├── use.barcode.detector.hook.ts
│   │   │   ├── use.verdict.animation.hook.ts
│   │   │   └── index.ts
│   │   ├── _helpers/
│   │   │   ├── format.verdict.helper.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── ground/
│   │   ├── ground.feature.tsx
│   │   ├── _components/
│   │   │   ├── FindCard.tsx
│   │   │   ├── FindList.tsx
│   │   │   ├── SubmitFindSheet.tsx
│   │   │   └── index.ts
│   │   ├── _hooks/
│   │   │   ├── use.ground.hook.ts
│   │   │   ├── use.find.submission.hook.ts
│   │   │   └── index.ts
│   │   ├── _helpers/
│   │   │   └── index.ts
│   │   └── index.ts
│   │
│   ├── cooking.session/
│   ├── recipes/
│   ├── map/
│   ├── pantry/
│   ├── bela/
│   ├── memory/
│   ├── recall/
│   ├── notifications/
│   ├── auth/
│   ├── onboarding/
│   ├── profile/
│   ├── receipt/
│   ├── illness.detective/
│   ├── menu.scanning/
│   ├── ambient.intelligence/
│   ├── recipe.ingestion/
│   ├── wearables/
│   ├── kids.mode/
│   └── viral.sharing/
│
├── stores/                             # Zustand stores — one folder per concern
│   ├── ambient/
│   │   └── use.ambient.store.ts
│   ├── auth/
│   │   └── use.auth.store.ts
│   ├── ui/
│   │   ├── use.app.store.ts
│   │   ├── use.overlay.store.ts
│   │   └── use.privacy.store.ts
│   └── scanner/
│       └── use.scanner.flow.store.ts
│
├── components/                         # Shared design system components
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── index.ts
│   ├── GlassCard/
│   ├── VerdictField/
│   ├── GlowRing/
│   ├── AmbientCanvas/
│   ├── Icon/
│   └── ErrorBoundary/
│
├── design-system/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── motion.ts
│   ├── haptics.ts
│   ├── variants/
│   │   ├── button.variants.ts
│   │   ├── card.variants.ts
│   │   ├── tag.variants.ts
│   │   ├── badge.variants.ts
│   │   └── index.ts
│   └── shaders/
│       ├── ambient.glsl.ts
│       ├── texture.glsl.ts
│       ├── holographic.glsl.ts
│       └── index.ts
│
├── providers/
│   ├── query.provider.tsx
│   ├── auth.provider.tsx
│   └── index.tsx
│
├── lib/                                # Pure utilities — no React
│   ├── cn.ts
│   ├── format.ts
│   └── assert.ts
│
├── assets/fonts/
├── global.css
├── tailwind.config.ts
├── app.json
├── tsconfig.json
└── package.json
```

---

## The Scoping Rules — Enforced

**Rule 1 — Underscore folder = scoped collection.**
`_handlers/` is "all handlers in this scope." It is not a feature. It is not standalone. Consuming code never imports directly from `_handlers/some-file.ts` — always from `_handlers/index.ts`.

**Rule 2 — One file per thing inside an underscore folder.**
`_handlers/create.scan.handler.ts` contains exactly one exported handler function. If there are ten handlers, there are ten files.

**Rule 3 — Every underscore folder has `index.ts`.**
`import { createScan } from './_handlers'` — never from individual files inside.

**Rule 4 — Suffixes and dots are not optional.**
`create.scan.handler.ts` not `create-scan.ts`. `verify.jwt.helper.ts` not `verify-jwt.ts`. Dots separate structural parts. Suffixes declare the file's role.

**Rule 5 — Routes come from shared. Never write a raw URL string.**
Backend: `scanRouter.post(API_ROUTE_PATTERNS.scan.create, controller.onCreateScan)`.
Mobile: `api.post<Scan>(API_ROUTES.scan.create(), body)`.
The `shared/src/routes/index.ts` is the single source of truth.

**Rule 6 — Network hooks live in `network/`, not in features.**
`network/scan/use.create.scan.hook.ts` is the TanStack Query mutation hook. Feature `_hooks/` contains UI state hooks that may call network hooks — they are not network hooks themselves.

---

## What Lives Where — Quick Reference

| Question | Answer |
|---|---|
| Route URL string for scan create | `shared/src/routes/scan.routes.ts` → `SCAN_ROUTES.create()` |
| Hono path pattern for scan create | `shared/src/routes/scan.routes.ts` → `SCAN_ROUTE_PATTERNS.create` |
| Backend Hono router for scan | `backend/src/api/scan/scan.route.ts` |
| Controller wrapper for scan handlers | `backend/src/api/scan/scan.controller.ts` |
| Handler that creates a scan | `backend/src/api/scan/_handlers/create.scan.handler.ts` |
| Helper used by scan handlers | `backend/src/api/scan/_helpers/build.verdict.helper.ts` |
| Orchestrator DO class | `backend/src/agents/orchestrator/orchestrator.agent.ts` |
| Orchestrator SQLite table schemas | `backend/src/agents/orchestrator/_schema/*.schema.ts` |
| AI tool for writing memory | `backend/src/tools/memory/write.user.memory.tool.ts` |
| Supabase Postgres table schema | `backend/src/db/schema/products.schema.ts` |
| Hono middleware | `backend/src/core/middleware/auth.middleware.ts` |
| Shared Zod schemas | `shared/validator/scan/scan.schema.ts` |
| Branded ID types | `shared/validator/user/user.id.type.ts` |
| All API route definitions | `shared/routes/index.ts` → `API_ROUTES` + `API_ROUTE_PATTERNS` |
| Mobile fetch functions for scan | `mobile/network/scan/scan.api.ts` |
| TanStack hook for creating a scan | `mobile/network/scan/use.create.scan.hook.ts` |
| All TanStack query keys | `mobile/network/core/query.keys.ts` |
| Scanner feature root component | `mobile/features/scanner/scanner.feature.tsx` |
| Scanner UI state hooks | `mobile/features/scanner/_hooks/*.hook.ts` |
| Scanner UI components | `mobile/features/scanner/_components/*.tsx` |
| Zustand store for ambient | `mobile/stores/ambient/use.ambient.store.ts` |
| Shared design system component | `mobile/components/Button/Button.tsx` |
| CVA variant definitions | `mobile/design-system/variants/button.variants.ts` |
