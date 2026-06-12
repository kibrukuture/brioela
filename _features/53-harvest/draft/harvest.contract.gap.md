# Draft: harvest.contract.ts (gap — file does not exist)

Target: `shared/contracts/harvest.contract.ts`

**Gap (feature 53):** ts-rest contract for edition read + archive.

---

```typescript
import { initContract } from '@ts-rest/core'
import { z } from 'zod'
import { HARVEST_ROUTES } from '@brioela/shared/routes/harvest.routes'
import { harvestEditionSchema } from '@brioela/shared/validator/harvest/harvest.edition.schema'
import { harvestChapterSchema } from '@brioela/shared/validator/harvest/harvest.chapter.schema'

const c = initContract()

export const harvestContract = c.router({
	getEdition: {
		method: 'GET',
		path: HARVEST_ROUTES.EDITION,
		pathParams: z.object({ editionId: z.string() }),
		responses: {
			200: z.object({
				edition: harvestEditionSchema,
				chapters: z.array(harvestChapterSchema),
				documentSetJson: z.string(),
			}),
		},
	},
	listEditions: {
		method: 'GET',
		path: HARVEST_ROUTES.EDITIONS,
		responses: {
			200: z.object({
				editions: z.array(harvestEditionSchema),
			}),
		},
	},
	markOpened: {
		method: 'POST',
		path: HARVEST_ROUTES.EDITION_OPENED,
		pathParams: z.object({ editionId: z.string() }),
		body: z.object({}),
		responses: {
			204: z.null(),
		},
	},
})
```
