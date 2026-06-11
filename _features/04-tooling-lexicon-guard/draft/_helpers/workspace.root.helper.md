# Draft: _helpers/workspace.root.helper.ts

Target: `tools/brioela-lexicon-guard/_helpers/workspace.root.helper.ts`

```typescript
import { realpathSync } from 'node:fs'
import { cwd, env } from 'node:process'

export function resolveWorkspaceRoot(): string {
  return realpathSync(env.BRIOELA_WORKSPACE_ROOT ?? cwd())
}
```
