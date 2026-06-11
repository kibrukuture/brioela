# Draft: _helpers/gate.config.helper.ts

Target: `tools/brioela-reading-gate/_helpers/gate.config.helper.ts`

```typescript
import { join } from 'node:path'

export const gateStateFolder = '/var/brioela-gate'

export const gateSocketPath = join(gateStateFolder, 'gate.sock')
export const gatePidPath = join(gateStateFolder, 'gate.pid')

export const gateLogFolder = join(gateStateFolder, 'logs')
export const gateRunLogPath = join(gateLogFolder, 'gate.out.log')
export const gateErrorLogPath = join(gateLogFolder, 'gate.err.log')
export const gateEventsLogPath = join(gateLogFolder, 'gate.events.log')

export const manifestFolder = join(gateStateFolder, 'manifest')
export const manifestPath = join(manifestFolder, 'manifest.tsv')

export const gateKeyFolder = join(gateStateFolder, 'keys')
export const gatePrivateKeyPath = join(gateKeyFolder, 'gate.key')
// the public key must NOT live inside the 700 keys folder — every user-side
// signature check (pre-commit receipts, heartbeat) needs to read it
export const gatePublicKeyPath = join(gateStateFolder, 'gate.pub')

export const gateHeartbeatPath = join(gateStateFolder, 'heartbeat.txt')
export const gateTamperPath = join(gateStateFolder, 'tamper.txt')
export const gateReceiptLogPath = join(gateLogFolder, 'gate.receipts.log')

export const redFlagFileName = 'GUARD-RED.md'

export const readTtlMs = 240 * 60 * 1000
export const heartbeatTtlMs = 30 * 1000

export const guardWatchList = [
  'tools/brioela-guard',
  'tools/brioela-name-guard',
  'tools/brioela-type-guard',
  'tools/brioela-lexicon-guard',
  'tools/brioela-reading-gate',
  'tools/scripts',
]
```
