# Draft: _helpers/sign.gate.text.helper.ts

Target: `tools/brioela-reading-gate/_helpers/sign.gate.text.helper.ts`

```typescript
import { createPrivateKey, sign } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { gatePrivateKeyPath } from './gate.config.helper'

export function signGateText(text: string, keyPath = gatePrivateKeyPath): string {
  const privateKey = createPrivateKey(readFileSync(keyPath, 'utf8'))
  return sign(null, Buffer.from(text, 'utf8'), privateKey).toString('base64')
}
```
