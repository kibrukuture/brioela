# Draft: post.practitioner.connection.request.handler.ts (gap — file does not exist)

Target: `backend/src/api/verified/_handlers/post.practitioner.connection.request.handler.ts`

Source: `build-guide/23-verified-profiles/05-client-and-practitioner-boundary.md`

---

```typescript
import type { Context } from 'hono'
import { z } from 'zod'
import { practitionerClientScopeValues } from '@/shared/constants/verified/practitioner.client.scope.constant'
import { countActivePractitionerClients } from '@/agents/brain/_helpers/verified/count.active.practitioner.clients.helper'
import { MAX_PRACTITIONER_CLIENTS } from '@/shared/constants/verified/practitioner.client.scope.constant'
import { requireSignetForVerifiedTools } from '@/agents/brain/_helpers/pricing/check.verified.profile.entitlement.helper'
import { callClientBrainRpc } from '@/core/brain/call.client.brain.rpc'

const requestSchema = z.object({
  clientUserId: z.string().uuid(),
  practitionerProfileId: z.string().uuid(),
  requestedScopes: z.array(z.enum(practitionerClientScopeValues)).min(1),
})

export async function postPractitionerConnectionRequestHandler(c: Context) {
  const practitionerOwnerUserId = c.get('userId') as string
  const body = requestSchema.parse(await c.req.json())

  await requireSignetForVerifiedTools(practitionerOwnerUserId, 'practitioner_multi_client')

  const activeCount = await countActivePractitionerClients(practitionerOwnerUserId, body.practitionerProfileId)
  if (activeCount >= MAX_PRACTITIONER_CLIENTS) {
    return c.json({ error: 'client_limit_reached', limit: MAX_PRACTITIONER_CLIENTS }, 409)
  }

  await callClientBrainRpc(body.clientUserId, 'create_practitioner_connection_request', {
    practitionerProfileId: body.practitionerProfileId,
    practitionerOwnerUserId,
    requestedScopes: body.requestedScopes,
  })

  return c.json({ status: 'pending' })
}
```
