# Draft: emotional-tone.ts (gap — file does not exist)

Target: `shared/grammar/schema/tokens/emotional-tone.ts`

**Gap (feature 52):** Emotional tone token enum — AI selects; never changes safety verdicts.

**Source:** `build-guide/27-generative-grammar/04-emotion-motion-skia.md`

---

```typescript
import { z } from '@brioela/shared/zod'

export const emotionalToneValues = [
	'neutral_factual',
	'discovery_informational',
	'caution_explanatory',
	'positive_confirming',
	'memory_reflective',
	'focused_instructional',
	'learning_gentle',
	'group_considerate',
	'savings_reassuring',
] as const

export type EmotionalTone = (typeof emotionalToneValues)[number]

export const emotionalToneSchema = z.enum(emotionalToneValues)
```
