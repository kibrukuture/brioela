# Draft: _helpers/append.gate.event.helper.ts

Target: `tools/brioela-reading-gate/_helpers/append.gate.event.helper.ts`

```typescript
import { appendFileSync } from 'node:fs'
import dayjs from 'dayjs'
import { gateEventsLogPath } from './gate.config.helper'

export function appendGateEvent(text: string): void {
  const whenText = dayjs().format('YYYY-MM-DD HH:mm:ss')
  appendFileSync(gateEventsLogPath, `[${whenText}] ${text}\n`, { mode: 0o644 })
}
```
