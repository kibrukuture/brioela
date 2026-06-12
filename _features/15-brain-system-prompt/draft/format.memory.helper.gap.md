# Draft: format.memory.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/format.memory.helper.ts`

**Gap (feature 15):** Block 4 formatter — groups entries by namespace.

---

## Intended production file (full snapshot — not yet created)

```typescript
import type { BrainUserMemory } from '@/agents/brain/_schemas'

function groupByNamespace(entries: BrainUserMemory[]): Map<string, BrainUserMemory[]> {
	const grouped = new Map<string, BrainUserMemory[]>()
	for (const entry of entries) {
		const bucket = grouped.get(entry.namespace)
		if (bucket) {
			bucket.push(entry)
		} else {
			grouped.set(entry.namespace, [entry])
		}
	}
	return grouped
}

export function formatMemory(entries: BrainUserMemory[]): string {
	const lines: string[] = [
		'## User memory',
		'Active facts for relevant namespaces. Extend existing namespaces before creating new ones.',
		'',
	]

	const grouped = groupByNamespace(entries)
	const namespaceOrder = [...grouped.keys()].sort()

	for (const namespace of namespaceOrder) {
		const bucket = grouped.get(namespace)
		if (!bucket) continue
		lines.push(`### ${namespace}`)
		const sorted = [...bucket].sort((a, b) => a.key.localeCompare(b.key))
		for (const row of sorted) {
			lines.push(
				`- ${row.key} → ${row.value} (confidence ${row.confidence}, ${row.source})`,
			)
		}
		lines.push('')
	}

	return lines.join('\n').trimEnd()
}
```

Source: `implementable-specs/02-user-memory.md`; `build-guide/05-brain/03-session-lifecycle.md`.
