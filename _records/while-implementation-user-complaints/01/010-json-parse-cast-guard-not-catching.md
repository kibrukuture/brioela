# 010 — `JSON.parse(x) as JsonValue` Is Illegal But Guard Is Not Catching It

## Complaint
```typescript
value: JSON.parse(entry.value) as JsonValue,
```
This is a type assertion (`as JsonValue`) on an unvalidated `JSON.parse` result. Two violations in one line:
1. `JSON.parse()` returns `any` — must be validated through a Zod schema, not cast.
2. `as JsonValue` is a type assertion — banned by `ban-type-assertion` rule.

The guard is NOT catching either of these. This means the guard is either not running or the rule is broken.

## What Needs to Happen
- Audit `ban.type.assertion.policy.ts` — does it catch `as X` assertions? If not, fix it.
- Audit `ban.json.parse.cast.policy.ts` — does it catch `JSON.parse(x) as T`? If not, fix it.
- Verify both policies run on brain agent files.
- Fix the violations themselves: replace `JSON.parse(x) as JsonValue` with `jsonValueSchema.parse(JSON.parse(x))` — parse through the Zod schema instead of asserting.

## Files Confirmed Containing the Violation
- `backend/src/agents/brain/_tools/_executables/read.user.memory.executable.ts` (multiple occurrences)
- `backend/src/agents/brain/_tools/_executables/write.user.memory.executable.ts`

## Why
`as X` is a lie to the type system — TypeScript believes you but `JSON.parse` still returns `any` at runtime. A Zod parse actually validates the shape. Using `jsonValueSchema.parse()` turns the unsafe cast into a real check.

## Status
Open — guard bug not confirmed, violations not yet fixed.
