# Draft: _helpers/repair.launchd.plist.helper.ts

Target: `tools/brioela-lexicon-guard/_helpers/repair.launchd.plist.helper.ts`

```typescript
import { spawnSync } from 'node:child_process'
import { chmod } from 'node:fs/promises'

export type LaunchdPlistRepairReport = {
  chmodApplied: boolean
  removedAttributes: string[]
  lintOk: boolean
  lintText: string
}

const removableExtendedAttributes = [
  'com.apple.quarantine',
  'com.apple.provenance',
] as const

export async function repairLaunchdPlist(plistPath: string): Promise<LaunchdPlistRepairReport> {
  await chmod(plistPath, 0o644)

  const removedAttributes: string[] = []

  for (const attribute of removableExtendedAttributes) {
    const result = spawnSync('xattr', ['-d', attribute, plistPath], { encoding: 'utf8' })
    if (result.status === 0) removedAttributes.push(attribute)
  }

  const lint = spawnSync('plutil', ['-lint', plistPath], { encoding: 'utf8' })
  const lintText = [lint.stdout, lint.stderr].filter(Boolean).join('\n').trim()

  return {
    chmodApplied: true,
    removedAttributes,
    lintOk: lint.status === 0,
    lintText,
  }
}
```
