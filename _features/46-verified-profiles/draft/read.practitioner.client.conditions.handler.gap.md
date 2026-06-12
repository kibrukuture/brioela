# Draft: read.practitioner.client.conditions.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/verified/read.practitioner.client.conditions.handler.ts`

Source: `build-guide/23-verified-profiles/05-client-and-practitioner-boundary.md`, **23** `medical_condition_profiles`

Returns **active conditions only** — never full brain dump.

---

```typescript
import { z } from 'zod'
import { checkPractitionerClientAccess } from './check.practitioner.client.access.helper'
import { medicalConditionProfiles } from '@/agents/brain/_schemas/medical.condition.profile.schema'
import type { BrainDatabase } from '@/agents/brain/_types/brain.database.type'
import { and, eq } from 'drizzle-orm'

const readConditionsSchema = z.object({
  userId: z.string(),
  practitionerProfileId: z.string(),
})

export async function readPractitionerClientConditionsHandler(
  db: BrainDatabase,
  input: z.infer<typeof readConditionsSchema>,
) {
  const parsed = readConditionsSchema.parse(input)

  const access = await checkPractitionerClientAccess(db, {
    userId: parsed.userId,
    practitionerProfileId: parsed.practitionerProfileId,
    requiredScope: 'active_conditions',
  })

  if (!access.allowed) {
    throw new Error(`practitioner_access_denied:${access.reason}`)
  }

  const rows = await db
    .select({
      conditionType: medicalConditionProfiles.conditionType,
      strictness: medicalConditionProfiles.strictness,
      confirmedAt: medicalConditionProfiles.confirmedAt,
    })
    .from(medicalConditionProfiles)
    .where(
      and(
        eq(medicalConditionProfiles.userId, parsed.userId),
        eq(medicalConditionProfiles.status, 'active'),
      ),
    )

  return { conditions: rows }
}
```

**Blocked:** medications, scan history, Mesa members, wearables, private notes.
