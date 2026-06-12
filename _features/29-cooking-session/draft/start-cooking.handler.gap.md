# Gap snapshot: start-cooking.handler.ts

Target: `backend/src/agents/brain/_handlers/start-cooking.handler.ts`

**Status:** Not in repo. From `build-guide/08-cooking-session/01-room-lifecycle.md`.

```typescript
import type { Env } from '@/types/env'
import type { BrainDatabase } from '@/agents/brain/_database'
import { sessions } from '@/agents/brain/_schemas/session.schema'
import { agentState } from '@/agents/brain/_schemas/agent.state.schema'
import { createMeeting, createParticipant } from '@/api/cooking/_helpers/realtimekit.client'
import { signMobileAudioToken } from '@/api/cooking/_helpers/sign-mobile-audio-token.helper'

export type CookingSessionStart = {
	sessionId: string
	meetingId: string
	participantToken: string
	doAudioEndpoint: string
}

export async function startCookingSession(
	userId: string,
	env: Env,
	database: BrainDatabase,
): Promise<CookingSessionStart> {
	const sessionId = crypto.randomUUID()
	const meetingId = await createMeeting(sessionId, env)
	const participantToken = await createParticipant(meetingId, userId, env)

	const doId = env.MIRA_SESSION.idFromName(`cooking:${sessionId}`)
	const mira = env.MIRA_SESSION.get(doId)
	await mira.fetch(new Request('https://internal/init', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ sessionId, userId, meetingId }),
	}))

	await database.insert(sessions).values({
		id: sessionId,
		userId,
		sessionType: 'cooking',
		status: 'active',
		model: 'gemini-3.1-flash-live-preview',
		startedAt: Date.now(),
	})

	await database
		.insert(agentState)
		.values({
			key: `active_session_id`,
			userId,
			value: sessionId,
			updatedAt: Date.now(),
		})
		.onConflictDoUpdate({
			target: agentState.key,
			set: { value: sessionId, updatedAt: Date.now() },
		})

	const audioToken = await signMobileAudioToken(sessionId, userId, env)

	return {
		sessionId,
		meetingId,
		participantToken,
		doAudioEndpoint: `${env.WORKER_WS_BASE_URL}/cooking/${sessionId}/audio?token=${audioToken}`,
	}
}
