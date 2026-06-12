# Draft: extract.cook.style.profile.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/cook.style/extract.cook.style.profile.helper.ts`

**Source:** spec **32** — post-session async; does not interrupt live session.

---

```typescript
import { createId } from '@brioela/shared/id'
import type { CookStyleProfile } from '@brioela/shared/validator/cook.style/cook.style.profile.schema'
import type { BrainDatabase } from '@/agents/brain/database'
import { cookStyleProfiles } from '@/agents/brain/_schemas/cook.style.profile.schema'
import { cookStyleAttributes } from '@/agents/brain/_schemas/cook.style.attribute.schema'
import { eq } from 'drizzle-orm'

export type ExtractCookStyleProfileInput = {
	userId: string
	cookName: string
	cookRelationship: string | null
	sessionId: string
	transcript: string
	visionEventSummary: string | null
	existingProfileId: string | null
}

export async function extractCookStyleProfileHelper(
	db: BrainDatabase,
	env: Cloudflare.Env,
	input: ExtractCookStyleProfileInput,
): Promise<CookStyleProfile> {
	const extracted = await runStyleExtractionLlm(env, input)
	const profileId = input.existingProfileId ?? createId()
	const now = Date.now()

	if (input.existingProfileId) {
		const existing = await db
			.select()
			.from(cookStyleProfiles)
			.where(eq(cookStyleProfiles.id, input.existingProfileId))
			.get()
		const sessionIds = existing ? JSON.parse(existing.sessionIdsJson) as string[] : []
		if (!sessionIds.includes(input.sessionId)) sessionIds.push(input.sessionId)

		await db
			.update(cookStyleProfiles)
			.set({
				styleSummaryText: extracted.styleSummaryText,
				sessionIdsJson: JSON.stringify(sessionIds),
				extractedAt: now,
				updatedAt: now,
			})
			.where(eq(cookStyleProfiles.id, profileId))
	} else {
		await db.insert(cookStyleProfiles).values({
			id: profileId,
			userId: input.userId,
			cookName: input.cookName,
			cookRelationship: input.cookRelationship,
			sessionIdsJson: JSON.stringify([input.sessionId]),
			styleSummaryText: extracted.styleSummaryText,
			extractedAt: now,
			createdAt: now,
			updatedAt: now,
		})
	}

	for (const attr of extracted.attributes) {
		await db.insert(cookStyleAttributes).values({
			id: createId(),
			profileId,
			attributeType: attr.attributeType,
			description: attr.description,
			confidenceScore: attr.confidenceScore,
			sourceQuote: attr.sourceQuote ?? null,
			createdAt: now,
		})
	}

	return {
		id: profileId,
		cookName: input.cookName,
		cookRelationship: input.cookRelationship ?? undefined,
		styleSummaryText: extracted.styleSummaryText,
		sessionIds: input.existingProfileId
			? JSON.parse(
					(
						await db
							.select()
							.from(cookStyleProfiles)
							.where(eq(cookStyleProfiles.id, profileId))
							.get()
					)?.sessionIdsJson ?? '[]',
				)
			: [input.sessionId],
		attributes: extracted.attributes.map((a) => ({ ...a, id: createId() })),
		extractedAt: now,
	}
}

async function runStyleExtractionLlm(
	_env: Cloudflare.Env,
	_input: ExtractCookStyleProfileInput,
): Promise<Pick<CookStyleProfile, 'styleSummaryText' | 'attributes'>> {
	throw new Error('not implemented')
}
```
