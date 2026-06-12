# Gap snapshot: submit-find.ts

Target: `tools/ground/submit-find.ts`

**Status:** Not in repo. From `build-guide/09-ground/00-overview.md`, `02-authenticity-gate.md`.

```typescript
import type { ToolDefinition } from '@/tools/types'
import { CreateFindRequestSchema } from '@brioela/shared/validator/find'
import { z } from 'zod'

const SubmitFindInputSchema = z.object({
  locationId: z.string().uuid(),
  signalType: CreateFindRequestSchema.shape.signalType,
  content: z.string().max(280),
  capturedAt: z.string().datetime().optional(),
})

export const submitFindTool: ToolDefinition = {
  name: 'submit_find',
  description:
    'Submit an anonymous Ground Find observation after user confirmation. Runs authenticity gate. Never include contributor identity.',
  inputSchema: SubmitFindInputSchema,
  async execute(input, ctx) {
    const capturedAt = input.capturedAt ?? new Date().toISOString()

    const response = await ctx.env.BACKEND.fetch('https://internal/api/finds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': ctx.userId,
        'X-Internal-Auth': ctx.env.INTERNAL_AUTH_SECRET,
      },
      body: JSON.stringify({
        ...input,
        capturedAt,
        source: 'manual',
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return { ok: false, error: err }
    }

    const find = await response.json()
    return { ok: true, findId: find.findId, signalType: find.signalType }
  },
}
```

Register in `tools/index.ts` via **19-brain-tool-registry**.
