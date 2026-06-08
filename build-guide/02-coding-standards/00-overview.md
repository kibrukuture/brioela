# Coding Standards — Overview

## What This Folder Covers
The complete rulebook for how every file in the Brioela codebase is written. Monorepo structure, TypeScript strictness, naming conventions, import patterns, backend patterns (Hono, DO, tools), data layer (Drizzle), shared package (Zod schemas, branded types), mobile patterns, error handling, package decisions, and testing standards. These rules apply everywhere — no exceptions, no drift.

## Status
[x] complete — all twelve standard files written

## Specs This Folder Draws From
- `brioela-specs/00-product-philosophy-and-ux.md` — product philosophy that flows into code design
- `brioela-specs/24-technical-architecture-backbone.md` — Hono routing, DO patterns, Drizzle over raw storage, one DO per user
- `build-guide/00-rules.md` — build-guide rules implemented as code standards here

## Files In This Folder

| File | Contents |
|---|---|
| `01-monorepo-and-folder-structure.md` | Complete folder tree for backend/shared/mobile, one-file-one-responsibility rule, quick-reference table for where everything lives |
| `02-typescript-strictness.md` | Root tsconfig, no-any, no-cast, branded types, inference over declaration, exhaustive switches, no enum, satisfies |
| `03-naming-conventions.md` | File names, component files, functions (verb-first), types (PascalCase nouns), constants, Zod schema names, DB column names, boolean naming, abbreviation rules |
| `04-imports-and-barrel-exports.md` | Path aliases per workspace, barrel export pattern, import order, type-only imports, circular dependency prevention |
| `05-backend-hono-patterns.md` | App root pattern, route files as Hono instances, Hono context type extension, Zod validation at entry, middleware pattern, DO access pattern, response envelope format |
| `06-backend-do-agent-patterns.md` | DO class structure, SQLite schema per DO, alarm dispatch pattern, WebSocket hibernation, DO storage rules, tool function pattern |
| `07-data-layer-drizzle.md` | Two Drizzle instances (Supabase + DO SQLite), schema by domain, shared column helpers, query patterns, transaction pattern, migration strategy |
| `08-shared-package-zod.md` | Schema file structure, branded IDs via Zod transform, request vs response schemas, using schemas on backend and mobile, root barrel export |
| `09-mobile-patterns.md` | Thin screen files, feature root components, hooks own logic, TanStack Query, component file pattern, state management, Zustand pattern, accessibility |
| `10-error-handling.md` | AppError class, Hono error middleware, Result<T,E> for internal functions, mobile error handling, React error boundaries |
| `11-packages.md` | Definitive package list per workspace, explicitly banned packages with alternatives |
| `12-testing-standards.md` | bun test, what to test vs what to skip, collocated test files, patterns for schemas / tools / routes |
| `13-file-name-enforcement.md` | Brioela-scoped file/folder naming guard, watch mode, fail-fast checks, banned names, allowed suffixes and underscore folders |

## The Three Rules That Govern Everything

**1. One file. One responsibility.**
Every file has exactly one job. The file name makes that job obvious without opening it.

**2. Types flow from shared outward.**
All shared types live in `@brioela/shared`. Backend and mobile import from there — never duplicate a schema or type.

**3. Validate at the boundary, trust inside.**
Every external input is Zod-parsed at the entry point. After parsing, the value is trusted throughout — no re-validation inside business logic.

## What This Folder Depends On
`01-design-system` — the design system is a coding standard for the UI layer.

## What Depends On This Folder
Every feature folder. These standards govern every file written during feature implementation.
