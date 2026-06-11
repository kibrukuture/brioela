#!/usr/bin/env bun

import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { execPath, exit } from 'node:process'
import {
  buildGatePlist,
  gateKeyFolder,
  gateLaunchdLabel,
  gateLaunchdPlistPath,
  gateLogFolder,
  gatePidPath,
  gateSocketPath,
  gateStateFolder,
  manifestFolder,
  resolveWorkspaceRoot,
  watchGateStream,
} from './_helpers'

const ownerId = process.geteuid?.() ?? -1

if (ownerId !== 0) {
  console.error('gate:up must run as root so the manifest stays unforgeable: sudo bun run gate:up   (from the repo root)')
  exit(1)
}

mkdirSync(gateStateFolder, { recursive: true, mode: 0o755 })
mkdirSync(gateLogFolder, { recursive: true, mode: 0o755 })
mkdirSync(manifestFolder, { recursive: true, mode: 0o700 })
mkdirSync(gateKeyFolder, { recursive: true, mode: 0o700 })

const workspaceRoot = resolveWorkspaceRoot()
const runtimePath = execPath.includes('/Cellar/bun/') ? '/opt/homebrew/bin/bun' : execPath
const daemonScriptPath = join(import.meta.dir, 'run.gate.daemon.handler.ts')

// a daemon from the pre-launchd era may still hold the socket — bootout cannot
// reach it, so kill it through its pid file before bootstrapping the real one
if (existsSync(gatePidPath)) {
  const stalePid = Number(readFileSync(gatePidPath, 'utf8').trim())
  if (Number.isInteger(stalePid) && stalePid > 1) {
    try {
      process.kill(stalePid, 'SIGTERM')
      console.log(`Stopped stale detached daemon (pid ${stalePid}).`)
    } catch (staleError) {
      if (!(staleError instanceof Error)) throw staleError
    }
  }
  unlinkSync(gatePidPath)
}
if (existsSync(gateSocketPath)) unlinkSync(gateSocketPath)

const logOut = Bun.file(join(gateLogFolder, 'gate.out.log'))
const logErr = Bun.file(join(gateLogFolder, 'gate.err.log'))

const daemonProcess = Bun.spawn([
  '/bin/bash',
  '-c',
  'ulimit -n 8192 && exec "$0" "$@"',
  runtimePath,
  daemonScriptPath
], {
  detached: true,
  stdout: logOut,
  stderr: logErr,
  env: {
    ...process.env,
    BRIOELA_WORKSPACE_ROOT: workspaceRoot,
  },
})

daemonProcess.unref()
writeFileSync(gatePidPath, String(daemonProcess.pid))

for (let index = 0; index < 50; index++) {
  await Bun.sleep(100)
  if (await checkGateSocket()) {
    console.log('Reading gate is up in the background.')
    console.log(`  Workspace: ${workspaceRoot}`)
    console.log(`  Socket:    ${gateSocketPath}`)
    console.log(`  Manifest:  ${manifestFolder} (root-owned, mode 700)`)
    console.log(`  Pid:       ${daemonProcess.pid}`)
    console.log(`  Logs:      ${gateLogFolder}`)
    console.log('')
    console.log('  Other mouths:  bun run gate:watch · bun run gate:verdict · bun run gate:hooks:install')
    await watchGateStream()
  }
}

console.error('The reading gate daemon did not come up in time. Check the logs:')
console.error(`  ${join(gateLogFolder, 'gate.err.log')}`)
exit(1)

async function checkGateSocket(): Promise<boolean> {
  const gateCall = await fetch('http://gate/check', { unix: gateSocketPath }).catch(() => null)
  return gateCall !== null && gateCall.ok
}
