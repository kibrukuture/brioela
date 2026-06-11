# Draft: check.brain.migration.manifest.handler.ts

Target: `tools/brioela-brain-migration-manifest/check.brain.migration.manifest.handler.ts`

```ts
import { readFile } from 'node:fs/promises'
import { StaleBrainMigrationManifestError } from './_types'
import { createBrainMigrationManifest } from './_helpers/create.brain.migration.manifest.helper'
import {
	brainMigrationManifestPath,
	resolveWorkspacePath,
} from './_helpers/brain.migration.manifest.paths.helper'
import { readWorkspaceRoot } from './_helpers/workspace.root.helper'

const workspaceRoot = readWorkspaceRoot()
const expectedManifest = await createBrainMigrationManifest(workspaceRoot)
const currentManifest = await readFile(resolveWorkspacePath(workspaceRoot, brainMigrationManifestPath), 'utf8')

if (currentManifest !== expectedManifest) {
	throw new StaleBrainMigrationManifestError(brainMigrationManifestPath)
}

console.log('Brain migration manifest: clean.')
```
