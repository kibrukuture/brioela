#!/usr/bin/env bun

import { getLexiconGuardDaemonHealth, hardStopLexiconGuardDaemon, launchdLabel } from './_helpers'

hardStopLexiconGuardDaemon()

const stopped = await waitForStopped()

if (stopped) {
  console.log(`Brioela Lexicon Guard daemon stopped: ${launchdLabel}`)
} else {
  const health = getLexiconGuardDaemonHealth()
  console.log(`Brioela Lexicon Guard daemon stop requested: ${launchdLabel}`)
  console.log(`Current state: ${health.state}`)
  if (health.pid !== null) console.log(`PID: ${health.pid}`)
}

async function waitForStopped(): Promise<boolean> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const health = getLexiconGuardDaemonHealth()
    if (health.state === 'missing') return true
    await sleep(100)
  }

  return false
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
