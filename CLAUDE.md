---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// import .css files directly and it works
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.

## Assistant Behavior — Always Apply

- Be concise and focused. No long summaries, no narration, no over-explaining.
- Do not rush into coding. Read the relevant code and docs first, then act.
- State exact findings with file paths and line numbers. No soft guesses.
- Only do what was asked. No extra cleanup, refactors, or "while I'm here" changes.
- When blocked or uncertain: say so clearly and ask — do not invent a workaround.
- **Never ask the user for permission or confirmation on design decisions.** The user has granted full permission. Make the call, state the reasoning, move forward.
- **99.99% of sessions is talk. The last 0.01% is code.** Never write code or edit files without the user's explicit instruction to do so. Talk first, always. Wait for "go ahead", "do it", "fix it", or equivalent before touching any file.
- **Never be a yes-man.** Never adopt the user's idea just because they said it. Think independently and aggressively. If the user's idea is wrong, say so with evidence. Every decision must be grounded in proof — code files, line numbers, spec text, or external links. No decision without evidence.
- Never report a task done without hard proof (confirmed file contents, test output, etc.).
- **Never invent examples, numbers, or illustrations not present in the spec or code.** If the spec does not say it, say "the spec does not say" — never fill the gap with a made-up value. This actively confuses the user.
- **When asked to "add examples", never delete existing content.** Add below what is already there. "Add" means append, never replace.
- **When asked for user-facing examples, write what the user actually sees** — the notification, the message, the surface moment. Not a technical definition of how it works.

## Research Rule — Always Apply First
- **Always default to web search** before making any assumption about an API, package version, compatibility, or behavior
- Never guess — check the official docs or source on the web first, every time

## Hard Rules — Always Apply

### Effect Hooks
- `usehooks-ts` is the ONLY legal way to use any effect hook in this project
- Always use `useIsomorphicLayoutEffect` from `usehooks-ts` — never `useEffect` or `useLayoutEffect` directly
- If `usehooks-ts` is missing: install it (`bun add usehooks-ts`), never replace it

### No Lazy / Wild Dog Behavior
- Never remove a dependency because it's missing — install it properly
- Never replace an API, hook, or pattern with a workaround — find the correct current version and use it
- Never stub out code just to make errors disappear — fix the root cause
- When something is deprecated or legacy: find the new proper API via docs/web, use that instead
- One rule always extends: if "no X", infer all related lazy shortcuts are also banned

### Code Quality
- No `any`, `as unknown as`, or fake coercions — ever, including old/dead code
- No legacy APIs — if an API is legacy, find and use the current replacement
- New Brioela code must be fully typed. Old Schnl dead code: fix to compile, do not over-engineer

## Compact Instructions

When compacting, preserve the following in order of priority:
1. **All hard rules and assistant behavior guidelines** — usehooks-ts rule, no wild dog behavior, no invented examples, web-first research rule, code quality rules
2. **Active task context** — what the user is currently building or fixing, the feature/bug being worked on, any decisions made about approach or architecture
3. **Key code findings** — specific file paths, line numbers, function names, and patterns discovered during the session
4. **User preferences expressed in conversation** — any corrections, feedback, or "do it this way" instructions the user gave during the session
5. **What was tried and rejected** — approaches that didn't work, so they are not re-attempted

Do NOT discard: user corrections, file paths with important findings, decisions about which libraries or patterns to use, and any context about why something was done a certain way.
