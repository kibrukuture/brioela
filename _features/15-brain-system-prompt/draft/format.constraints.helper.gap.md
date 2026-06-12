# Draft: format.constraints.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/format.constraints.helper.ts`

**Gap (feature 15):** Block 2 formatter. Prefer non-rejected rows per `06-constraints.md` — not build-guide `confirmed`-only.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainConstraint } from '@/agents/brain/_schemas'

function statusLabel(status: BrainConstraint['status']): string {
	switch (status) {
		case 'confirmed':
		case 'auto_confirmed':
			return status === 'auto_confirmed' ? 'AUTO_CONFIRMED' : 'CONFIRMED'
		case 'proposed':
			return 'PROPOSED'
		default:
			return status.toUpperCase()
	}
}

function sortConstraints(rows: BrainConstraint[]): BrainConstraint[] {
	const typeRank: Record<BrainConstraint['constraintType'], number> = {
		hard_allergy: 0,
		dietary_identity: 1,
		intolerance: 2,
		boycott: 3,
		dislike: 4,
	}
	return [...rows].sort((a, b) => {
		const rankDiff = typeRank[a.constraintType] - typeRank[b.constraintType]
		if (rankDiff !== 0) return rankDiff
		return a.proposedAt - b.proposedAt
	})
}

export function formatConstraints(rows: BrainConstraint[]): string {
	const lines: string[] = [
		'## Constraints',
		'Safety and dietary restrictions. Proposed items are not yet verified — warn; confirmed and auto_confirmed items are binding.',
		'',
	]

	for (const row of sortConstraints(rows)) {
		const label = statusLabel(row.status)
		const notes = row.notes ? ` — ${row.notes}` : ''
		lines.push(
			`- [${label}] ${row.constraintType} / ${row.entityKind} / ${row.entityValue}${notes}`,
		)
	}

	return lines.join('\n')
}
```

Source: `implementable-specs/06-constraints.md`; `_features/07-brain-constraint-tools/spec.md`.
