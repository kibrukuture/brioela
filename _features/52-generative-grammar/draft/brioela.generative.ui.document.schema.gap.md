# Draft: brioela-generative-ui.ts (gap — file does not exist)

Target: `shared/grammar/schema/brioela-generative-ui.ts`

**Gap (feature 52):** Full `BrioelaGenerativeUiDocument` Zod schema — six expressive layers.

**Source:** `10-the-stage-document.md`, `02-grammar-document.md`, `12-naming-law.md`

---

```typescript
import { z } from '@brioela/shared/zod'
import { GRAMMAR_VERSION } from '../version'
import { generativeSurfaceSchema } from './surfaces'
import { emotionalToneSchema } from './tokens/emotional-tone'
import { backgroundEffectSelectionSchema } from './tokens/background-effect'
import { entranceMotionSchema } from './tokens/entrance-motion'
import { typographyStyleSchema } from './tokens/typography-style'
import { layoutTemplateSchema } from './compositions'
import { layoutTemplateContentSchema } from './compositions/content'

export const brioelaGenerativeUiDocumentSchema = z
	.object({
		grammarVersion: z.literal(GRAMMAR_VERSION),
		surface: generativeSurfaceSchema,
		safetyLock: z.boolean(),
		expiresAt: z.number().int().positive().nullable(),

		emotionalTone: emotionalToneSchema,
		backgroundEffect: backgroundEffectSelectionSchema.nullable(),
		layoutTemplate: layoutTemplateSchema,
		content: layoutTemplateContentSchema,
		entranceMotion: entranceMotionSchema.nullable(),
		typographyStyle: typographyStyleSchema,
	})
	.superRefine((doc, ctx) => {
		if (doc.content.type !== doc.layoutTemplate.type) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'content.type must match layoutTemplate.type',
				path: ['content', 'type'],
			})
		}
	})

export type BrioelaGenerativeUiDocument = z.infer<typeof brioelaGenerativeUiDocumentSchema>

export const brioelaGenerativeUiSchema = brioelaGenerativeUiDocumentSchema
```
