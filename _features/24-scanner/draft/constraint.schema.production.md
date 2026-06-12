# Production snapshot: constraint.schema.ts (07 boundary — scan consumer)

Target: `backend/src/agents/brain/_schemas/constraint.schema.ts`

**Status:** Shipped schema (**07-brain-constraint-tools**). Constraint **matching** runs in Brain DO at scan time — **24** orchestrates RPC only.

---

## Scan integration

`checkProductConstraints(product, db)` reads `constraints` where `status IN ('confirmed', 'auto_confirmed')`. Proposed rows may surface warnings per **07** spec — full block after confirmation.

| Scan verdict field | Source |
|---|---|
| `verdict.constraint.matches` | **07** constraint types |
| `verdict.constraint.level` | Highest severity among matches + med/community |
| `verdict.conditionFlags` | **23** — separate array, not in this table |

## Shipped table (excerpt)

```typescript
const constraintKind = ['hard_allergy', 'intolerance', 'dislike', 'dietary_identity', 'boycott'] as const

export const constraints = sqliteTable('constraints', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  constraintType: text('constraint_type', { enum: constraintKind }).notNull(),
  entityKind: text('entity_kind', { enum: entityKind }).notNull(),
  entityValue: text('entity_value').notNull(),
  status: text('status', { enum: constraintStatus }).notNull().default('proposed'),
  // ... confidence, evidence, surfaced_count, timestamps
})
```

**Boycott at scan:** matches `product.brand` or `product.origin.parentCompany` from resolution join.
