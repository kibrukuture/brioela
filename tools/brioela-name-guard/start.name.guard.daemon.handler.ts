#!/usr/bin/env bun

import {
  bootoutNameGuardDaemon,
  bootstrapNameGuardDaemon,
  buildLaunchdPlist,
  kickstartNameGuardDaemon,
  launchAgentsDirectory,
  launchdLabel,
  launchdLogDirectory,
  launchdPlistPath,
  printNameGuardDaemon,
  resolveWorkspaceRoot,
} from './_helpers'
import { mkdir, writeFile } from 'node:fs/promises'
import { execPath } from 'node:process'

const workspaceRoot = resolveWorkspaceRoot()

await mkdir(launchAgentsDirectory, { recursive: true })
await mkdir(launchdLogDirectory, { recursive: true })
await writeFile(
  launchdPlistPath,
  buildLaunchdPlist({ bunExecutablePath: execPath, workspaceRoot }),
  { mode: 0o644 },
)

bootoutNameGuardDaemon()
bootstrapNameGuardDaemon()
kickstartNameGuardDaemon()

console.log(`Brioela Name Guard daemon started: ${launchdLabel}`)
console.log(`Plist: ${launchdPlistPath}`)
console.log(printNameGuardDaemon().split('\n').slice(0, 20).join('\n'))
