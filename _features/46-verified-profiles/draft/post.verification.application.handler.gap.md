# Draft: post.verification.application.handler.ts (gap — file does not exist)

Target: `backend/src/api/verified/_handlers/post.verification.application.handler.ts`

Source: `build-guide/23-verified-profiles/02-verification-flow.md`

---

```typescript
import type { Context } from 'hono'
import { verificationApplicationRequestSchema } from '@/shared/validator/verified/verification.application.schema'
import { requireSignetForVerifiedTools } from '@/agents/brain/_helpers/pricing/check.verified.profile.entitlement.helper'
import { validateVerificationEvidence } from '@/agents/brain/_helpers/verified/validate.verification.evidence.helper'
import { verifiedProfiles } from '@/shared/drizzle/schema/verified.person.profile.schema'
import { verifiedBusinesses } from '@/shared/drizzle/schema/verified.business.profile.schema'
import { db } from '@/core/database'

export async function postVerificationApplicationHandler(c: Context) {
  const userId = c.get('userId') as string
  const body = verificationApplicationRequestSchema.parse(await c.req.json())

  const action = body.kind === 'verified_profile' ? 'verified_profile' : 'verified_business'
  await requireSignetForVerifiedTools(userId, action)

  validateVerificationEvidence(body)

  if (body.kind === 'verified_profile') {
    const [row] = await db
      .insert(verifiedProfiles)
      .values({
        ownerUserId: userId,
        subtype: body.subtype,
        displayName: body.displayName,
        publicSlug: slugify(body.displayName),
        credentialSummary: body.credentialSummary ?? null,
        verificationStatus: 'pending_review',
        evidenceJson: body.evidence,
      })
      .returning()

    return c.json({ profileId: row.profileId, kind: body.kind, verificationStatus: row.verificationStatus })
  }

  const [row] = await db
    .insert(verifiedBusinesses)
    .values({
      ownerUserId: userId,
      subtype: body.subtype,
      displayName: body.displayName,
      publicSlug: slugify(body.displayName),
      placeId: body.placeId ?? null,
      verificationStatus: 'pending_review',
      evidenceJson: body.evidence,
    })
    .returning()

  return c.json({ profileId: row.profileId, kind: body.kind, verificationStatus: row.verificationStatus })
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
```
