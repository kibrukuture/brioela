# Draft: workspace.root.helper.ts

Target: `tools/brioela-brain-migration-manifest/_helpers/workspace.root.helper.ts`

```ts
import { resolve } from 'node:path'
import { cwd, env } from 'node:process'

export function readWorkspaceRoot(): string {
	return resolve(cwd(), env.BRIOELA_WORKSPACE_ROOT ?? '.')
}
```
