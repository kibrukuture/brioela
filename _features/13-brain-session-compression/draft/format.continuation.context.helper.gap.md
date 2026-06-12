# Draft: format.continuation.context.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_handlers/format.continuation.context.helper.ts`

**Gap (feature 13):** Builds the `[CONTINUATION CONTEXT]` prompt block injected after standard system prompt blocks (**15**) when a session was just compressed.

**20** or **15** caller appends this to in-memory prompt / message history — user must not see a compression announcement.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { CompressionSummary } from '@/agents/brain/_schemas/compression.summary.schema'
import type { BrainSessionTurn } from '@/agents/brain/_schemas'

type FormatContinuationContextInput = {
	summary: CompressionSummary
	recentTurns: BrainSessionTurn[]
}

function formatTurnLine(turn: BrainSessionTurn): string {
	const roleLabel = turn.role.replace('_', ' ')
	return `turn ${turn.turnNumber} [${roleLabel}]: ${turn.content}`
}

export function formatContinuationContext(input: FormatContinuationContextInput): string {
	const { summary, recentTurns } = input
	const sorted = [...recentTurns].sort((a, b) => a.turnNumber - b.turnNumber)

	const lines: string[] = [
		'[CONTINUATION CONTEXT — session was compressed]',
		'Earlier in this session (summary):',
		`  Intent:       ${summary.intent}`,
		`  Accomplished: ${summary.accomplished}`,
		`  Decisions:    ${summary.decisions}`,
		`  Continuing:   ${summary.continuing}`,
		'',
		'[Last 10 turns verbatim from previous session]',
		...sorted.map(formatTurnLine),
		'',
		'[Current session continues from here]',
	]

	return lines.join('\n')
}
```

Source: `implementable-specs/17-session-lifecycle.md` lines 215–237.

**Note:** Agent must not tell the user compression occurred — enforced in identity / turn instructions (**10**, **20**), not in this helper.
