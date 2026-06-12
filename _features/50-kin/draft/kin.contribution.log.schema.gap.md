# Draft: kin.contribution.log.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/kin.contribution.log.schema.ts`

**Gap (feature 50):** User-visible log of what they shared — deletable per spec **47**.

---

```typescript
import { index, integer, sqliteTable, text } from '@/database/sqlite/_schema'

export const kinContributionLogStatusValues = ['active', 'withdrawn'] as const
export type KinContributionLogStatus = (typeof kinContributionLogStatusValues)[number]

export const kinContributionLog = sqliteTable(
	'kin_contribution_log',
	{
		contributionId: text('contribution_id').primaryKey(),
		userId: text('user_id').notNull(),
		productId: text('product_id').notNull(),
		windowId: text('window_id').notNull(),
		clusterId: text('cluster_id').notNull(),
		status: text('status').notNull().$type<KinContributionLogStatus>(),
		contributedAt: integer('contributed_at', { mode: 'number' }).notNull(),
		withdrawnAt: integer('withdrawn_at', { mode: 'number' }),
		createdAt: integer('created_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		index('idx_kin_contribution_log_user_contributed').on(table.userId, table.contributedAt),
		index('idx_kin_contribution_log_window').on(table.windowId),
	],
)

export type BrainKinContributionLog = typeof kinContributionLog.$inferSelect
export type InsertBrainKinContributionLog = typeof kinContributionLog.$inferInsert
```
