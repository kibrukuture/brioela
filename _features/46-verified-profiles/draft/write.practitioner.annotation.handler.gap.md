# Draft: write.practitioner.annotation.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/verified/write.practitioner.annotation.handler.ts`

Source: `build-guide/22-medical-conditions/06-practitioner-privacy-boundary.md`, `build-guide/23-verified-profiles/05-client-and-practitioner-boundary.md`

**23** owns `practitioner_condition_annotations` DDL; **46** owns consent gate + write path.

---

```typescript
import { z } from 'zod'
import { checkPractitionerClientAccess } from './check.practitioner.client.access.helper'
import { practitionerConditionAnnotations } from '@/agents/brain/_schemas/practitioner.condition.annotation.schema'
import type { BrainDatabase } from '@/agents/brain/_types/brain.database.type'
import { generateId } from '@/shared/utils/generate.id'

const writeAnnotationSchema = z.object({
  userId: z.string(),
  practitionerProfileId: z.string(),
  conditionProfileId: z.string(),
  note: z.string().min(1).max(2000),
})

export async function writePractitionerAnnotationHandler(
  db: BrainDatabase,
  input: z.infer<typeof writeAnnotationSchema>,
) {
  const parsed = writeAnnotationSchema.parse(input)

  const access = await checkPractitionerClientAccess(db, {
    userId: parsed.userId,
    practitionerProfileId: parsed.practitionerProfileId,
    requiredScope: 'condition_annotations',
  })

  if (!access.allowed) {
    throw new Error(`practitioner_access_denied:${access.reason}`)
  }

  const now = Date.now()
  await db.insert(practitionerConditionAnnotations).values({
    id: generateId(),
    userId: parsed.userId,
    practitionerId: parsed.practitionerProfileId,
    conditionProfileId: parsed.conditionProfileId,
    note: parsed.note,
    status: 'active',
    createdAt: now,
    revokedAt: null,
  })

  return { ok: true }
}
```

**Rule:** Annotations are guidance notes — not hard system rules unless user explicitly accepts into profile (**23**).
