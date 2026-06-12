# Production snapshot: constraint.schema.ts (07 boundary — menu consumer)

Target: `backend/src/agents/brain/_schemas/constraint.schema.ts`

**Status:** Shipped schema (**07-brain-constraint-tools**). Menu dish evaluation will read `constraints` via new `checkDishConstraints` in Brain DO — **26** orchestrates RPC only.

---

## Menu integration

`checkDishConstraints(dish, db)` matches dish `name`, `description`, `listedIngredients`, and `cookingMethod` text against active confirmed constraints. Same `ConstraintMatch` shape as product scan — different input surface.

| Menu verdict field | Source |
|---|---|
| `matchedConstraints[]` | **07** constraint types |
| Dish `verdict: red` | Hard allergy / dietary identity visible in dish text |
| Dish `verdict: yellow` | Missing detail, shared prep, soft conflict |
| Condition flags | **23** — separate from constraint matches |

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

**Dish vs product:** Product scan matches `product.ingredients[]`. Menu scan matches parsed dish text fields — implement `tools/menu-scan/check-dish-constraint.ts` separately from `tools/product-scan/check-constraint.ts`.
