#!/usr/bin/env bun

import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { exit } from 'node:process'
import { gatePidPath, gateSocketPath } from './_helpers'

const ownerId = process.geteuid?.() ?? -1

if (ownerId !== 0) {
  console.error('gate:down must run as root: sudo bun gate:down')
  exit(1)
}

if (!existsSync(gatePidPath)) {
  console.log('Reading gate daemon is not running (no pid file).')
  exit(0)
}

const pidText = readFileSync(gatePidPath, 'utf8').trim()
const gatePid = Number(pidText)

if (!Number.isInteger(gatePid) || gatePid <= 0) {
  console.error(`Pid file is unreadable: ${gatePidPath}`)
  exit(1)
}

try {
  process.kill(gatePid, 'SIGTERM')
  console.log(`Reading gate daemon stopped (pid ${gatePid}).`)
} catch (error) {
  console.log(`Reading gate daemon was not running (pid ${gatePid}): ${error instanceof Error ? error.message : 'unknown'}`)
}

if (existsSync(gateSocketPath)) unlinkSync(gateSocketPath)
unlinkSync(gatePidPath)
