# Gap snapshot: create.find.handler.ts

Target: `backend/src/api/finds/_handlers/create.find.handler.ts`

**Status:** Not in repo. From `build-guide/09-ground/02-authenticity-gate.md`, `03-find-submission-flow.md`.

```typescript
import type { AppContext } from '@/index'
import { CreateFindRequestSchema, FindSchema } from '@brioela/shared/validator/find'
import { checkFindRateLimit } from '../_helpers/check.find.rate.limit.helper'
import { checkGroundEntitlement } from '../_helpers/check.ground.entitlement.helper'
import { detectFacesOnR2Media } from '../_helpers/detect.faces.r2.helper'
import { hashContributor } from '../_helpers/hash.contributor.helper'
import { logUserFindHistory } from '../_helpers/log.user.find.history.helper'
import { runAiGate } from '../_helpers/run.ai.gate.helper'
import { updateLocationSignalSummary } from '../_helpers/update.location.signal.summary.helper'
import { getDb } from '@/core/db'
import { find as findTable } from '@brioela/shared/drizzle/schema/find'

export async function createFind(c: AppContext) {
  const userId = c.get('userId')
  const body = await c.req.json()
  const parsed = CreateFindRequestSchema.safeParse(body)

  if (!parsed.success) {
    return c.json({ error: 'invalid_request', details: parsed.error.flatten() }, 400)
  }

  await checkGroundEntitlement(userId, c.env)
  await checkFindRateLimit(userId, c.env)

  if (parsed.data.mediaUrls?.length) {
    const faceResult = await detectFacesOnR2Media(parsed.data.mediaUrls, c.env)
    if (faceResult.hasFaces) {
      return c.json(
        {
          error: 'gate_failed',
          rejectionReason: 'Face detected — Ground does not publish images with faces',
          checks: [{ check: 'face_detection', passed: false, reason: faceResult.detail }],
        },
        422,
      )
    }
  }

  const gate = await runAiGate({
    content: parsed.data.content,
    signalType: parsed.data.signalType,
    locationId: parsed.data.locationId,
    capturedAt: parsed.data.capturedAt,
    env: c.env,
  })

  if (!gate.passed) {
    await checkFindRateLimit.recordGateFailure(userId, c.env)
    return c.json(
      {
        error: 'gate_failed',
        rejectionReason: gate.rejectionReason,
        checks: gate.checks,
      },
      422,
    )
  }

  const findId = crypto.randomUUID()
  const contributorHash = hashContributor(userId)
  const expiresAt = new Date(parsed.data.capturedAt)
  expiresAt.setDate(expiresAt.getDate() + 60)

  const db = getDb(c.env)
  await db.insert(findTable).values({
    findId,
    locationId: parsed.data.locationId,
    signalType: parsed.data.signalType,
    content: parsed.data.content,
    mediaUrls: parsed.data.mediaUrls ?? null,
    capturedAt: new Date(parsed.data.capturedAt),
    expiresAt,
    status: 'active',
    contributorHash,
    gatePassed: true,
    gateLog: gate.checks,
  })

  await updateLocationSignalSummary({
    locationId: parsed.data.locationId,
    signalType: parsed.data.signalType,
    capturedAt: parsed.data.capturedAt,
    delta: 1,
    env: c.env,
  })

  await logUserFindHistory(userId, {
    findId,
    submittedAt: Date.now(),
    locationId: parsed.data.locationId,
    signalType: parsed.data.signalType,
    contentPreview: parsed.data.content.slice(0, 80),
  }, c.env)

  const row = {
    findId,
    locationId: parsed.data.locationId,
    signalType: parsed.data.signalType,
    content: parsed.data.content,
    mediaUrls: parsed.data.mediaUrls ?? null,
    capturedAt: parsed.data.capturedAt,
    expiresAt: expiresAt.toISOString(),
    status: 'active' as const,
    gatePassed: true,
  }

  return c.json(FindSchema.parse(row), 201)
}
```
