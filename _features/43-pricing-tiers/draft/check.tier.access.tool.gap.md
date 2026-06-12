# Draft: check.tier.access.tool.ts (gap — file does not exist)

Target: `backend/src/agents/brain/tools/pricing/check.tier.access.tool.ts`

**Gap:** Brain tool registry has no read-only pricing check — `tools/pricing/` missing.

**Source:** `build-guide/25-pricing-tiers/04-access-checks-and-tools.md`, **19** tool registry

---

```typescript
import { z } from 'zod'
import { checkTierAccess } from '@/agents/brain/_helpers/pricing/check.tier.access.helper'
import { resolveUserEntitlement } from '@/agents/brain/_helpers/pricing/resolve.user.entitlement.helper'
import type { BrainToolContext } from '@/agents/brain/tools/types'

const inputSchema = z.object({
  action: z.string().describe('FeatureAction key, e.g. menu_scan, voice_cooking_session'),
})

export const checkTierAccessTool = {
  name: 'check_tier_access',
  description:
    'Returns whether the current user tier permits a feature action. Read-only — never changes billing.',
  inputSchema,
  async execute(
    ctx: BrainToolContext,
    input: z.infer<typeof inputSchema>,
  ) {
    const entitlement = await resolveUserEntitlement(ctx.db, ctx.userId)
    const result = checkTierAccess(entitlement, input.action as Parameters<typeof checkTierAccess>[1])
    return result
  },
}
```
