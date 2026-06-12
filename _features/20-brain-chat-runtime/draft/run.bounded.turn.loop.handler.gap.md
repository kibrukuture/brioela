# Draft: run.bounded.turn.loop.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/run.bounded.turn.loop.handler.ts`

**Gap (feature 20):** Shared non-streaming loop for **14** inline alarm sessions — `generateText`, restricted tools, hard turn cap.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { anthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import { openSession } from '@/agents/brain/_handlers/open.session.handler'
import { closeSession } from '@/agents/brain/_handlers/close.session.handler'
import { runChatTurn } from '@/agents/brain/_handlers/run.chat.turn.handler'
import type { AlarmWakeCallbacks } from '@/agents/brain/_tools/_executables/schedule.user.alarm.executable'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { BrioelaBrainEnv } from '@/agents/brain/brioela.brain.agent'

export type RunBoundedTurnLoopInput = {
	database: BrainDatabase
	env: BrioelaBrainEnv
	userId: string
	alarmType: string
	systemPrompt: string
	seedMessage: string
	maxTurns?: number
	wake: AlarmWakeCallbacks
	waitUntil: (promise: Promise<void>) => void
}

export type RunBoundedTurnLoopResult = {
	sessionId: string
	outcomeSummary: string
}

export async function runBoundedTurnLoop(
	ctx: RunBoundedTurnLoopInput,
): Promise<RunBoundedTurnLoopResult> {
	const maxTurns = ctx.maxTurns ?? 3

	const opened = await openSession(ctx.database, ctx.userId, {
		sessionType: 'alarm',
		model: 'claude-sonnet-4-6',
		alarmType: ctx.alarmType,
	})

	let sessionId = opened.sessionId
	let lastAssistant = ''

	for (let turn = 0; turn < maxTurns; turn += 1) {
		const result = await runChatTurn({
			database: ctx.database,
			env: ctx.env,
			userId: ctx.userId,
			sessionId,
			systemPrompt: ctx.systemPrompt,
			userMessage: turn === 0 ? ctx.seedMessage : '[continue alarm work]',
			wake: ctx.wake,
			waitUntil: ctx.waitUntil,
		})
		lastAssistant = result.assistantMessage
	}

	const summaryResult = await generateText({
		model: anthropic('claude-haiku-4-5-20251001'),
		system: 'Write a one-paragraph outcome summary for this alarm session.',
		prompt: lastAssistant,
	})

	const outcomeSummary = summaryResult.text

	await closeSession(ctx.database, sessionId, {
		endReason: 'completed',
		outcomeSummary,
	})

	return { sessionId, outcomeSummary }
}
```

**14** feature handlers supply `systemPrompt` and `seedMessage`; this shell owns open → loop → summarize → close.
