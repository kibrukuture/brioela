#!/usr/bin/env bun

import { spawn } from 'node:child_process'
import { chmodSync, mkdirSync, openSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { execPath, exit } from 'node:process'
import {
  gateErrorLogPath,
  gateLogFolder,
  gatePidPath,
  gateRunLogPath,
  gateSocketPath,
  gateStateFolder,
  manifestFolder,
  resolveWorkspaceRoot,
} from './_helpers'

const ownerId = process.geteuid?.() ?? -1

if (ownerId !== 0) {
  console.error('gate:up must run as root so the manifest stays unforgeable: sudo bun gate:up')
  exit(1)
}

if (await checkGateSocket()) {
  console.log('Reading gate daemon is already running.')
  console.log(`Socket: ${gateSocketPath}`)
  exit(0)
}

mkdirSync(gateStateFolder, { recursive: true, mode: 0o755 })
mkdirSync(gateLogFolder, { recursive: true, mode: 0o755 })
mkdirSync(manifestFolder, { recursive: true, mode: 0o700 })
chmodSync(gateStateFolder, 0o755)
chmodSync(gateLogFolder, 0o755)
chmodSync(manifestFolder, 0o700)

const workspaceRoot = resolveWorkspaceRoot()
const runtimePath = execPath.includes('/Cellar/bun/') ? '/opt/homebrew/bin/bun' : execPath
const daemonScriptPath = join(import.meta.dir, 'run.gate.daemon.handler.ts')
const runLogFile = openSync(gateRunLogPath, 'a')
const errorLogFile = openSync(gateErrorLogPath, 'a')

const gateDaemon = spawn(runtimePath, [daemonScriptPath], {
  detached: true,
  stdio: ['ignore', runLogFile, errorLogFile],
  env: { ...process.env, BRIOELA_WORKSPACE_ROOT: workspaceRoot },
})

gateDaemon.unref()

if (typeof gateDaemon.pid !== 'number') {
  console.error('Could not launch the reading gate daemon. Check the logs:')
  console.error(`  ${gateErrorLogPath}`)
  exit(1)
}

writeFileSync(gatePidPath, `${gateDaemon.pid}\n`, { mode: 0o644 })

for (let index = 0; index < 30; index++) {
  await Bun.sleep(100)
  if (await checkGateSocket()) {
    console.log('Reading gate is up. Agents earn read credit only through: bun gate:read <file>')
    console.log(`  Workspace: ${workspaceRoot}`)
    console.log(`  Socket:    ${gateSocketPath}`)
    console.log(`  Manifest:  ${manifestFolder} (root-owned, mode 700)`)
    console.log(`  Pid:       ${gateDaemon.pid}`)
    console.log(`  Logs:      ${gateLogFolder}`)
    exit(0)
  }
}

console.error('The reading gate daemon did not come up in time. Check the logs:')
console.error(`  ${gateErrorLogPath}`)
exit(1)

async function checkGateSocket(): Promise<boolean> {
  const gateCall = await fetch('http://gate/check', { unix: gateSocketPath }).catch(() => null)
  return gateCall !== null && gateCall.ok
}
