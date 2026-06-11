# Draft: smoke.gate.handler.ts

Target: `tools/brioela-reading-gate/smoke.gate.handler.ts`

```typescript
#!/usr/bin/env bun

import { appendFileSync, existsSync, mkdirSync, readFileSync, rmdirSync } from 'node:fs'
import { join } from 'node:path'
import { exit } from 'node:process'
import {
  checkGateHeartbeat,
  gatePublicKeyPath,
  gateSocketPath,
  manifestPath,
  redFlagFileName,
  resolveWorkspaceRoot,
} from './_helpers'

const workspaceRoot = resolveWorkspaceRoot()
let errorCount = 0

function printReport(label: string, clean: boolean, suggestion: string): void {
  console.log(`  ${clean ? '✓' : '✖'} ${label}${clean ? '' : ` — ${suggestion}`}`)
  if (!clean) errorCount += 1
}

console.log('')
console.log('  gate smoke — attacking the wall to prove it stands')
console.log('')

// 1. daemon alive
const checkCall = await fetch('http://gate/check', { unix: gateSocketPath }).catch(() => null)
printReport('daemon answers on the socket', checkCall !== null && checkCall.ok, 'start it: sudo bun run gate:up')

if (checkCall === null || !checkCall.ok) {
  console.log('')
  console.log('  smoke stopped — nothing else is provable without the daemon. Fail closed.')
  exit(1)
}

// 2. public key must be readable by normal users — every signature check depends on it
let publicKeyClean = false
try {
  publicKeyClean = readFileSync(gatePublicKeyPath, 'utf8').includes('PUBLIC KEY')
} catch (keyError) {
  publicKeyClean = !(keyError instanceof Error)
}
printReport('public key readable by non-root users', publicKeyClean, `cannot read ${gatePublicKeyPath} — receipts and heartbeats are unverifiable`)

// 3. heartbeat fresh and signature valid
printReport('heartbeat is fresh and ed25519-signed', checkGateHeartbeat(), 'daemon running but not beating — check logs')

// 4. forgery attempt — manifest must reject non-root writes
let forged = false
try {
  appendFileSync(manifestPath, 'forged\tline\n')
  forged = true
} catch (writeError) {
  forged = !(writeError instanceof Error)
}
printReport('manifest rejects forged writes (EACCES)', !forged, 'CRITICAL: a non-root process wrote the manifest — the privilege model is broken')

// 5. verdict round trip — the header must exist, a 404 from old code is a failure
const verdictCall = await fetch('http://gate/verdict', { unix: gateSocketPath }).catch(() => null)
const verdictCurrent = verdictCall !== null && verdictCall.headers.get('x-gate-clean') !== null
printReport('verdict route answers with a real verdict', verdictCurrent, 'daemon is running old code — restart: sudo bun run gate:up')
const verdictClean = verdictCall !== null && verdictCall.headers.get('x-gate-clean') === 'true'

// 6. violation injection — a bad folder must flip the board red and raise the flag
if (verdictCall !== null && verdictCall.headers.get('x-gate-clean') !== null) {
  const smokeFolder = join(workspaceRoot, 'backend', 'SmokeInjection')
  mkdirSync(smokeFolder, { recursive: true })

  const redCall = await fetch('http://gate/verdict', { unix: gateSocketPath }).catch(() => null)
  const redVerdict = redCall !== null && redCall.headers.get('x-gate-clean') === 'false'
  printReport('injected bad folder flips the board red', redVerdict, 'the board did not react to a folder violation')
  printReport('GUARD-RED.md raised at workspace root', existsSync(join(workspaceRoot, redFlagFileName)), 'red flag file missing while red')

  rmdirSync(smokeFolder)
  const greenCall = await fetch('http://gate/verdict', { unix: gateSocketPath }).catch(() => null)
  const greenVerdict = greenCall !== null && greenCall.headers.get('x-gate-clean') === (verdictClean ? 'true' : 'false')
  printReport('board recovers after cleanup', greenVerdict, 'board did not return to its prior state')
  if (verdictClean) {
    printReport('GUARD-RED.md lowered when green', !existsSync(join(workspaceRoot, redFlagFileName)), 'red flag file still present while green')
  }
}

console.log('')
if (errorCount === 0) {
  console.log('  smoke — ALL CLEAR. The wall stands.')
  exit(0)
}
console.log(`  smoke — ${errorCount} FAILURE(S). The wall has holes. Fix before trusting it.`)
exit(1)
```
