# Draft: discovery.card.attribution.schema.ts (gap — file does not exist)

Target: `shared/drizzle/schema/discovery.card.attribution.schema.ts`

**Gap (feature 51):** Tagged install attribution (Harvest distinct tag per `36-harvest/04-share-cards.md`).

---

```typescript
import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const discoveryCardAttribution = pgTable('discovery_card_attribution', {
	tag: text('tag').primaryKey(),
	cardType: text('card_type').notNull(),
	campaign: text('campaign').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	openCount: integer('open_count').notNull().default(0),
	installCount: integer('install_count').notNull().default(0),
})
```
