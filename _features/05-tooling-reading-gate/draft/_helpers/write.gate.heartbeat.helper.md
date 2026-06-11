# Draft: _helpers/write.gate.heartbeat.helper.ts

Target: `tools/brioela-reading-gate/_helpers/write.gate.heartbeat.helper.ts`

```typescript
import { writeFileSync } from 'node:fs'
import { gateHeartbeatPath, gatePrivateKeyPath } from './gate.config.helper'
import { readCurrentEpochMs } from './read.current.epoch.ms.helper'
import { signGateText } from './sign.gate.text.helper'

export function writeGateHeartbeat(heartbeatPath = gateHeartbeatPath, keyPath = gatePrivateKeyPath): void {
  const nowText = String(readCurrentEpochMs())
  writeFileSync(heartbeatPath, `${nowText} ${signGateText(nowText, keyPath)}\n`, { mode: 0o644 })
}
```
