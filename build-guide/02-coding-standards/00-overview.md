# Coding Standards — Overview

## What This Folder Covers
Rules and patterns for how every file in this codebase is written. One file one responsibility. Folder scoping. TypeScript rules. State management. Error handling. Tool code organization under `tools/{feature}/`. These rules apply everywhere — no drift allowed.

## Status
[ ] not started

## Specs This Folder Draws From
- `brioela-specs/00-product-philosophy-and-ux.md` — product philosophy that flows into code design
- `brioela-specs/24-technical-architecture-backbone.md` — when to use sub-agent DO vs plain function; Hono routing; Drizzle ORM over raw storage
- `build-guide/00-rules.md` — the rules file this folder implements in code

## Key Decisions From Specs
- Tools live under `tools/{feature}/` — exported from `tools/index.ts` as single import path
- One DO per user — never pooled; always `idFromName(userId)`
- Sub-agent DO: long-running, stateful, survives disconnection, holds WebSockets
- Plain function: fast, stateless, completes in one request lifecycle  
- Drizzle ORM over raw `this.ctx.storage` for all schema work
- No `any`, no `as unknown as` — ever. Zod at every boundary.
- `wrangler.toml` must declare `new_sqlite_classes` for every DO that needs SQLite

## What This Folder Depends On
Nothing. Written before any feature work starts.

## What Depends On This Folder
Every feature folder follows these rules.
