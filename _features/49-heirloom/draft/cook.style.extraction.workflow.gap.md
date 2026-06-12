# Draft: cook.style.extraction.workflow.ts (gap — file does not exist)

Target: `backend/src/api/heirlooms/jobs/cook.style.extraction.workflow.ts`

**Source:** spec **32** — post-session async; does not block session end.

---

```typescript
import { serve } from '@upstash/workflow/cloudflare'
import { extractCookStyleProfileHelper } from '@/agents/brain/_helpers/cook.style/extract.cook.style.profile.helper'

type CookStyleExtractionPayload = {
	userId: string
	sessionId: string
	captureId: string
	cookName: string
	cookRelationship: string | null
	existingProfileId: string | null
}

export const cookStyleExtractionWorkflow = serve<CookStyleExtractionPayload>(async (context) => {
	const payload = context.requestPayload

	const transcript = await context.run('load-session-transcript', async () => {
		return loadSessionTranscript(payload.userId, payload.sessionId)
	})

	const visionSummary = await context.run('load-vision-events', async () => {
		return loadVisionEventSummary(payload.userId, payload.sessionId)
	})

	await context.run('extract-style-profile', async () => {
		const db = await openBrainDb(payload.userId)
		await extractCookStyleProfileHelper(db, context.env, {
			userId: payload.userId,
			cookName: payload.cookName,
			cookRelationship: payload.cookRelationship,
			sessionId: payload.sessionId,
			transcript,
			visionEventSummary: visionSummary,
			existingProfileId: payload.existingProfileId,
		})
	})
})

async function loadSessionTranscript(_userId: string, _sessionId: string): Promise<string> {
	return ''
}
async function loadVisionEventSummary(
	_userId: string,
	_sessionId: string,
): Promise<string | null> {
	return null
}
async function openBrainDb(_userId: string): Promise<never> {
	throw new Error('not implemented')
}
```
