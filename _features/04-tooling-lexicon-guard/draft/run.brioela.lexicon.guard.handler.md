# Draft: run.brioela.lexicon.guard.handler.ts

Target: `tools/brioela-lexicon-guard/run.brioela.lexicon.guard.handler.ts`

```typescript
#!/usr/bin/env bun

import { exit } from 'node:process'
import { formatLexiconViolations, resolveWorkspaceRoot, runLexiconGuard } from './_helpers'
import { watchWorkspaceLexicon } from './_watch'

const args = new Set(process.argv.slice(2))
const workspaceRoot = resolveWorkspaceRoot()

if (args.has('--watch')) {
  watchWorkspaceLexicon(workspaceRoot)
} else if (args.has('--update-baseline')) {
  await runLexiconGuard(workspaceRoot, 'update-baseline')
  console.log('Brioela Lexicon Guard: baseline updated.')
} else {
  const violations = await runLexiconGuard(workspaceRoot, 'check')
  if (violations.length > 0) {
    console.error(formatLexiconViolations(violations))
    exit(1)
  }

  console.log('Brioela Lexicon Guard: clean.')
}
```
