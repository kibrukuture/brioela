#!/usr/bin/env bun

import { mkdir, writeFile } from 'node:fs/promises'
import { execPath } from 'node:process'
import {
  buildLaunchdPlist,
  launchAgentsDirectory,
  launchdLabel,
  launchdLogDirectory,
  launchdPlistPath,
  resolveWorkspaceRoot,
} from './_helpers'

const workspaceRoot = resolveWorkspaceRoot()
const bunExecutablePath = execPath.includes('/Cellar/bun/') ? '/opt/homebrew/bin/bun' : execPath

if (!bunExecutablePath) {
  throw new Error('Could not find bun on PATH. Install Bun before installing the Brioela Name Guard daemon.')
}

await mkdir(launchAgentsDirectory, { recursive: true })
await mkdir(launchdLogDirectory, { recursive: true })

await writeFile(launchdPlistPath, buildLaunchdPlist({ bunExecutablePath, workspaceRoot }), { mode: 0o644 })

console.log(`Brioela Name Guard daemon plist written: ${launchdPlistPath}`)
console.log(`Load it with: launchctl bootstrap gui/$(id -u) ${launchdPlistPath}`)
console.log(`Start it with: launchctl kickstart -k gui/$(id -u)/${launchdLabel}`)
