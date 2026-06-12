# Gap snapshot: log-find-from-scan.ts

Target: `tools/ground/log-find-from-scan.ts`

**Status:** Not in repo. From `build-guide/09-ground/00-overview.md`, `03-find-submission-flow.md`.

```typescript
import type { ToolDefinition } from '@/tools/types'
import { z } from 'zod'

const LogFindFromScanInputSchema = z.object({
  scanId: z.string().uuid(),
  draftId: z.string().uuid(),
  approved: z.boolean(),
  editedContent: z.string().max(280).optional(),
})

export const logFindFromScanTool: ToolDefinition = {
  name: 'log_find_from_scan',
  description:
    'After user approves an AI-drafted Find from a product scan, submit it through the Ground gate. Audio is never stored.',
  inputSchema: LogFindFromScanInputSchema,
  async execute(input, ctx) {
    if (!input.approved) {
      return { ok: true, submitted: false, reason: 'user_dismissed' }
    }

    const draft = await ctx.env.BACKEND.fetch(
      `https://internal/api/scans/${input.scanId}/find-draft/${input.draftId}`,
      {
        headers: {
          'X-User-Id': ctx.userId,
          'X-Internal-Auth': ctx.env.INTERNAL_AUTH_SECRET,
        },
      },
    )

    if (!draft.ok) {
      return { ok: false, error: 'draft_not_found' }
    }

    const draftBody = await draft.json()
    const content = input.editedContent ?? draftBody.content

    const submit = await ctx.env.BACKEND.fetch('https://internal/api/finds', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': ctx.userId,
        'X-Internal-Auth': ctx.env.INTERNAL_AUTH_SECRET,
      },
      body: JSON.stringify({
        locationId: draftBody.locationId,
        signalType: draftBody.signalType,
        content,
        capturedAt: new Date().toISOString(),
        source: 'scan_draft',
        draftFromScanId: input.scanId,
      }),
    })

    if (!submit.ok) {
      const err = await submit.json()
      return { ok: false, gateFailed: true, ...err }
    }

    const find = await submit.json()
    return { ok: true, submitted: true, findId: find.findId }
  },
}
```
