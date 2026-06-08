#!/usr/bin/env bun

import { mkdir, writeFile } from 'node:fs/promises'
import { execPath } from 'node:process'
import {
  buildLaunchdPlist,
  getTypeGuardDaemonHealth,
  hardStopTypeGuardDaemonWithResults,
  kickstartTypeGuardDaemon,
  launchAgentsDirectory,
  launchdLabel,
  launchdLogDirectory,
  launchdPlistPath,
  printTypeGuardDaemon,
  readFileIfExists,
  repairLaunchdPlist,
  resolveWorkspaceRoot,
  tryBootstrapTypeGuardDaemon,
} from './_helpers'

const workspaceRoot = resolveWorkspaceRoot()
const bunExecutablePath = execPath.includes('/Cellar/bun/') ? '/opt/homebrew/bin/bun' : execPath
const desiredPlist = buildLaunchdPlist({ bunExecutablePath, workspaceRoot })
const currentPlist = await readFileIfExists(launchdPlistPath)
const plistChanged = currentPlist !== desiredPlist
const health = getTypeGuardDaemonHealth()
const state = health.state

if (!plistChanged && isHealthyRunningDaemon(health)) {
  console.log(`Brioela Type Guard daemon already running and up to date: ${launchdLabel}`)
  console.log(`Plist: ${launchdPlistPath}`)
  if (health.pid) console.log(`PID: ${health.pid}`)
  process.exit(0)
}

if (!plistChanged && state === 'loaded') {
  kickstartTypeGuardDaemon()
  console.log(`Brioela Type Guard daemon was loaded but not running; kicked it awake: ${launchdLabel}`)
  console.log(printTypeGuardDaemon().split('\n').slice(0, 20).join('\n'))
  process.exit(0)
}

await mkdir(launchAgentsDirectory, { recursive: true })
await mkdir(launchdLogDirectory, { recursive: true })

if (plistChanged) {
  await writeFile(launchdPlistPath, desiredPlist, { mode: 0o644 })
}

const repair = await repairLaunchdPlist(launchdPlistPath)

if (!repair.lintOk) {
  throw new Error([
    'Generated Brioela Type Guard launchd plist is invalid.',
    `plist: ${launchdPlistPath}`,
    repair.lintOutput ? `plutil: ${repair.lintOutput}` : undefined,
  ].filter(Boolean).join('\n'))
}

if (shouldRestartDaemon({ state, plistChanged })) {
  hardStopTypeGuardDaemonWithResults()
  await sleep(250)
}

let bootstrap = tryBootstrapTypeGuardDaemon()

if (!bootstrap.ok) {
  hardStopTypeGuardDaemonWithResults()
  await sleep(500)
  bootstrap = tryBootstrapTypeGuardDaemon()
}

if (!bootstrap.ok) {
  throw new Error([
    'Could not start Brioela Type Guard daemon with launchctl bootstrap.',
    `status: ${bootstrap.status ?? 'unknown'}`,
    bootstrap.stderr.trim() ? `stderr: ${bootstrap.stderr.trim()}` : undefined,
    bootstrap.stdout.trim() ? `stdout: ${bootstrap.stdout.trim()}` : undefined,
    repair.removedAttributes.length > 0 ? `removed xattrs: ${repair.removedAttributes.join(', ')}` : undefined,
    repair.lintOutput ? `plutil: ${repair.lintOutput}` : undefined,
    `plist: ${launchdPlistPath}`,
    `workspaceRoot: ${workspaceRoot}`,
  ].filter(Boolean).join('\n'))
}

kickstartTypeGuardDaemon()

console.log(`Brioela Type Guard daemon started: ${launchdLabel}`)
console.log(`Reason: ${describeStartReason(state, plistChanged)}`)
console.log(`Plist: ${launchdPlistPath}`)
if (repair.removedAttributes.length > 0) {
  console.log(`Repaired plist attributes: ${repair.removedAttributes.join(', ')}`)
}
console.log(printTypeGuardDaemon().split('\n').slice(0, 20).join('\n'))

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

function describeStartReason(state: string, plistChanged: boolean): string {
  if (plistChanged) return `plist changed; restarted from state '${state}'`
  if (state === 'missing') return 'daemon was not loaded'
  if (state === 'unknown') return 'launchd state was unknown; reconciled daemon'
  return `reconciled daemon from state '${state}'`
}

function isHealthyRunningDaemon(health: ReturnType<typeof getTypeGuardDaemonHealth>): boolean {
  return health.state === 'running' && health.pid !== null
}

function shouldRestartDaemon(input: { state: string; plistChanged: boolean }): boolean {
  if (input.plistChanged) return true
  return input.state !== 'missing'
}
