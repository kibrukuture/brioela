# Gap snapshot: init.handler.ts

Target: `backend/src/agents/mira/_handlers/init.handler.ts`

**Status:** Not in repo. From `build-guide/08-cooking-session/02-mira-session-do.md`.

```typescript
import type { MiraSession } from '../mira-session.agent'
import { buildCookingMiraScene } from '../_scenes/build-cooking-scene.helper'
import { loadUserContext } from '../_helpers/load-user-context.helper'
import { openGeminiSession } from '../_helpers/gemini-session.helper'
import { MiraSpeechDecisionEngine } from '../mira-speech-decision'
import { forwardToolToBrain } from '../_helpers/forward-tool-to-brain.helper'

type InitBody = {
	sessionId: string
	userId: string
	meetingId: string
	recipeId?: string | null
}

export async function handleInit(request: Request, agent: MiraSession): Promise<Response> {
	const body = (await request.json()) as InitBody
	const { sessionId, userId, meetingId, recipeId = null } = body

	agent.sessionState = {
		sessionId,
		userId,
		meetingId,
		geminiWs: null,
		mobileWs: null,
		realtimeAudioWs: null,
		realtimeVideoWs: null,
		status: 'initializing',
		turnCounter: 0,
		geminiReconnectTimer: null,
		pendingToolCall: null,
		adapterIds: [],
	}

	await agent.ctx.storage.sql.exec(
		`INSERT OR REPLACE INTO cooking_session_runtime
     (session_id, user_id, meeting_id, status, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
		sessionId,
		userId,
		meetingId,
		'initializing',
		Date.now(),
	)

	const scene = await buildCookingMiraScene({ userId, sessionId, recipeId })
	const context = await loadUserContext(userId, agent.env, scene.brainContext)

	agent.speechEngine = new MiraSpeechDecisionEngine({ sessionId, userId })
	await openGeminiSession(context, agent)

	await forwardToolToBrain(
		{ tool: 'upsert_agent_state', args: { key: `turn_counter.${sessionId}`, value: '0' } },
		agent.sessionState,
		agent.env,
	)

	agent.sessionState.status = 'active'
	agent.speechEngine.setSessionStatus('active')

	return new Response('OK')
}
