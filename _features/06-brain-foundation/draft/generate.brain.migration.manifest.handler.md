# Draft: generate.brain.migration.manifest.handler.ts

Target: `tools/brioela-brain-migration-manifest/generate.brain.migration.manifest.handler.ts`

```ts
import { writeFile } from 'node:fs/promises'
import { createBrainMigrationManifest } from './_helpers/create.brain.migration.manifest.helper'
import {
	brainMigrationManifestPath,
	resolveWorkspacePath,
} from './_helpers/brain.migration.manifest.paths.helper'
import { readWorkspaceRoot } from './_helpers/workspace.root.helper'

const workspaceRoot = readWorkspaceRoot()
const manifest = await createBrainMigrationManifest(workspaceRoot)

await writeFile(resolveWorkspacePath(workspaceRoot, brainMigrationManifestPath), manifest)
console.log(`Generated ${brainMigrationManifestPath}`)
```
