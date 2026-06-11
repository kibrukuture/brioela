# Draft: _helpers/baseline.helper.ts

Target: `tools/brioela-lexicon-guard/_helpers/baseline.helper.ts`

```typescript
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { lexiconViolationKey, type LexiconViolation } from '../_types'

type BaselineFile = { version: 2; keys: string[] }

const baselinePath = (root: string) => join(root, 'tools/brioela-lexicon-guard/lexicon.guard.baseline.json')

export async function loadBaseline(workspaceRoot: string): Promise<Set<string>> {
	try {
		const raw = await readFile(baselinePath(workspaceRoot), 'utf8')
		const parsed = JSON.parse(raw) as BaselineFile
		if (parsed.version !== 2) return new Set()
		return new Set(parsed.keys)
	} catch {
		return new Set()
	}
}

export async function writeBaseline(workspaceRoot: string, violations: LexiconViolation[]): Promise<void> {
	const file: BaselineFile = { version: 2, keys: violations.map(lexiconViolationKey).sort() }
	await writeFile(baselinePath(workspaceRoot), `${JSON.stringify(file, null, 2)}\n`)
}

export function filterBaselineViolations(
	violations: LexiconViolation[],
	baseline: Set<string>,
): LexiconViolation[] {
	return violations.filter((v) => !baseline.has(lexiconViolationKey(v)))
}
```
