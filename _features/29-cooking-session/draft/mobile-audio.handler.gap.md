# Gap snapshot: mobile-audio.handler.ts

Target: `backend/src/agents/mira/_handlers/mobile-audio.handler.ts`

**Status:** Not in repo. Mobile receives Gemini PCM over WebSocket.

```typescript
import type { MiraSession } from '../mira-session.agent'

export async function handleMobileAudio(request: Request, agent: MiraSession): Promise<Response> {
	if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
		return new Response('Expected WebSocket', { status: 426 })
	}

	const token = new URL(request.url).searchParams.get('token')
	if (!token) return new Response('Unauthorized', { status: 401 })
	// verifyMobileAudioToken(token, agent.sessionState)

	const pair = new WebSocketPair()
	const [client, server] = Object.values(pair) as [WebSocket, WebSocket]
	agent.ctx.acceptWebSocket(server, ['mobile-audio'])
	server.serializeAttachment({ kind: 'mobile-audio' })

	const state = agent.sessionState
	if (state) {
		state.mobileWs = server
		if (state.status === 'mobile_reconnecting') {
			state.status = 'active'
			agent.speechEngine?.setSessionStatus('active')
		}
	}

	return new Response(null, { status: 101, webSocket: client })
}
