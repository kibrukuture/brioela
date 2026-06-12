# Draft: discovery.card.offer.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/discovery.card.offer.schema.ts`

**Gap (feature 51):** Audit offer → preview → share per moment.

**Source:** `build-guide/24-viral-sharing/06-growth-metrics-and-suppression.md`

---

```typescript
import { check, integer, sqliteTable, text } from '@/database/sqlite/_schema'

export const discoveryCardOfferStatusValues = [
	'offered',
	'previewed',
	'shared',
	'dismissed',
	'blocked',
] as const

export const discoveryCardOffers = sqliteTable(
	'discovery_card_offer',
	{
		offerId: text('offer_id').primaryKey(),
		userId: text('user_id').notNull(),
		momentId: text('moment_id').notNull(),
		cardType: text('card_type').notNull(),
		status: text('status').notNull(),
		consentLevel: text('consent_level'),
		scrubSensitivity: text('scrub_sensitivity'),
		artifactRef: text('artifact_ref'),
		attributionTag: text('attribution_tag'),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'discovery_card_offer_status_check',
			`${table.status.name} IN ('offered','previewed','shared','dismissed','blocked')`,
		),
	],
)

export type BrainDiscoveryCardOffer = typeof discoveryCardOffers.$inferSelect
export type InsertBrainDiscoveryCardOffer = typeof discoveryCardOffers.$inferInsert
```
