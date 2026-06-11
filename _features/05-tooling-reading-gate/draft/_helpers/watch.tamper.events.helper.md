# Draft: _helpers/watch.tamper.events.helper.ts

Target: `tools/brioela-reading-gate/_helpers/watch.tamper.events.helper.ts`

```typescript
import watcher from '@parcel/watcher'
import { appendFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import dayjs from 'dayjs'
import { appendGateEvent } from './append.gate.event.helper'
import { gateTamperPath, guardWatchList } from './gate.config.helper'
import { writeWatchText } from '../gate.state.store'

const ignoredParts = ['node_modules', '.git']

export function watchTamperEvents(workspaceRoot: string): void {
  for (const folder of guardWatchList) {
    const folderPath = join(workspaceRoot, folder)
    if (!existsSync(folderPath)) continue

    watcher
      .subscribe(folderPath, (tamperError, events) => {
        if (tamperError) return
        for (const entry of events) {
          if (ignoredParts.some((part) => entry.path.includes(`/${part}/`))) continue
          const pathText = entry.path.startsWith(`${workspaceRoot}/`) ? entry.path.slice(workspaceRoot.length + 1) : entry.path
          const whenText = dayjs().format('YYYY-MM-DD HH:mm:ss')
          appendFileSync(gateTamperPath, `[${whenText}] ${entry.type} ${pathText}\n`, { mode: 0o644 })
          appendGateEvent(`⛔ TAMPER ${entry.type} ${pathText}`)
          writeWatchText(`⛔ TAMPER — guard machinery changed: ${entry.type} ${pathText}\n   Board is frozen red. Only the human clears it: sudo bun run gate:tamper:clear\n`)
        }
      }, { ignore: ignoredParts.map((part) => `**/${part}/**`) })
      .catch(() => {
        appendGateEvent(`tamper watch mount failed for ${folder}`)
      })
  }
}
```
