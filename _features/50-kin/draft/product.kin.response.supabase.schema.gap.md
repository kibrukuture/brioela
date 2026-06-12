# Draft: kin.product.response.schema.ts (gap — file does not exist)

Target: `shared/drizzle/schema/kin.product.response.schema.ts`

**Gap (feature 50):** Per-product per-cluster anonymous aggregates.

---

```typescript
import { integer, pgSchema, primaryKey, real, text, timestamp } from 'drizzle-orm/pg-core'

const brioela = pgSchema('brioela')

export const productKinResponse = brioela.table(
	'product_kin_response',
	{
		productId: text('product_id').notNull(),
		clusterId: text('cluster_id').notNull(),
		sampleCount: integer('sample_count').notNull(),
		spikeRate: real('spike_rate'),
		medianPeakDelta: real('median_peak_delta'),
		medianAuc: real('median_auc'),
		updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		primaryKey({ columns: [table.productId, table.clusterId] }),
	],
)

export type ProductKinResponseRow = typeof productKinResponse.$inferSelect
export type NewProductKinResponseRow = typeof productKinResponse.$inferInsert
```

Read path must call `passesKinServingGates(sampleCount, clusterMemberCount)` — rows below floor exist but never serve.
