# Gap snapshot: realtime-stream.handler.ts

Target: `backend/src/agents/mira/_handlers/realtime-stream.handler.ts`

**Status:** Not in repo. SFU protobuf `Packet` ingress per `02-mira-session-do.md`.

```typescript
import type { MiraSession } from '../mira-session.agent'

export async function handleRealtimeStream(
	request: Request,
	agent: MiraSession,
	mediaKind: 'audio' | 'video',
): Promise<Response> {
	if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
		return new Response('Expected WebSocket', { status: 426 })
	}

	const token = new URL(request.url).searchParams.get('token')
	if (!token) return new Response('Unauthorized', { status: 401 })
	// verifyAdapterToken(token, mediaKind, agent.sessionState?.sessionId)

	const pair = new WebSocketPair()
	const [client, server] = Object.values(pair) as [WebSocket, WebSocket]
	agent.ctx.acceptWebSocket(server, [`realtime:${mediaKind}`])
	server.serializeAttachment({ kind: 'realtime', mediaKind })

	const state = agent.sessionState
	if (state) {
		if (mediaKind === 'audio') state.realtimeAudioWs = server
		else state.realtimeVideoWs = server
	}

	return new Response(null, { status: 101, webSocket: client })
}
