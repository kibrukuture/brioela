#!/usr/bin/env bun

import { getTypeGuardDaemonHealth, hardStopTypeGuardDaemon, launchdLabel } from './_helpers'

hardStopTypeGuardDaemon()

const stopped = await waitForStopped()

if (stopped) {
  console.log(`Brioela Type Guard daemon stopped: ${launchdLabel}`)
} else {
  const health = getTypeGuardDaemonHealth()
  console.log(`Brioela Type Guard daemon stop requested: ${launchdLabel}`)
  console.log(`Current state: ${health.state}`)
  if (health.pid !== null) console.log(`PID: ${health.pid}`)
}

async function waitForStopped(): Promise<boolean> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const health = getTypeGuardDaemonHealth()
    if (health.state === 'missing') return true
    await sleep(100)
  }

  return false
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
