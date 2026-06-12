# Draft: kin.cluster.schema.ts (gap — file does not exist)

Target: `shared/drizzle/schema/kin.cluster.schema.ts`

**Gap (feature 50):** Global cluster centroids — shared Supabase Postgres.

**Boundary:** Separate from `anonymous_health_groups` (**22**). Do not merge schemas.

---

```typescript
import { integer, pgSchema, text, timestamp } from 'drizzle-orm/pg-core'

const brioela = pgSchema('brioela')

export const kinCluster = brioela.table('kin_cluster', {
	clusterId: text('cluster_id').primaryKey(),
	centroidJson: text('centroid_json').notNull(),
	memberCount: integer('member_count').notNull(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export type KinClusterRow = typeof kinCluster.$inferSelect
export type NewKinClusterRow = typeof kinCluster.$inferInsert
```

DB migration must add `CHECK (member_count >= 0)` and seed 8–16 initial centroids via `seed.kin.cluster.centroids.job`.
