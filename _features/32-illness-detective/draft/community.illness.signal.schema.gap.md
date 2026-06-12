# Draft: community.illness.schema.ts (gap — file does not exist)

Target: `shared/drizzle/schema/community.illness.schema.ts`

**Gap (feature 32):** Shared anonymized Supabase table. **No `user_id`.** Same privacy class as spec 30 / `brioela-specs/47-kin.md` aggregate pattern.

---

```typescript
import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'

export const communityIllnessSignals = pgTable(
	'community_illness_signal',
	{
		id: text('id').primaryKey(),
		productId: text('product_id'),
		restaurantId: text('restaurant_id'),
		signalCount: integer('signal_count').notNull().default(1),
		windowStart: timestamp('window_start', { withTimezone: true }).notNull(),
		windowEnd: timestamp('window_end', { withTimezone: true }).notNull(),
		elevated: boolean('elevated').notNull().default(false),
		createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex('community_illness_product_window_idx').on(
			table.productId,
			table.windowStart,
		),
		uniqueIndex('community_illness_restaurant_window_idx').on(
			table.restaurantId,
			table.windowStart,
		),
	],
)

export type CommunityIllnessSignalRow = typeof communityIllnessSignals.$inferSelect
export type InsertCommunityIllnessSignalRow = typeof communityIllnessSignals.$inferInsert
```

**Write rule:** Round timestamps to 24h buckets before insert. Never attach `user_id` or session identifiers.
