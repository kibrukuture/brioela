# 004 — `namespace` Column Must Be Strictly Typed at Zod and DB Level

## Complaint
`namespace: text('namespace').notNull()` accepts any string. A namespace is NOT any string — it has a specific format (e.g., `health.diet`, `cooking.pref`). Accepting generic strings at the column level is a design hole.

## What Needs to Happen

### Zod level (code boundary)
- Define a `namespaceSchema` in a shared or domain schema file using Zod with a strict regex pattern.
- Pattern should enforce the allowed format (e.g., lowercase words separated by dots: `^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)*$`).
- Zod has `.regex()` which restricts what string patterns are accepted.
- All input schemas that accept a namespace field must use `namespaceSchema` — not `z.string()`.

### SQLite level (DB boundary)
- Add a `CHECK` constraint on the `namespace` column in the Drizzle schema definition.
- Drizzle supports `.$check()` or raw SQL CHECK constraints on columns.
- This kills invalid namespaces even if they somehow bypass Zod (e.g., a direct DB write).

### Guard level
- Consider a guard rule that bans `z.string()` in input schemas for fields named `namespace`, `kind`, `source` — known domain-constrained fields.

## Why
"Any string" types create runtime garbage. A namespace like `Hello World!!` or an empty string should be structurally impossible, not just "hope nobody passes it."

## Status
Open — not yet fixed.
