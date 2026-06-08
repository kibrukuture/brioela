#!/usr/bin/env bun

import {
  getTypeGuardDaemonHealth,
  launchdLabel,
  launchdPlistPath,
  launchdService,
  tryLaunchctl,
} from './_helpers'
import { spawnSync } from 'node:child_process'
import { execPath } from 'node:process'

const health = getTypeGuardDaemonHealth()
const bunExecutablePath = execPath.includes('/Cellar/bun/') ? '/opt/homebrew/bin/bun' : execPath

if (health.state === 'missing') {
  console.log(`Brioela Type Guard daemon is not loaded; starting it: ${launchdLabel}`)
  runStart()
  process.exit(0)
}

const beforePid = health.pid

const restart = tryLaunchctl(['kickstart', '-k', launchdService()])

if (!restart.ok) {
  console.log(`Brioela Type Guard daemon restart fell back to start: ${launchdLabel}`)
  if (restart.stderr.trim()) console.log(restart.stderr.trim())
  runStart()
  process.exit(0)
}

await sleep(500)

const afterHealth = getTypeGuardDaemonHealth()

console.log(`Brioela Type Guard daemon restarted: ${launchdLabel}`)
if (beforePid !== null) console.log(`Previous PID: ${beforePid}`)
if (afterHealth.pid !== null) console.log(`Current PID: ${afterHealth.pid}`)
console.log(`Plist: ${launchdPlistPath}`)

function runStart(): void {
  const start = spawnSync(bunExecutablePath, ['start.type.guard.daemon.handler.ts'], {
    cwd: import.meta.dir,
    encoding: 'utf8',
  })

  process.stdout.write(start.stdout)
  process.stderr.write(start.stderr)

  if (start.status !== 0) process.exit(start.status ?? 1)
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
