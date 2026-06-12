# Draft: skill.trajectory.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/skill.trajectory.schema.ts`

**Gap:** No `skill_trajectory` table.

**Source:** `brioela-specs/53-growth-mirror.md` § Data Model, `build-guide/40-growth-mirror/02-trajectory-model.md`

---

```typescript
import { check, index, integer, real, sql, sqliteTable, text } from '@/database/sqlite/_schema'

export const skillTrajectoryDirectionValues = [
	'improving',
	'steady',
	'insufficient_evidence',
] as const
export type SkillTrajectoryDirection = (typeof skillTrajectoryDirectionValues)[number]

export const skillTrajectory = sqliteTable(
	'skill_trajectory',
	{
		userId: text('user_id').notNull(),
		dimension: text('dimension').notNull(),
		direction: text('direction', { enum: skillTrajectoryDirectionValues }).notNull(),
		confidence: real('confidence').notNull(),
		evidenceRefsJson: text('evidence_refs_json').notNull(),
		baselineNote: text('baseline_note'),
		latestNote: text('latest_note'),
		sessionsObserved: integer('sessions_observed', { mode: 'number' }).notNull(),
		updatedAt: integer('updated_at', { mode: 'number' }).notNull(),
	},
	(table) => [
		check(
			'skill_trajectory_confidence_check',
			sql`${table.confidence} >= 0 and ${table.confidence} <= 1`,
		),
		check(
			'skill_trajectory_evidence_refs_json_array_check',
			sql`json_valid(${table.evidenceRefsJson}) and json_type(${table.evidenceRefsJson}) = 'array'`,
		),
		check('skill_trajectory_sessions_observed_check', sql`${table.sessionsObserved} >= 0`),
		check('skill_trajectory_updated_at_check', sql`${table.updatedAt} >= 0`),
		index('skill_trajectory_user_dimension_unique').on(table.userId, table.dimension),
		index('skill_trajectory_user_updated_at_index').on(table.userId, table.updatedAt),
	],
)

export type SkillTrajectoryRow = typeof skillTrajectory.$inferSelect
export type NewSkillTrajectoryRow = typeof skillTrajectory.$inferInsert
```
