# 005 — Audit All Domain String Fields for Strict Zod Pattern Enforcement

## Complaint
Many string fields across input schemas accept any string (`z.string()`). Domain strings like `kind`, `source`, `entityKind`, `entityId`, `namespace`, `key`, `sessionId` etc. all have implicit structural rules that are never enforced at the type boundary. The result: garbage strings accepted at runtime.

## What Needs to Happen
- Audit every `z.string()` in every input schema (`_schemas/`, `_tools/_schemas/`, `_rpc/`).
- For each field, determine: is this "any string" or does it have a pattern?
  - `namespace` — dot-separated lowercase words (e.g., `health.diet`) → regex
  - `kind` — snake_case identifier (e.g., `food_intake`) → regex
  - `source` — enum-like (`observed`, `stated`, `inferred`) → `z.enum()`
  - `entityKind` — snake_case → regex
  - `entityId` — alphanumeric + underscores/hyphens → regex
  - `key` — snake_case → regex
- Fields with a fixed set of values → `z.enum()`
- Fields with a structural pattern → `z.string().regex(pattern)`
- Fields that truly are arbitrary text → keep `z.string()` but document why

## Example
```typescript
// Bad: accepts "Hello World!!"
kind: z.string().trim().min(1)

// Good: enforces snake_case identifier
kind: z.string().regex(/^[a-z][a-z0-9]*(_[a-z][a-z0-9]*)*$/)
```

## Why
Zod's `.regex()` turns string inputs into domain-typed inputs. A bad `kind` value is caught at the Zod boundary — not at query time, not at render time, not in a bug report.

## Audit Findings

### `memory_event` — `kind`, `source`, `entity_kind`
Intentionally free text. `implementable-specs/01-memory-event.md` explicitly decided: no enum, no regex. AI via `log_memory_event` can write any kind or entity_kind it judges correct. System code uses constants internally. No change needed.

### `user_memory.source`
Spec (`implementable-specs/02-user-memory.md`) originally said `image | conversation | inferred | cron`. Code correctly uses `observed | stated | inferred` — an epistemological taxonomy that drives merge logic (line 36 of `write.user.memory.executable.ts`: `stated` bypasses confidence check). Spec updated to match code. No DB CHECK needed — spec says Zod-enforced only.

### `alarm_type`, `recipes.source`
No values exist in code yet, spec doesn't enumerate them. No action until implemented.

### Fields confirmed already correct
- `user_memory.namespace` / `key` — fixed in 004
- `user_memory.source` — `z.enum(['observed', 'stated', 'inferred'])` at tool boundary ✓
- `sessions.session_type`, `status` — Drizzle enum + DB CHECK ✓
- `scheduled_alarms.status` — Drizzle enum + DB CHECK ✓
- `constraints.*` — all constrained ✓

## Status
**FIXED.** Audit complete. `user_memory.source` enum values corrected in spec to match code. No code changes required — the code was already right; the spec was stale.
