# Draft: should.suppress.share.prompt.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/viral.sharing/should.suppress.share.prompt.helper.ts`

**Gap (feature 51):** Two dismissals per week suppression rule.

**Source:** `build-guide/24-viral-sharing/06-growth-metrics-and-suppression.md`

---

```typescript
import type { BrainSharePromptSuppression } from '@/agents/brain/_schemas/share.prompt.suppression.schema'
import {
	SHARE_PROMPT_DISMISS_LIMIT_7D,
	SHARE_PROMPT_SUPPRESSION_DAYS,
} from '@brioela/shared/constants/viral.sharing/share.moment.threshold.constant'

export function shouldSuppressSharePrompt(
	row: BrainSharePromptSuppression | null,
	nowMs: number,
): boolean {
	if (!row) return false
	if (row.suppressedUntil != null && nowMs < row.suppressedUntil) return true
	return row.dismissCount7d >= SHARE_PROMPT_DISMISS_LIMIT_7D
}

export function nextSuppressionAfterDismiss(
	row: BrainSharePromptSuppression | null,
	nowMs: number,
): BrainSharePromptSuppression {
	const windowMs = SHARE_PROMPT_SUPPRESSION_DAYS * 24 * 60 * 60 * 1000
	const inWindow =
		row != null && nowMs - row.windowStartedAt < windowMs
	const dismissCount7d = inWindow ? (row?.dismissCount7d ?? 0) + 1 : 1
	const windowStartedAt = inWindow ? (row?.windowStartedAt ?? nowMs) : nowMs
	const suppressedUntil =
		dismissCount7d >= SHARE_PROMPT_DISMISS_LIMIT_7D
			? windowStartedAt + windowMs
			: null

	return {
		userId: row?.userId ?? '',
		dismissCount7d,
		windowStartedAt,
		lastDismissedAt: nowMs,
		suppressedUntil,
	}
}
```
