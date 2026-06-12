# Draft: post.kin.contribute.handler.ts (gap — file does not exist)

Target: `backend/src/api/kin/_handlers/post.kin.contribute.handler.ts`

**Gap (feature 50):** Validate, strip identity, queue for hourly batch.

---

```typescript
import { kinContributionPayloadSchema } from '@brioela/shared/validator/kin/kin.contribution.payload.schema'
import type { Context } from 'hono'

export async function postKinContributeHandler(c: Context): Promise<Response> {
	const raw: unknown = await c.req.json()
	const parsed = kinContributionPayloadSchema.safeParse(raw)
	if (!parsed.success) {
		return c.json({ error: 'invalid_payload' }, 400)
	}

	const tokenValid = await c.env.KIN_CONTRIBUTION_TOKENS.verify(parsed.data.contributionToken)
	if (!tokenValid) {
		return c.json({ error: 'invalid_token' }, 401)
	}

	await c.env.KIN_CONTRIBUTION_RATE_LIMITER.consume(tokenValid.key)

	await c.env.KIN_CONTRIBUTION_QUEUE.enqueue(parsed.data)

	return c.json({ accepted: true }, 202)
}
```

**Hard rule:** reject bodies containing `user_id` / `userId` — schema is `.strict()`.

Rate limit per token — abuse surface closed without identity (build-guide `03-contribution-pipeline.md`).
