# Draft: pantry.snapshot.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/pantry.snapshot.schema.ts`

**Gap (feature 34):** Episodic fridge/pantry camera captures. Operates on snapshots, not continuous inventory (spec 14).

**Source:** `brioela-specs/14-fridge-and-pantry-ingredient-rescue.md`, `build-guide/14-pantry-meal-plan/01-pantry-snapshot.md`

---

```typescript
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const pantrySnapshotSourceValues = [
  'camera',
  'voice',
  'import',
] as const
export type PantrySnapshotSource = (typeof pantrySnapshotSourceValues)[number]

export const pantrySnapshots = sqliteTable('pantry_snapshot', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  sourceType: text('source_type').notNull().$type<PantrySnapshotSource>(),
  imageObjectKey: text('image_object_key'),
  createdAt: integer('created_at').notNull(),
})

export type PantrySnapshotRow = typeof pantrySnapshots.$inferSelect
export type InsertPantrySnapshotRow = typeof pantrySnapshots.$inferInsert
```

Indexes: `(user_id, created_at DESC)`.
