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

## Status
Open — full audit not yet done.
