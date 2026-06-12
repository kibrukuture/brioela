# Draft: chat.entrypoint.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/chat.entrypoint.handler.ts`

**Gap (feature 20):** Top-level orchestrator — session resolve, compression gate, delegate turn loop, optional close.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { openSession } from '@/agents/brain/_handlers/open.session.handler'
import { closeSession } from '@/agents/brain/_handlers/close.session.handler'
import {
	checkCompressionNeeded,
	runCompression,
} from '@/agents/brain/_handlers/compress.session.handler'
import { runChatTurn } from '@/agents/brain/_handlers/run.chat.turn.handler'
import { readUserSession } from '@/agents/brain/_repositories'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { ChatTurnInput, ChatTurnResponse } from '@/agents/brain/_rpc/chat.rpc'
import type { BrioelaBrainEnv } from '@/agents/brain/brioela.brain.agent'

export type HandleChatMessageInput = {
	database: BrainDatabase
	env: BrioelaBrainEnv
	userId: string
	wake: AlarmWakeCallbacks
	waitUntil: (promise: Promise<void>) => void
	input: ChatTurnInput
}

export async function handleChatMessage(
	ctx: HandleChatMessageInput,
): Promise<ChatTurnResponse> {
	const { database, env, userId, wake, waitUntil, input } = ctx

	let sessionId = input.sessionId
	let systemPrompt: string

	if (sessionId === undefined) {
		const opened = await openSession(database, userId, {
			sessionType: 'chat',
			model: 'claude-sonnet-4-6',
		})
		sessionId = opened.sessionId
		systemPrompt = opened.systemPrompt
	} else {
		const session = readUserSession(database, sessionId)
		if (session === null || session.status !== 'active' || session.sessionType !== 'chat') {
			throw new Error('Invalid or inactive chat session')
		}
		systemPrompt = session.systemPromptCache ?? (await openSession(database, userId, {
			sessionType: 'chat',
			model: session.model,
		})).systemPrompt
	}

	if (await checkCompressionNeeded(database, sessionId)) {
		const compressed = await runCompression(database, env, sessionId, userId)
		sessionId = compressed.newSessionId
		systemPrompt = `${systemPrompt}\n\n---\n\n${compressed.continuationContext}`
	}

	const turnResult = await runChatTurn({
		database,
		env,
		userId,
		sessionId,
		systemPrompt,
		userMessage: input.message,
		wake,
		waitUntil,
	})

	if (input.closeAfterTurn === true) {
		await closeSession(database, sessionId, {
			endReason: 'completed',
			outcomeSummary: turnResult.assistantMessage,
		})
	}

	return {
		sessionId,
		assistantMessage: turnResult.assistantMessage,
	}
}
```

**Note:** `systemPromptCache` on session row is optional optimization — if not in schema, reload via **15** or agent_state key.
