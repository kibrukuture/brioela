# Draft: importedStepSchema soundCue extension (gap — field does not exist)

Target: `backend/src/agents/brain/_schemas/normalized.recipe.content.schema.ts`

**Gap:** Recipe steps lack optional `soundCue` field.

**Source:** `build-guide/33-acoustic-cooking/02-sound-cues-schema.md`, `brioela-specs/46-acoustic-cooking-intelligence.md`

**Production today:** `importedStepSchema` has `order`, `instruction`, `durationMinutes`, `temperatureText`, `confidence` only.

---

```typescript
import { z } from '@brioela/shared/zod'

const soundCueSchema = z
  .string()
  .min(1)
  .max(500)
  .nullable()
  .describe(
    'Natural-language sound checkpoint: what this step should sound like and what marks completion. Sound only — not time or temperature.',
  )

const importedStepSchema = z.object({
  order: z.number().int().positive(),
  instruction: z.string().min(1),
  durationMinutes: z.number().nullable(),
  temperatureText: z.string().nullable(),
  soundCue: soundCueSchema.optional(),
  confidence: z.number().min(0).max(1),
})
```
