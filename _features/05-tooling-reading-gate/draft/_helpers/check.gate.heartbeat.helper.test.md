# Draft: _helpers/check.gate.heartbeat.helper.test.ts

Target: `tools/brioela-reading-gate/_helpers/check.gate.heartbeat.helper.test.ts`

```typescript
import { describe, expect, test } from 'bun:test'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkGateHeartbeat } from './check.gate.heartbeat.helper'
import { createGateKey } from './create.gate.key.helper'
import { readCurrentEpochMs } from './read.current.epoch.ms.helper'
import { signGateText } from './sign.gate.text.helper'
import { writeGateHeartbeat } from './write.gate.heartbeat.helper'

describe('gate heartbeat', () => {
  test('write then check round trip', () => {
    const folder = mkdtempSync(join(tmpdir(), 'gate-beat-'))
    const privatePath = join(folder, 'gate.key')
    const publicPath = join(folder, 'gate.pub')
    const heartbeatPath = join(folder, 'heartbeat.txt')

    createGateKey(privatePath, publicPath)
    writeGateHeartbeat(heartbeatPath, privatePath)

    expect(checkGateHeartbeat(heartbeatPath, publicPath)).toBe(true)
  })

  test('stale and forged heartbeats are rejected, missing file fails closed', () => {
    const folder = mkdtempSync(join(tmpdir(), 'gate-beat-'))
    const privatePath = join(folder, 'gate.key')
    const publicPath = join(folder, 'gate.pub')
    const heartbeatPath = join(folder, 'heartbeat.txt')

    createGateKey(privatePath, publicPath)

    const staleText = String(readCurrentEpochMs() - 60_000)
    writeFileSync(heartbeatPath, `${staleText} ${signGateText(staleText, privatePath)}\n`)
    expect(checkGateHeartbeat(heartbeatPath, publicPath)).toBe(false)

    const nowText = String(readCurrentEpochMs())
    writeFileSync(heartbeatPath, `${nowText} ${'A'.repeat(86)}==\n`)
    expect(checkGateHeartbeat(heartbeatPath, publicPath)).toBe(false)

    expect(checkGateHeartbeat(join(folder, 'missing.txt'), publicPath)).toBe(false)
  })
})
```
