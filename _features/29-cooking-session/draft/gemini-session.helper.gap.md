# Gap snapshot: gemini-session.helper.ts

Target: `backend/src/agents/mira/_helpers/gemini-session.helper.ts`

**Status:** Not in repo. From `build-guide/08-cooking-session/03-gemini-live-session.md`. Uses AUDIO+TEXT per `07-transcript-storage.md`.

```typescript
import type { MiraSession } from '../mira-session.agent'
import type { UserContext } from '../_types/user.context.type'
import { COOKING_TOOL_DECLARATIONS } from '../_constants/cooking.tool.declarations'
import { buildSystemInstruction } from './build-system-instruction.helper'
import { handleGeminiMessage } from './handle-gemini-message.helper'
import { proactiveGeminiReconnect } from './proactive-gemini-reconnect.helper'

const GEMINI_WS_ENDPOINT = (apiKey: string) =>
	`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`

export function buildSetupMessage(context: UserContext): object {
	return {
		setup: {
			model: 'models/gemini-3.1-flash-live-preview',
			generation_config: {
				response_modalities: ['AUDIO', 'TEXT'],
				speech_config: {
					voice_config: {
						prebuilt_voice_config: { voice_name: 'Charon' },
					},
				},
			},
			system_instruction: {
				parts: [{ text: buildSystemInstruction(context) }],
			},
			tools: [{ function_declarations: COOKING_TOOL_DECLARATIONS }],
		},
	}
}

export async function openGeminiSession(context: UserContext, miraSession: MiraSession): Promise<void> {
	const state = miraSession.sessionState
	if (!state) throw new Error('session_not_initialized')

	const ws = new WebSocket(GEMINI_WS_ENDPOINT(miraSession.env.GEMINI_API_KEY))

	ws.addEventListener('open', () => {
		ws.send(JSON.stringify(buildSetupMessage(context)))
	})

	ws.addEventListener('message', (event) => {
		handleGeminiMessage(JSON.parse(event.data as string), miraSession)
	})

	ws.addEventListener('close', (event) => {
		void onGeminiClose(event.code, event.reason, miraSession)
	})

	state.geminiWs = ws
	state.geminiReconnectTimer = setTimeout(() => {
		if (state.status === 'active') void proactiveGeminiReconnect(miraSession)
	}, 90_000)
}

async function onGeminiClose(code: number, reason: string, miraSession: MiraSession): Promise<void> {
	const state = miraSession.sessionState
	if (!state || state.status === 'ending') return
	state.geminiWs = null
	if (state.status === 'active' || state.status === 'gemini_reconnecting') {
		state.status = 'gemini_reconnecting'
		await proactiveGeminiReconnect(miraSession)
	}
}
