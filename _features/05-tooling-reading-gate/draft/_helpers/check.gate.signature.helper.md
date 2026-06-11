# Draft: _helpers/check.gate.signature.helper.ts

Target: `tools/brioela-reading-gate/_helpers/check.gate.signature.helper.ts`

```typescript
import { createPublicKey, verify } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { gatePublicKeyPath } from './gate.config.helper'

export function checkGateSignature(text: string, signature: string, keyPath = gatePublicKeyPath): boolean {
  if (!existsSync(keyPath)) return false
  const publicKey = createPublicKey(readFileSync(keyPath, 'utf8'))
  return verify(null, Buffer.from(text, 'utf8'), publicKey, Buffer.from(signature, 'base64'))
}
```
