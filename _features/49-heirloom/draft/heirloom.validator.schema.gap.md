# Draft: heirloom.schema.ts validator (gap — file does not exist)

Target: `shared/validator/heirloom/heirloom.schema.ts`

---

```typescript
import { z } from '@brioela/shared/zod'
import {
	heirloomItemTypeValues,
	heirloomRoleValues,
} from '@brioela/shared/constants/heirloom'

export const heirloomItemSchema = z.object({
	id: z.string(),
	itemType: z.enum(heirloomItemTypeValues),
	localRef: z.string(),
	ownerNote: z.string().optional(),
	addedAt: z.number(),
	versionAdded: z.number(),
})

export const heirloomSchema = z.object({
	id: z.string(),
	role: z.enum(heirloomRoleValues),
	cookName: z.string(),
	cookRelationship: z.string().optional(),
	dedicationText: z.string().optional(),
	coverPhotoRef: z.string().optional(),
	version: z.number().int().positive(),
	receivedFrom: z.string().optional(),
	items: z.array(heirloomItemSchema),
	createdAt: z.number(),
	updatedAt: z.number(),
})

export const heirloomAssembleInputSchema = z.object({
	cookName: z.string().min(1),
	cookRelationship: z.string().optional(),
	dedicationText: z.string().optional(),
	coverPhotoRef: z.string().optional(),
	recipeIds: z.array(z.string()).default([]),
	styleProfileId: z.string().optional(),
	momentRefs: z
		.array(
			z.object({
				photoRef: z.string(),
				note: z.string().optional(),
				recipeId: z.string().optional(),
			}),
		)
		.default([]),
})

export type Heirloom = z.infer<typeof heirloomSchema>
export type HeirloomAssembleInput = z.infer<typeof heirloomAssembleInputSchema>
```
