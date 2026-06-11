# Draft: verdict.gate.handler.ts

Target: `tools/brioela-reading-gate/verdict.gate.handler.ts`

```typescript
#!/usr/bin/env bun

import { argv, exit } from 'node:process'
import { checkGateSignature, createDiffHash, gateSocketPath, resolveWorkspaceRoot } from './_helpers'

const withReceipt = argv.includes('--receipt')
const forHook = argv.includes('--hook')
const blockedExit = forHook ? 2 : 1

const workspaceRoot = resolveWorkspaceRoot()
const diffHash = withReceipt ? createDiffHash(workspaceRoot) : null
const route = diffHash === null ? 'http://gate/verdict' : `http://gate/verdict?hash=${diffHash}`

const gateCall = await fetch(route, { unix: gateSocketPath }).catch(() => null)

if (gateCall === null) {
  console.error('')
  console.error('  VERDICT — BLOCKED · GUARD NOT RUNNING')
  console.error('  Fail closed: no live daemon means no proof, and no proof means red.')
  console.error('  Only the human can start it: sudo bun run gate:up   (from the repo root)')
  console.error('')
  exit(blockedExit)
}

if (gateCall.status === 404) {
  console.error('')
  console.error('  VERDICT — BLOCKED · DAEMON RUNNING OLD GATE CODE')
  console.error('  The daemon answered but does not know the /verdict route yet.')
  console.error('  Only the human can reload it: sudo bun run gate:up   (from the repo root)')
  console.error('')
  exit(blockedExit)
}

const verdictText = await gateCall.text()
const isClean = gateCall.headers.get('x-gate-clean') === 'true'

if (!isClean) {
  console.error(verdictText)
  exit(blockedExit)
}

if (withReceipt) {
  const receiptText = gateCall.headers.get('x-gate-receipt')
  const signature = gateCall.headers.get('x-gate-signature')

  if (receiptText === null || signature === null || !checkGateSignature(receiptText, signature)) {
    console.error('')
    console.error('  VERDICT — BLOCKED · RECEIPT SIGNATURE INVALID')
    console.error('  The green receipt could not be checked against the gate public key.')
    console.error('')
    exit(blockedExit)
  }

  if (!receiptText.includes(` ${diffHash} `) && !receiptText.startsWith(`receipt ${diffHash} `)) {
    console.error('')
    console.error('  VERDICT — BLOCKED · RECEIPT DIFF MISMATCH')
    console.error('  The signed receipt does not match the staged diff. Re-stage and re-earn it.')
    console.error('')
    exit(blockedExit)
  }
}

console.log(verdictText)
exit(0)
```
