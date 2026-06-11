# Draft: _helpers/create.gate.key.helper.ts

Target: `tools/brioela-reading-gate/_helpers/create.gate.key.helper.ts`

```typescript
import { generateKeyPairSync } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { gatePrivateKeyPath, gatePublicKeyPath } from './gate.config.helper'

export function createGateKey(privatePath = gatePrivateKeyPath, publicPath = gatePublicKeyPath): void {
  if (existsSync(privatePath) && existsSync(publicPath)) return

  mkdirSync(dirname(privatePath), { recursive: true, mode: 0o700 })

  const { privateKey, publicKey } = generateKeyPairSync('ed25519')

  writeFileSync(privatePath, privateKey.export({ type: 'pkcs8', format: 'pem' }), { mode: 0o600 })
  writeFileSync(publicPath, publicKey.export({ type: 'spki', format: 'pem' }), { mode: 0o644 })
}
```
