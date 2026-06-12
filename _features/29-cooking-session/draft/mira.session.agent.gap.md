# Gap snapshot: mira-session.agent.ts

Target: `backend/src/agents/mira/mira-session.agent.ts`

**Status:** Not in repo. From `build-guide/08-cooking-session/02-mira-session-do.md`.

```typescript
import { Agent } from 'agents'
import type { Env } from '@/types/env'
import { handleInit } from './_handlers/init.handler'
import { handleRealtimeStream } from './_handlers/realtime-stream.handler'
import { handleMobileAudio } from './_handlers/mobile-audio.handler'
import { fireCookingTimer, handleMobileDisconnectDeadline } from './_handlers/alarm.handler'
import { endSession } from './_handlers/end-session.handler'
import { rebuildTimerState } from './_handlers/alarm.handler'
import { openGeminiSession } from './_helpers/gemini-session.helper'
import { loadUserContext } from './_helpers/load-user-context.helper'
import { loadRecentTranscript } from './_helpers/load-recent-transcript.helper'
import { decodeRealtimePacket } from './_helpers/decode-realtime-packet.helper'
import { sendAudioChunk } from './_helpers/send-audio-chunk.helper'
import { handleVideoFrame } from './_helpers/send-video-frame.helper'
import { MiraSpeechDecisionEngine } from './mira-speech-decision'
import type { MiraSessionState } from './_types/mira.session.state.type'

export class MiraSession extends Agent<Env> {
	sessionState: MiraSessionState | null = null
	activeTimers = new Map<string, { firesAt: number; timerId: string; sdkScheduleId: string }>()
	speechEngine: MiraSpeechDecisionEngine | null = null

	override async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url)

		if (!this.sessionState && url.pathname !== '/init') {
			await this.recover()
		}

		switch (url.pathname) {
			case '/init':
				return handleInit(request, this)
			case '/stream/audio':
				return handleRealtimeStream(request, this, 'audio')
			case '/stream/video':
				return handleRealtimeStream(request, this, 'video')
			case '/audio':
				return handleMobileAudio(request, this)
			default:
				return new Response('Not found', { status: 404 })
		}
	}

	override async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
		const attachment = ws.deserializeAttachment() as { kind: string; mediaKind?: 'audio' | 'video' }
		if (attachment.kind !== 'realtime' || typeof message === 'string') return

		const packet = decodeRealtimePacket(message)
		if (attachment.mediaKind === 'audio') {
			this.speechEngine?.onVoiceActivity(packet.hasVoiceActivity ?? false)
			await sendAudioChunk(packet.payload, this)
			return
		}
		if (attachment.mediaKind === 'video') {
			this.speechEngine?.onVideoFrame(packet.payload)
			await handleVideoFrame(packet.payload, this)
		}
	}

	override async webSocketClose(ws: WebSocket): Promise<void> {
		const attachment = ws.deserializeAttachment() as { kind: string }
		if (attachment.kind === 'mobile-audio') {
			await this.onMobileDisconnect()
		}
	}

	async scheduleTask(
		name: string,
		payload: Record<string, unknown>,
	): Promise<void> {
		if (name === 'fireCookingTimer') {
			await fireCookingTimer(this, payload as { timerId: string })
		}
		if (name === 'handleMobileDisconnectDeadline') {
			await handleMobileDisconnectDeadline(this, payload as { sessionId: string })
		}
	}

	private async recover(): Promise<void> {
		const row = await this.ctx.storage.sql
			.exec(
				`SELECT session_id, user_id, meeting_id, status FROM cooking_session_runtime LIMIT 1`,
			)
			.one<{ session_id: string; user_id: string; meeting_id: string; status: string }>()
			.catch(() => null)

		if (!row) return

		this.sessionState = {
			sessionId: row.session_id,
			userId: row.user_id,
			meetingId: row.meeting_id,
			geminiWs: null,
			mobileWs: null,
			realtimeAudioWs: null,
			realtimeVideoWs: null,
			status: 'gemini_reconnecting',
			turnCounter: 0,
			geminiReconnectTimer: null,
			pendingToolCall: null,
			adapterIds: [],
		}

		await rebuildTimerState(this)
		const context = await loadUserContext(row.user_id, this.env)
		context.recentTranscript = await loadRecentTranscript(row.session_id, 20, this.env)
		await openGeminiSession(context, this)
		this.sessionState.status = 'active'
	}

	private async onMobileDisconnect(): Promise<void> {
		const state = this.sessionState
		if (!state || state.status !== 'active') return
		state.status = 'mobile_reconnecting'
		state.mobileWs = null
		const deadline = Date.now() + 5 * 60 * 1000
		await this.ctx.storage.sql.exec(
			`UPDATE cooking_session_runtime SET mobile_disconnect_deadline = ?, status = ? WHERE session_id = ?`,
			deadline,
			'mobile_reconnecting',
			state.sessionId,
		)
		await this.schedule(new Date(deadline), 'handleMobileDisconnectDeadline', {
			sessionId: state.sessionId,
		}, { idempotent: true })
	}
}
