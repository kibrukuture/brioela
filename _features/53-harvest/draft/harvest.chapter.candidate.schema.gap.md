# Draft: harvest.chapter.candidate.schema.ts (gap — file does not exist)

Target: `shared/validator/harvest/harvest.chapter.candidate.schema.ts`

**Gap (feature 53):** Pre-rank candidate shape with query refs for anti-hallucination gate.

**Source:** `brioela-specs/49-harvest.md` § Technical Constraints

---

```typescript
import { z } from 'zod'
import { harvestChapterTypeValues } from '@brioela/shared/constants/harvest'

export const sourceQueryRefSchema = z.object({
	queryId: z.string(),
	description: z.string(),
	result: z.union([z.string(), z.number(), z.boolean()]),
})

export const harvestChapterCandidateSchema = z.object({
	candidateId: z.string(),
	chapterType: z.enum(harvestChapterTypeValues),
	salience: z.number().min(0).max(1),
	headlineSeed: z.string(),
	bodySeed: z.string().optional(),
	sourceQueries: z.array(sourceQueryRefSchema).min(1),
	entityKind: z
		.enum(['product', 'recipe', 'ingredient', 'category', 'skill', 'audience'])
		.optional(),
	entityId: z.string().nullable().optional(),
})

export type HarvestChapterCandidate = z.infer<typeof harvestChapterCandidateSchema>
export type SourceQueryRef = z.infer<typeof sourceQueryRefSchema>
```
