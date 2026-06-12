# Draft: build-catalog-schema.ts (gap — file does not exist)

Target: `backend/src/core/generative-grammar/build-catalog-schema.ts`

**Gap (feature 52):** Per-surface narrowed Zod schema → provider `input_schema`.

**Source:** `13-how-ai-selects.md`, `19-code-package-structure.md`

---

```typescript
import { z } from '@brioela/shared/zod'
import type { GenerativeSurface } from '@brioela/shared/grammar/schema/surfaces'
import { brioelaGenerativeUiDocumentSchema } from '@brioela/shared/grammar'
import { surfaceLayoutAllowlists } from '@brioela/shared/grammar/catalog/allowlists'

export function buildCatalogInputSchema(surface: GenerativeSurface): z.ZodType {
	const allowedLayouts = surfaceLayoutAllowlists[surface]

	return brioelaGenerativeUiDocumentSchema.superRefine((doc, ctx) => {
		if (doc.surface !== surface) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `surface must be ${surface}`,
				path: ['surface'],
			})
		}
		if (!allowedLayouts.includes(doc.layoutTemplate.type)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: 'layoutTemplate not allowed on surface',
				path: ['layoutTemplate', 'type'],
			})
		}
	})
}
```
