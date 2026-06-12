# Draft: append.session.turn.handler.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/append.session.turn.handler.ts`

**Gap (feature 20):** Immutable turn insert with monotonic `turn_number` via agent_state.

---

## Intended production file (full snapshot — not yet created)

```typescript
import { createId } from '@brioela/shared/_ids'
import { insertSessionTurn, readAgentStateValue, upsertAgentStateValue } from '@/agents/brain/_repositories'
import type { BrainDatabase } from '@/agents/brain/_database'
import type { SessionTurnRole } from '@/agents/brain/_schemas'
import { readCurrentEpochMs } from '@/time/_helpers'

export type AppendSessionTurnInput = {
	sessionId: string
	userId: string
	role: SessionTurnRole
	content: string
	toolName?: string
	toolInput?: string
	toolResult?: string
	inputTokens?: number
	outputTokens?: number
}

export async function appendSessionTurn(
	database: BrainDatabase,
	input: AppendSessionTurnInput,
): Promise<{ turnId: string; turnNumber: number }> {
	const counterKey = `turn_counter.${input.sessionId}`
	const previous = readAgentStateValue(database, counterKey)
	const turnNumber = (previous === null ? 0 : Number.parseInt(previous, 10)) + 1

	upsertAgentStateValue(database, counterKey, String(turnNumber))

	const turnId = createId()
	const now = readCurrentEpochMs()

	insertSessionTurn(database, {
		id: turnId,
		sessionId: input.sessionId,
		userId: input.userId,
		turnNumber,
		role: input.role,
		content: input.content,
		toolName: input.toolName ?? null,
		toolInput: input.toolInput ?? null,
		toolResult: input.toolResult ?? null,
		inputTokens: input.inputTokens ?? 0,
		outputTokens: input.outputTokens ?? 0,
		createdAt: now,
	})

	return { turnId, turnNumber }
}
```

Per **08-session-turns.md**: never use `MAX(turn_number)`; turns are insert-only.
