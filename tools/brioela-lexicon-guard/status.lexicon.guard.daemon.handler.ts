#!/usr/bin/env bun

import { existsSync } from 'node:fs'
import {
  getLexiconGuardDaemonHealth,
  launchdLabel,
  launchdPlistPath,
  launchdStderrPath,
  launchdStdoutPath,
} from './_helpers'

const health = getLexiconGuardDaemonHealth()

console.log(`Label: ${launchdLabel}`)
console.log(`State: ${health.state}`)
if (health.pid !== null) console.log(`PID: ${health.pid}`)
if (health.lastExitStatus !== null) console.log(`Last exit status: ${health.lastExitStatus}`)
console.log(`Plist: ${launchdPlistPath}`)
console.log(`Plist exists: ${existsSync(launchdPlistPath) ? 'yes' : 'no'}`)
console.log(`Stdout log: ${launchdStdoutPath}`)
console.log(`Stderr log: ${launchdStderrPath}`)

if (health.state === 'unknown') {
  console.log(`Launchd stderr: ${health.print.stderr.trim() || 'none'}`)
}
