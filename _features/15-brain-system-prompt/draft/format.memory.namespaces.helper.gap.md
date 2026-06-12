# Draft: format.memory.namespaces.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/format.memory.namespaces.helper.ts`

**Gap (feature 15):** Block 8 formatter — namespace catalog for write_user_memory consistency.

---

## Intended production file (full snapshot — not yet created)

```typescript
export function formatMemoryNamespaces(namespaces: string[]): string {
	const sorted = [...namespaces].sort((a, b) => a.localeCompare(b))
	return [
		'## Memory namespaces',
		'Existing active namespaces — reuse before inventing new ones.',
		'',
		sorted.join(', '),
	].join('\n')
}
```

Source: `implementable-specs/brioela-tools/16-load-session-context.md` § Active Memory Namespaces; `implementable-specs/02-user-memory.md`.
