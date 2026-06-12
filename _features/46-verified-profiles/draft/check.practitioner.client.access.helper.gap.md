# Draft: check.practitioner.client.access.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/verified/check.practitioner.client.access.helper.ts`

Source: `build-guide/23-verified-profiles/05-client-and-practitioner-boundary.md`

**Canonical gate** — every practitioner read/write must call this first.

---

```typescript
import type { PractitionerClientScope } from '@/shared/constants/verified/practitioner.client.scope.constant'
import { practitionerClientRelationships } from '@/agents/brain/_schemas/practitioner.client.relationship.schema'
import type { BrainDatabase } from '@/agents/brain/_types/brain.database.type'
import { and, eq } from 'drizzle-orm'

export type PractitionerAccessResult =
  | { allowed: true; relationshipId: string; scopes: PractitionerClientScope[] }
  | { allowed: false; reason: 'no_relationship' | 'revoked' | 'scope_missing' | 'expired' }

export async function checkPractitionerClientAccess(
  db: BrainDatabase,
  input: {
    userId: string
    practitionerProfileId: string
    requiredScope: PractitionerClientScope
  },
): Promise<PractitionerAccessResult> {
  const [row] = await db
    .select()
    .from(practitionerClientRelationships)
    .where(
      and(
        eq(practitionerClientRelationships.userId, input.userId),
        eq(practitionerClientRelationships.practitionerProfileId, input.practitionerProfileId),
        eq(practitionerClientRelationships.status, 'active'),
      ),
    )
    .limit(1)

  if (!row) {
    return { allowed: false, reason: 'no_relationship' }
  }

  const scopes = JSON.parse(row.scopesJson) as PractitionerClientScope[]
  if (!scopes.includes(input.requiredScope)) {
    return { allowed: false, reason: 'scope_missing' }
  }

  return { allowed: true, relationshipId: row.id, scopes }
}
```

**Blocked scopes (v1):** No `mesa_members`, `wearable_data`, `cgm_data`, `medications`, `full_scan_history`.
