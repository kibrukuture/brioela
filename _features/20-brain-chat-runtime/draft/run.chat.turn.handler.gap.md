# Draft: run.chat.turn.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/run.chat.turn.handler.ts`

**Gap (feature 20):** Single chat turn — append user, `streamText` tool loop, append assistant, update counters.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { anthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { appendSessionTurn } from '@/agents/brain/_handlers/append.session.turn.handler'
import { incrementSessionCounters } from '@/agents/brain/_repositories'
import { mapSessionTypeToKind } from '@/agents/brain/_helpers/map.session.kind.helper'
import { turnsToCoreMessages } from '@/agents/brain/_helpers/turns.to.core.messages.helper'
import { createSessionWebSearchCounter } from '@/agents/brain/_helpers/session.web.search.counter.helper'
import { getBrainTools } from '@/agents/brain/_tools/get.brain.tools'
import { readSessionTurnsOrdered, readUserSession } from '@/agents/brain/_repositories'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrioelaBrainEnv } from '@/agents/brain/brioela.brain.agent'

const MAX_TOOL_STEPS = 15

export type RunChatTurnInput = {
	database: BrainDatabase
	env: BrioelaBrainEnv
	userId: string
	sessionId: string
	systemPrompt: string
	userMessage: string
	wake: AlarmWakeCallbacks
	waitUntil: (promise: Promise<void>) => void
}

export type RunChatTurnResult = {
	assistantMessage: string
}

export async function runChatTurn(ctx: RunChatTurnInput): Promise<RunChatTurnResult> {
	const { database, env, userId, sessionId, systemPrompt, userMessage, wake, waitUntil } = ctx

	const session = readUserSession(database, sessionId)
	if (session === null) {
		throw new Error('Session not found')
	}

	await appendSessionTurn(database, {
		sessionId,
		userId,
		role: 'user',
		content: userMessage,
	})

	const history = readSessionTurnsOrdered(database, sessionId)
	const messages = turnsToCoreMessages(history)

	const kind = mapSessionTypeToKind(session.sessionType, session.alarmType)
	const webSearchCounter = createSessionWebSearchCounter()

	const tools = getBrainTools(
		database,
		userId,
		kind,
		sessionId,
		waitUntil,
		wake,
		env,
		webSearchCounter,
	)

	let assistantText = ''

	const result = streamText({
		model: anthropic('claude-sonnet-4-6'),
		system: systemPrompt,
		messages,
		tools,
		maxSteps: MAX_TOOL_STEPS,
		onStepFinish: async ({ text, toolCalls, toolResults, usage }) => {
			if (text.length > 0) {
				assistantText = text
			}

			for (const toolCall of toolCalls) {
				await appendSessionTurn(database, {
					sessionId,
					userId,
					role: 'tool_call',
					content: `Called ${toolCall.toolName}`,
					toolName: toolCall.toolName,
					toolInput: JSON.stringify(toolCall.args),
					inputTokens: usage?.promptTokens ?? 0,
					outputTokens: 0,
				})
			}

			for (const toolResult of toolResults) {
				await appendSessionTurn(database, {
					sessionId,
					userId,
					role: 'tool_result',
					content: typeof toolResult.result === 'string' ? toolResult.result : JSON.stringify(toolResult.result),
					toolName: toolResult.toolName,
					toolResult: JSON.stringify(toolResult.result),
					inputTokens: 0,
					outputTokens: usage?.completionTokens ?? 0,
				})
			}

			incrementSessionCounters(database, sessionId, {
				inputTokens: usage?.promptTokens ?? 0,
				outputTokens: usage?.completionTokens ?? 0,
				cacheReadTokens: 0,
				cacheWriteTokens: 0,
				turnDelta: 0,
			})
		},
	})

	await result.text
	const finalText = assistantText.length > 0 ? assistantText : await result.text

	await appendSessionTurn(database, {
		sessionId,
		userId,
		role: 'assistant',
		content: finalText,
	})

	incrementSessionCounters(database, sessionId, {
		inputTokens: 0,
		outputTokens: 0,
		cacheReadTokens: 0,
		cacheWriteTokens: 0,
		turnDelta: 1,
	})

	return { assistantMessage: finalText }
}
```

**Note:** Exact AI SDK v4 `onStepFinish` / `usage` field names must match installed `ai` package at implementation time — verify against current docs before ship.
