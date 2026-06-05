# Monorepo and Folder Structure

## The Scoping Pattern — Applies Everywhere

Every folder in this codebase uses the same pattern:

1. **File suffixes** tell you the file's role at a glance — without opening it:
   - `.route.ts` — Hono route definition
   - `.handler.ts` — one handler function for one endpoint
   - `.helper.ts` — pure utility function
   - `.schema.ts` — Drizzle table definitions
   - `.tool.ts` — AI-callable tool function
   - `.agent.ts` — Durable Object class
   - `.middleware.ts` — Hono middleware
   - `.type.ts` — local TypeScript type declarations
   - `.store.ts` — Zustand store (mobile)
   - `.hook.ts` — custom React hook (mobile)

2. **Dots separate all structural parts of a file name.** The pattern is `{action}.{feature}.{role}.ts`. Hyphens are not used anywhere. A handler that creates a scan is `create.scan.handler.ts`. A helper that builds a verdict response is `build.verdict.response.helper.ts`. A hook for the scanner is `use.scanner.hook.ts`.

3. **Handler names use action verbs — never HTTP method names.** `create`, `update`, `get`, `list`, `delete`, `check`, `submit`, `resolve`, `refresh`, `archive`, `vote`, `confirm`, `dispute` — not `post`, `put`, `patch`.

4. **Underscore-prefixed folders** scope files of the same type within a parent feature:
   - `_handlers/` — all handler files for this scope + `index.ts`
   - `_helpers/` — all helper files for this scope + `index.ts`
   - `_schema/` — all Drizzle schema files for this scope + `index.ts`
   - `_types/` — local type files for this scope + `index.ts`
   - `_hooks/` — hook files for this scope (mobile) + `index.ts`
   - `_components/` — components for this scope (mobile) + `index.ts`

5. **Every underscore folder has `index.ts`** that re-exports everything in it. Consumers import from the folder, never from individual files inside it.

6. **This pattern is not optional and not just for routes.** It applies to agents, tools, lib, features, components — everywhere.

---

## Top-Level Layout

```
brioela/
├── backend/                      # @brioela/backend — Cloudflare Workers + DOs
├── shared/                       # @brioela/shared  — types, schemas, constants
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

```
backend/
├── src/
│   ├── index.ts                        # Hono app root — mounts routes, exports DO classes
│   │
│   ├── routes/                         # Feature route folders — one folder per feature
│   │   ├── scan/
│   │   │   ├── scan.route.ts           # Hono instance, imports from _handlers
│   │   │   ├── _handlers/
│   │   │   │   ├── create.scan.handler.ts
│   │   │   │   ├── get.scan.handler.ts
│   │   │   │   ├── list.scan.handler.ts
│   │   │   │   └── index.ts            # exports all handlers
│   │   │   ├── _helpers/
│   │   │   │   ├── build.verdict.response.helper.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts                # exports scan.route.ts as default
│   │   │
│   │   ├── recipes/
│   │   │   ├── recipes.route.ts
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
│   │   │   ├── _handlers/
│   │   │   │   ├── get.places.handler.ts
│   │   │   │   ├── get.signals.handler.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── bela/
│   │   │   ├── order.route.ts
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
│   │   │   ├── _handlers/
│   │   │   │   ├── check.recall.handler.ts
│   │   │   │   ├── list.alert.handler.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.route.ts
│   │   │   ├── _handlers/
│   │   │   │   ├── create.session.handler.ts
│   │   │   │   ├── refresh.session.handler.ts
│   │   │   │   └── index.ts
│   │   │   ├── _helpers/
│   │   │   │   ├── verify.jwt.helper.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts                    # mounts all route folders onto root app
│   │
│   ├── agents/                         # Durable Object classes
│   │   ├── orchestrator/
│   │   │   ├── orchestrator.agent.ts   # DO class — fetch(), alarm(), WebSocket lifecycle
│   │   │   ├── _schema/
│   │   │   │   ├── memory.schema.ts
│   │   │   │   ├── constraints.schema.ts
│   │   │   │   ├── recipes.schema.ts
│   │   │   │   ├── sessions.schema.ts
│   │   │   │   ├── skills.schema.ts
│   │   │   │   └── index.ts
│   │   │   ├── _handlers/              # fetch() routing — one handler per endpoint
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
│   │   └── index.ts                    # single export point — all tools
│   │
│   ├── db/                             # Supabase Postgres — Drizzle
│   │   ├── schema/
│   │   │   ├── _shared.schema.ts       # shared columns (timestamps, soft-delete)
│   │   │   ├── products.schema.ts
│   │   │   ├── community.schema.ts
│   │   │   ├── map.schema.ts
│   │   │   ├── businesses.schema.ts
│   │   │   ├── bela.schema.ts
│   │   │   ├── recall.schema.ts
│   │   │   └── index.ts
│   │   ├── migrations/
│   │   ├── db.client.ts                # Drizzle + Supabase connection
│   │   └── drizzle.config.ts
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rate.limit.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── index.ts
│   │
│   ├── lib/                            # Feature business logic — not tools, not routes
│   │   ├── scan/
│   │   │   ├── resolve.product.lib.ts
│   │   │   ├── _helpers/
│   │   │   │   ├── parse.openfoodfacts.helper.ts
│   │   │   │   ├── parse.govdb.helper.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── recipes/
│   │   │   ├── ingest.url.lib.ts
│   │   │   ├── _helpers/
│   │   │   │   ├── extract.transcript.helper.ts
│   │   │   │   ├── normalize.recipe.helper.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── ground/
│   │   │   ├── ai.gate.lib.ts
│   │   │   ├── _helpers/
│   │   │   │   ├── geohash.helper.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   └── bela/
│   │       ├── escrow.lib.ts
│   │       ├── routing.lib.ts
│   │       ├── _helpers/
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   └── types.ts                        # Env, Bindings, Hono context variables
│
├── wrangler.toml
├── tsconfig.json
└── package.json
```

---

## Shared — `shared/`

```
shared/
├── src/
│   ├── schemas/
│   │   ├── scan.schema.ts
│   │   ├── recipe.schema.ts
│   │   ├── user.schema.ts
│   │   ├── constraint.schema.ts
│   │   ├── ground.schema.ts
│   │   ├── bela.schema.ts
│   │   ├── recall.schema.ts
│   │   └── index.ts
│   │
│   ├── types/
│   │   ├── branded.type.ts
│   │   ├── result.type.ts
│   │   ├── error.type.ts
│   │   └── index.ts
│   │
│   ├── constants/
│   │   ├── verdict.constant.ts
│   │   ├── tiers.constant.ts
│   │   └── index.ts
│   │
│   └── index.ts
│
└── package.json
```

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
├── src/
│   ├── features/                       # One folder per product feature
│   │   ├── scanner/
│   │   │   ├── scanner.feature.tsx     # root component rendered by the screen
│   │   │   ├── _components/
│   │   │   │   ├── VerdictCard.tsx
│   │   │   │   ├── ScanOverlay.tsx
│   │   │   │   └── index.ts
│   │   │   ├── _hooks/
│   │   │   │   ├── use.scanner.hook.ts
│   │   │   │   ├── use.barcode.detector.hook.ts
│   │   │   │   ├── use.verdict.animation.hook.ts
│   │   │   │   └── index.ts
│   │   │   ├── _helpers/
│   │   │   │   ├── format.verdict.helper.ts
│   │   │   │   └── index.ts
│   │   │   ├── _api/
│   │   │   │   ├── scan.api.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts                # barrel: only what other features may need
│   │   │
│   │   ├── ground/
│   │   │   ├── ground.feature.tsx
│   │   │   ├── _components/
│   │   │   │   ├── FindCard.tsx
│   │   │   │   ├── FindList.tsx
│   │   │   │   ├── SubmitFindSheet.tsx
│   │   │   │   └── index.ts
│   │   │   ├── _hooks/
│   │   │   │   ├── use.ground.hook.ts
│   │   │   │   ├── use.find.submission.hook.ts
│   │   │   │   └── index.ts
│   │   │   ├── _helpers/
│   │   │   │   └── index.ts
│   │   │   ├── _api/
│   │   │   │   ├── ground.api.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── cooking-session/
│   │   ├── recipes/
│   │   ├── map/
│   │   ├── pantry/
│   │   ├── bela/
│   │   ├── memory/
│   │   ├── recall/
│   │   ├── notifications/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── profile/
│   │   ├── receipt/
│   │   ├── illness-detective/
│   │   ├── menu-scanning/
│   │   ├── ambient-intelligence/
│   │   ├── recipe-ingestion/
│   │   ├── wearables/
│   │   ├── kids-mode/
│   │   └── viral-sharing/
│   │
│   ├── design-system/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── motion.ts
│   │   ├── haptics.ts
│   │   ├── variants/
│   │   │   ├── button.variants.ts
│   │   │   ├── card.variants.ts
│   │   │   ├── tag.variants.ts
│   │   │   ├── badge.variants.ts
│   │   │   └── index.ts
│   │   └── shaders/
│   │       ├── ambient.glsl.ts
│   │       ├── texture.glsl.ts
│   │       ├── holographic.glsl.ts
│   │       └── index.ts
│   │
│   ├── components/                     # Shared design system components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   └── index.ts
│   │   ├── Card/
│   │   ├── GlassCard/
│   │   ├── Icon/
│   │   ├── VerdictField/
│   │   ├── GlowRing/
│   │   ├── AmbientCanvas/
│   │   └── ErrorBoundary/
│   │
│   ├── generative-ui/
│   │   ├── registry.ts
│   │   ├── schemas.ts
│   │   ├── types.ts
│   │   └── GenerativeSlot.tsx
│   │
│   ├── api/                            # HTTP client layer — feature API files
│   │   ├── client.ts
│   │   └── index.ts
│   │
│   ├── providers/
│   │   ├── QueryProvider.tsx
│   │   ├── AuthProvider.tsx
│   │   ├── AmbientProvider.tsx
│   │   └── index.tsx
│   │
│   └── lib/                            # Pure utilities — no React
│       ├── cn.ts
│       ├── format.ts
│       └── assert.ts
│
├── assets/fonts/
├── global.css
├── tailwind.config.ts
├── app.config.ts
├── tsconfig.json
└── package.json
```

---

## The Scoping Rules — Enforced

**Rule 1 — Underscore folder = scoped collection.**
`_handlers/` is "all handlers in this scope." It is not a feature. It is not standalone. It exists only inside a parent feature folder. Consuming code never imports directly from `_handlers/some-file.ts` — always from `_handlers/index.ts` or the parent's `index.ts`.

**Rule 2 — One file per thing inside an underscore folder.**
`_handlers/create.scan.handler.ts` contains exactly one exported handler function. `_helpers/build.verdict.response.helper.ts` contains exactly one exported helper. If there are ten handlers, there are ten handler files. The folder is the grouping — not the file.

**Rule 3 — Every underscore folder has `index.ts`.**
The `index.ts` re-exports everything in the folder. Consumers import from the folder — `import { createScan } from './_handlers'` — never from individual files inside.

**Rule 4 — Suffixes and dots are not optional.**
`create.scan.handler.ts` not `create-scan.ts`. `verify.jwt.helper.ts` not `verify-jwt.ts`. `auth.middleware.ts` not `auth.ts`. The suffix communicates the file's role. The dots separate structural parts of the name.

---

## What Lives Where — Quick Reference

| Question | Answer |
|---|---|
| Route definition for scan feature | `backend/src/routes/scan/scan.route.ts` |
| Handler for POST /scan | `backend/src/routes/scan/_handlers/create.scan.handler.ts` |
| Helper used by scan handlers | `backend/src/routes/scan/_helpers/build.verdict.response.helper.ts` |
| Orchestrator DO class | `backend/src/agents/orchestrator/orchestrator.agent.ts` |
| Orchestrator SQLite table schemas | `backend/src/agents/orchestrator/_schema/*.schema.ts` |
| Orchestrator fetch() handlers | `backend/src/agents/orchestrator/_handlers/*.handler.ts` |
| AI tool for writing memory | `backend/src/tools/memory/write.user.memory.tool.ts` |
| Supabase Postgres table schema | `backend/src/db/schema/products.schema.ts` |
| Hono middleware | `backend/src/middleware/auth.middleware.ts` |
| Shared Zod schemas | `shared/src/schemas/scan.schema.ts` |
| Branded ID types | `shared/src/types/branded.type.ts` |
| Scanner feature root component | `mobile/src/features/scanner/scanner.feature.tsx` |
| Scanner-specific hooks | `mobile/src/features/scanner/_hooks/*.hook.ts` |
| Scanner-specific components | `mobile/src/features/scanner/_components/*.tsx` |
| Shared design system component | `mobile/src/components/Button/Button.tsx` |
| CVA variant definitions | `mobile/src/design-system/variants/button.variants.ts` |
