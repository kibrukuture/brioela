# Draft: compression.thresholds.constant.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_constants/compression.thresholds.constant.ts`

**Gap (feature 13):** Central threshold map used by `checkCompressionNeeded`. Values from **17** — no invented numbers.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainSession } from '@/agents/brain/_schemas'

/** Session types that participate in compression. alarm/background are excluded. */
export type CompressibleSessionType = Extract<BrainSession['sessionType'], 'chat' | 'cooking'>

export const COMPRESSION_TURN_THRESHOLD: Record<CompressibleSessionType, number> = {
	chat: 40,
	cooking: 80,
}

export const COMPRESSION_TOKEN_THRESHOLD: Record<CompressibleSessionType, number> = {
	chat: 60_000,
	cooking: 100_000,
}

export const COMPRESSION_VERBATIM_TAIL_TURN_COUNT = 10

export function isCompressibleSessionType(
	sessionType: BrainSession['sessionType'],
): sessionType is CompressibleSessionType {
	return sessionType === 'chat' || sessionType === 'cooking'
}

export function isCompressionThresholdMet(input: {
	sessionType: BrainSession['sessionType']
	turnCount: number
	inputTokens: number
}): boolean {
	if (!isCompressibleSessionType(input.sessionType)) {
		return false
	}
	return (
		input.turnCount >= COMPRESSION_TURN_THRESHOLD[input.sessionType] ||
		input.inputTokens >= COMPRESSION_TOKEN_THRESHOLD[input.sessionType]
	)
}
```

Source: `implementable-specs/17-session-lifecycle.md` lines 37–68, 241.
