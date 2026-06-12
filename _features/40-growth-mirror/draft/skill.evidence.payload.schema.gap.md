# Draft: skill.evidence.payload.schema.ts (gap — file does not exist)

Target: `shared/validator/growth-mirror/skill.evidence.payload.schema.ts`

**Gap:** No Zod contract for `memory_event` kind `skill_evidence` payload; kind not listed in `implementable-specs/01-memory-event.md`.

**Source:** `build-guide/40-growth-mirror/01-skill-evidence-extraction.md`, `brioela-specs/53-growth-mirror.md`

---

```typescript
import { z } from '@brioela/shared/zod'

export const SHIPPED_SKILL_DIMENSIONS = [
	'knife_work',
	'heat_control',
	'timing_parallelism',
	'technique_vocabulary',
	'independence',
	'repertoire',
	'improvisation',
] as const

export const skillDimensionSchema = z
	.string()
	.min(1)
	.max(64)
	.regex(/^[a-z][a-z0-9_]*$/)

export const skillEvidencePayloadSchema = z.object({
	dimension: skillDimensionSchema,
	signal: z.string().min(1).max(500),
	normalized_value: z.number().optional(),
	evidence_refs: z.array(z.string().min(1)).min(1),
	recipe_difficulty: z.number().min(0).max(1).optional(),
	attribution: z.literal('account_owner'),
})

export type SkillEvidencePayload = z.infer<typeof skillEvidencePayloadSchema>

export const MEMORY_EVENT_KIND_SKILL_EVIDENCE = 'skill_evidence' as const
```
