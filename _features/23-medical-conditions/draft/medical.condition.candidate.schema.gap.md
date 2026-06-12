# Draft: medical.condition.candidate.schema.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_schemas/medical.condition.candidate.schema.ts`

Source: `build-guide/22-medical-conditions/01-condition-detection-confirmation.md`

---

## Intended production file

```typescript
import { check, index, integer, real, sql, sqliteTable, text } from '@/database/sqlite/_schema'

const detectedFrom = ['voice', 'chat', 'scan_comment', 'recipe_session', 'practitioner_note'] as const
const candidateStatus = ['pending_confirmation', 'confirmed', 'dismissed', 'expired'] as const

export const medicalConditionCandidates = sqliteTable(
	'medical_condition_candidates',
	{
		id: text('id').primaryKey(),
		userId: text('user_id').notNull(),
		conditionType: text('condition_type').notNull(),
		detectedFrom: text('detected_from', { enum: detectedFrom }).notNull(),
		sourceSessionId: text('source_session_id'),
		evidenceText: text('evidence_text').notNull(),
		confidence: real('confidence').notNull(),
		status: text('status', { enum: candidateStatus }).notNull().default('pending_confirmation'),
		detectedAt: integer('detected_at', { mode: 'number' }).notNull(),
		resolvedAt: integer('resolved_at', { mode: 'number' }),
	},
	(table) => [
		check('medical_condition_candidates_confidence_check', sql`${table.confidence} >= 0 and ${table.confidence} <= 1`),
		check(
			'medical_condition_candidates_status_check',
			sql`${table.status} in ('pending_confirmation', 'confirmed', 'dismissed', 'expired')`,
		),
		index('idx_medical_condition_candidates_pending').on(table.userId, table.status, table.conditionType),
	],
)

export type BrainMedicalConditionCandidate = typeof medicalConditionCandidates.$inferSelect
export type NewBrainMedicalConditionCandidate = typeof medicalConditionCandidates.$inferInsert
```

**Evidence rule:** `evidenceText` is a minimal quote — do not store full session transcripts.
