# 008 — Verify `inputSchema: asSchema(...)` Is Current Vercel AI SDK Pattern

## Complaint
```typescript
inputSchema: asSchema(logMemoryEventSchema),
```
Is `inputSchema` with `asSchema()` the current Vercel AI SDK pattern, or is this a legacy API? This was not verified against the current docs. If it's stale, it needs to be replaced with the correct modern pattern.

## What Needs to Happen
- Check the current Vercel AI SDK (`ai` package) docs for the correct way to define tool input schemas.
- The previous session found that the current pattern uses `tool()` with a `parameters` or `inputSchema` property — but which one, and whether `asSchema()` is still needed, must be confirmed by reading the actual current docs.
- If `asSchema()` is legacy: replace with the current API across all tool definitions.
- If `inputSchema` itself is the wrong property name: fix it.

## Files to Check
- `backend/src/agents/brain/_tools/log.memory.event.tool.ts`
- `backend/src/agents/brain/_tools/write.user.memory.tool.ts`
- `backend/src/agents/brain/_tools/read.user.memory.tool.ts`

## Why
Using a stale API means the tools either silently don't work or work despite using deprecated internals that can break on any SDK update.

## Status
**FIXED.** Verified against current AI SDK v6 docs (ai-sdk.dev/docs/reference/ai-sdk-core/tool): `inputSchema` is the correct property, and Zod schemas pass directly — no `asSchema()` wrapper needed. `asSchema` import removed from all three tool files (`log.memory.event.tool.ts`, `write.user.memory.tool.ts`, `read.user.memory.tool.ts`). Schemas passed directly. 7/7 tests pass, guards clean.
