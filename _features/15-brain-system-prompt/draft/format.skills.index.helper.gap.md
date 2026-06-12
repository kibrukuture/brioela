# Draft: format.skills.index.helper.ts (gap — file does not exist)

Target: `backend/src/agents/brain/_helpers/format.skills.index.helper.ts`

**Gap (feature 15):** Block 5 formatter — index-then-load pattern.

---

## Intended production file (full snapshot — not yet created)

```typescript
type SkillIndexRow = {
	name: string
	description: string
}

export function formatSkillsIndex(rows: SkillIndexRow[]): string {
	const lines: string[] = [
		'## Available skills',
		'Before replying, scan this list. If one matches your current task, call view_user_skill(name) first.',
		'',
	]

	for (const row of rows) {
		lines.push(`- ${row.name}: ${row.description}`)
	}

	return lines.join('\n')
}
```

Source: `implementable-specs/04-skills.md`; `brioela-specs/09-per-user-brain.md` lines 230–241.
