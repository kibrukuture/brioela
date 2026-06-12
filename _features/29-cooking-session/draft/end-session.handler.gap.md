# Gap snapshot: end-session.handler.ts

Target: `backend/src/agents/mira/_handlers/end-session.handler.ts`

**Status:** Not in repo. From `build-guide/08-cooking-session/06-session-end-and-recipe.md`.

```typescript
import type { MiraSession } from '../mira-session.agent'
import { cancelAllTimers } from './alarm.handler'
import { closeRealtimeAdapters, endActiveRealtimeKitSession } from '../_helpers/realtime-teardown.helper'
import { runSessionEndProcessing } from '../_helpers/run-session-end-processing.helper'
import { forwardToolToBrain } from '../_helpers/forward-tool-to-brain.helper'
import { writeTranscriptSystemEvent } from '../_helpers/write-transcript-turn.helper'

export type SessionEndReason = 'user_ended' | 'mobile_disconnected' | 'timeout' | 'error'

export async function endSession(reason: SessionEndReason, miraSession: MiraSession): Promise<void> {
	const state = miraSession.sessionState
	if (!state || state.status === 'ending' || state.status === 'ended') return

	state.status = 'ending'
	await writeTranscriptSystemEvent(`Cooking session ended: ${reason}`, miraSession)

	if (state.geminiWs) {
		state.geminiWs.close(1000, 'session_ended')
		state.geminiWs = null
	}

	if (state.geminiReconnectTimer) {
		clearTimeout(state.geminiReconnectTimer)
		state.geminiReconnectTimer = null
	}

	await cancelAllTimers(miraSession)
	await closeRealtimeAdapters(state.adapterIds, miraSession.env)
	await endActiveRealtimeKitSession(state.meetingId, miraSession.env)

	if (state.mobileWs) {
		state.mobileWs.close(1000, 'session_ended')
		state.mobileWs = null
	}

	await miraSession.runFiber(`cooking-session-end:${state.sessionId}`, async () => {
		await runSessionEndProcessing(reason, miraSession)
	})

	await forwardToolToBrain(
		{
			tool: 'finalize_session',
			args: {
				sessionId: state.sessionId,
				endReason: reason,
				endedAt: Date.now(),
			},
		},
		state,
		miraSession.env,
	)

	await forwardToolToBrain(
		{
			tool: 'clear_session_state',
			args: { sessionId: state.sessionId },
		},
		state,
		miraSession.env,
	)

	state.status = 'ended'
}
