#!/usr/bin/env bun

import { mkdirSync } from 'node:fs'
import { exit, pid } from 'node:process'
import { appendGateEvent, gateLogFolder, gateStateFolder, manifestFolder, resolveWorkspaceRoot, serveGateSocket } from './_helpers'

const ownerId = process.geteuid?.() ?? -1

if (ownerId !== 0) {
  console.error('The reading gate daemon must run as root. The human starts it with: sudo bun gate:up')
  exit(1)
}

mkdirSync(gateStateFolder, { recursive: true, mode: 0o755 })
mkdirSync(gateLogFolder, { recursive: true, mode: 0o755 })
mkdirSync(manifestFolder, { recursive: true, mode: 0o700 })

const workspaceRoot = resolveWorkspaceRoot()
const gateSocket = serveGateSocket(workspaceRoot)

appendGateEvent(`gate daemon started pid ${pid} workspace ${workspaceRoot}`)
console.log(`Reading gate daemon serving ${workspaceRoot} (pid ${pid})`)

process.on('SIGTERM', () => {
  appendGateEvent(`gate daemon stopped pid ${pid}`)
  gateSocket.stop(true)
  exit(0)
})
