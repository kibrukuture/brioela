# Draft: start.lexicon.guard.daemon.handler.ts

Target: `tools/brioela-lexicon-guard/start.lexicon.guard.daemon.handler.ts`

```typescript
#!/usr/bin/env bun

import { mkdir, writeFile } from 'node:fs/promises'
import { execPath } from 'node:process'
import {
  buildLaunchdPlist,
  getLexiconGuardDaemonHealth,
  hardStopLexiconGuardDaemonWithStatuses,
  kickstartLexiconGuardDaemon,
  launchAgentsDirectory,
  launchdLabel,
  launchdLogDirectory,
  launchdPlistPath,
  printLexiconGuardDaemon,
  readFileIfExists,
  repairLaunchdPlist,
  resolveWorkspaceRoot,
  tryBootstrapLexiconGuardDaemon,
} from './_helpers'
import { InvalidLexiconGuardPlistError, LexiconGuardDaemonStartError } from './_types'

const workspaceRoot = resolveWorkspaceRoot()
const bunExecutablePath = execPath.includes('/Cellar/bun/') ? '/opt/homebrew/bin/bun' : execPath
const desiredPlist = buildLaunchdPlist({ bunExecutablePath, workspaceRoot })
const currentPlist = await readFileIfExists(launchdPlistPath)
const plistChanged = currentPlist !== desiredPlist
const health = getLexiconGuardDaemonHealth()
const state = health.state

if (!plistChanged && isHealthyRunningDaemon(health)) {
  console.log(`Brioela Lexicon Guard daemon already running and up to date: ${launchdLabel}`)
  console.log(`Plist: ${launchdPlistPath}`)
  if (health.pid !== null) console.log(`PID: ${health.pid}`)
  process.exit(0)
}

if (!plistChanged && state === 'loaded') {
  kickstartLexiconGuardDaemon()
  console.log(`Brioela Lexicon Guard daemon was loaded but not running; kicked it awake: ${launchdLabel}`)
  console.log(printLexiconGuardDaemon().split('\n').slice(0, 20).join('\n'))
  process.exit(0)
}

await mkdir(launchAgentsDirectory, { recursive: true })
await mkdir(launchdLogDirectory, { recursive: true })

if (plistChanged) {
  await writeFile(launchdPlistPath, desiredPlist, { mode: 0o644 })
}

const repair = await repairLaunchdPlist(launchdPlistPath)

if (!repair.lintOk) {
  throw new InvalidLexiconGuardPlistError([
    'Generated Brioela Lexicon Guard launchd plist is invalid.',
    `plist: ${launchdPlistPath}`,
    repair.lintText ? `plutil: ${repair.lintText}` : null,
  ].filter(Boolean).join('\n'))
}

if (shouldRestartDaemon({ state, plistChanged })) {
  hardStopLexiconGuardDaemonWithStatuses()
  await sleep(250)
}

let bootstrap = tryBootstrapLexiconGuardDaemon()

if (!bootstrap.ok) {
  hardStopLexiconGuardDaemonWithStatuses()
  await sleep(500)
  bootstrap = tryBootstrapLexiconGuardDaemon()
}

if (!bootstrap.ok) {
  throw new LexiconGuardDaemonStartError([
    'Could not start Brioela Lexicon Guard daemon with launchctl bootstrap.',
    `status: ${bootstrap.status ?? 'unknown'}`,
    bootstrap.stderr.trim() ? `stderr: ${bootstrap.stderr.trim()}` : null,
    bootstrap.stdout.trim() ? `stdout: ${bootstrap.stdout.trim()}` : null,
    repair.removedAttributes.length > 0 ? `removed xattrs: ${repair.removedAttributes.join(', ')}` : null,
    repair.lintText ? `plutil: ${repair.lintText}` : null,
    `plist: ${launchdPlistPath}`,
    `workspaceRoot: ${workspaceRoot}`,
  ].filter(Boolean).join('\n'))
}

kickstartLexiconGuardDaemon()

console.log(`Brioela Lexicon Guard daemon started: ${launchdLabel}`)
console.log(`Reason: ${describeStartReason(state, plistChanged)}`)
console.log(`Plist: ${launchdPlistPath}`)
if (repair.removedAttributes.length > 0) {
  console.log(`Repaired plist attributes: ${repair.removedAttributes.join(', ')}`)
}
console.log(printLexiconGuardDaemon().split('\n').slice(0, 20).join('\n'))

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function describeStartReason(state: string, plistChanged: boolean): string {
  if (plistChanged) return `plist changed; restarted from state '${state}'`
  if (state === 'missing') return 'daemon was not loaded'
  if (state === 'unknown') return 'launchd state was unknown; reconciled daemon'
  return `reconciled daemon from state '${state}'`
}

function isHealthyRunningDaemon(health: ReturnType<typeof getLexiconGuardDaemonHealth>): boolean {
  return health.state === 'running' && health.pid !== null
}

function shouldRestartDaemon(input: { state: string; plistChanged: boolean }): boolean {
  if (input.plistChanged) return true
  return input.state !== 'missing'
}
```
