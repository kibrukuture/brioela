#!/usr/bin/env bun

import { mkdirSync } from 'node:fs'
import { exit, pid } from 'node:process'
import {
  appendGateEvent,
  createGateKey,
  gateKeyFolder,
  gateLogFolder,
  gateStateFolder,
  manifestFolder,
  resolveWorkspaceRoot,
  serveGateSocket,
  serveVerdictRoute,
  watchTamperEvents,
  watchWorkspaceEvents,
  writeGateHeartbeat,
} from './_helpers'
import { writeWatchText } from './gate.state.store'

const ownerId = process.geteuid?.() ?? -1

if (ownerId !== 0) {
  console.error('The reading gate daemon must run as root. The human starts it with: sudo bun run gate:up   (from the repo root)')
  exit(1)
}

mkdirSync(gateStateFolder, { recursive: true, mode: 0o755 })
mkdirSync(gateLogFolder, { recursive: true, mode: 0o755 })
mkdirSync(manifestFolder, { recursive: true, mode: 0o700 })
mkdirSync(gateKeyFolder, { recursive: true, mode: 0o700 })

createGateKey()

const workspaceRoot = resolveWorkspaceRoot()
const gateSocket = serveGateSocket(workspaceRoot)

writeGateHeartbeat()
const heartbeatTimer = setInterval(() => {
  writeGateHeartbeat()
  // keep live watch streams from idling out — a bare carriage return is invisible
  writeWatchText('\r')
}, 5_000)

watchTamperEvents(workspaceRoot)
watchWorkspaceEvents(workspaceRoot, (changedPath) => {
  appendGateEvent(`changed ${changedPath}`)
  serveVerdictRoute(workspaceRoot, null).catch((verdictError: Error) => appendGateEvent(`verdict sweep failed: ${verdictError.message}`))
})

serveVerdictRoute(workspaceRoot, null).catch((verdictError: Error) => appendGateEvent(`verdict sweep failed: ${verdictError.message}`))

appendGateEvent(`gate daemon started pid ${pid} workspace ${workspaceRoot}`)
console.log(`Reading gate daemon serving ${workspaceRoot} (pid ${pid})`)

process.on('SIGTERM', () => {
  appendGateEvent(`gate daemon stopped pid ${pid}`)
  clearInterval(heartbeatTimer)
  gateSocket.stop(true)
  exit(0)
})
