# Draft: post.practitioner.connection.respond.handler.ts (gap — file does not exist)

Target: `backend/src/api/verified/_handlers/post.practitioner.connection.respond.handler.ts`

Source: `build-guide/23-verified-profiles/05-client-and-practitioner-boundary.md`

User must see exact scopes before accept — mobile `client.connection.consent.sheet.tsx`.

---

```typescript
import type { Context } from 'hono'
import { z } from 'zod'
import { practitionerClientScopeValues } from '@/shared/constants/verified/practitioner.client.scope.constant'
import { callClientBrainRpc } from '@/core/brain/call.client.brain.rpc'

const respondSchema = z.object({
  relationshipId: z.string().uuid(),
  decision: z.enum(['accept', 'reject']),
  grantedScopes: z.array(z.enum(practitionerClientScopeValues)).optional(),
})

export async function postPractitionerConnectionRespondHandler(c: Context) {
  const userId = c.get('userId') as string
  const body = respondSchema.parse(await c.req.json())

  if (body.decision === 'accept' && (!body.grantedScopes || body.grantedScopes.length === 0)) {
    return c.json({ error: 'scopes_required_on_accept' }, 400)
  }

  const result = await callClientBrainRpc(userId, 'respond_practitioner_connection', {
    relationshipId: body.relationshipId,
    decision: body.decision,
    grantedScopes: body.grantedScopes ?? [],
  })

  return c.json(result)
}
```
