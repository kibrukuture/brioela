# Draft: tonight.contract.ts (gap — file does not exist)

Target: `shared/contracts/tonight.contract.ts`

**Gap (feature 54):** ts-rest contract for card fetch + response.

**Source:** `_features/54-tonight/build.md` § API

---

```typescript
import { initContract } from '@ts-rest/core'
import { z } from '@brioela/shared/zod'
import { TonightAnswerSchema } from '@brioela/shared/validator/tonight/tonight.answer.schema'
import { TonightResponseBodySchema } from '@brioela/shared/validator/tonight/tonight.response.body.schema'
import { TONIGHT_ROUTES } from '@brioela/shared/routes/tonight.routes'

const c = initContract()

export const tonightContract = c.router({
  getToday: {
    method: 'GET',
    path: TONIGHT_ROUTES.today,
    responses: {
      200: TonightAnswerSchema.nullable(),
    },
    summary: 'Fetch tonight answer for local today if generated',
  },
  recordResponse: {
    method: 'POST',
    path: TONIGHT_ROUTES.response,
    body: TonightResponseBodySchema,
    responses: {
      204: c.noBody(),
    },
    summary: 'Record cook / swap / dismiss gesture',
  },
  applyCravingAdjustment: {
    method: 'POST',
    path: TONIGHT_ROUTES.applyAdjustment,
    body: z.object({
      cravingDecodedEventId: z.string(),
      dateLocal: z.string(),
    }),
    responses: {
      204: c.noBody(),
    },
    summary: 'Accept **37** tonight_adjust offer',
  },
})
```
