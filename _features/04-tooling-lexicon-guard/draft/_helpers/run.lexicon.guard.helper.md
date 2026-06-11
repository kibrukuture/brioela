# Draft: _helpers/run.lexicon.guard.helper.ts

Target: `tools/brioela-lexicon-guard/_helpers/run.lexicon.guard.helper.ts`

```typescript
import { readFile } from 'node:fs/promises'
import ts from 'typescript'
import { filterBaselineViolations, loadBaseline, walkTypeScriptFiles, writeBaseline } from './index'
import { enforceIdentifierLexiconPolicy, type LexiconPolicy } from '../_policies'
import type { LexiconViolation } from '../_types'

export type LexiconGuardMode = 'check' | 'update-baseline'

const policies: LexiconPolicy[] = [
  enforceIdentifierLexiconPolicy,
]

export async function runLexiconGuard(workspaceRoot: string, mode: LexiconGuardMode): Promise<LexiconViolation[]> {
  const files = await walkTypeScriptFiles(workspaceRoot)
  const allViolations: LexiconViolation[] = []

  for (const file of files) {
    const text = await readFile(file.absolutePath, 'utf8')
    const sourceFile = ts.createSourceFile(file.absolutePath, text, ts.ScriptTarget.Latest, true, scriptKindForPath(file.repoPath))

    for (const policy of policies) {
      allViolations.push(...policy({ repoPath: file.repoPath, sourceFile }))
    }
  }

  if (mode === 'update-baseline') {
    await writeBaseline(workspaceRoot, allViolations)
    return []
  }

  const baseline = await loadBaseline(workspaceRoot)
  return filterBaselineViolations(allViolations, baseline)
}

function scriptKindForPath(path: string): ts.ScriptKind {
  return path.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
}
```
