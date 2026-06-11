#!/usr/bin/env bun

import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { exit } from 'node:process'
import { gatePidPath, gateSocketPath } from './_helpers'

const ownerId = process.geteuid?.() ?? -1

if (ownerId !== 0) {
  console.error('gate:down must run as root: sudo bun run gate:down   (from the repo root)')
  exit(1)
}

let stopped = false
if (existsSync(gatePidPath)) {
  const pid = Number(readFileSync(gatePidPath, 'utf8').trim())
  if (Number.isInteger(pid) && pid > 1) {
    try {
      process.kill(pid, 'SIGTERM')
      console.log(`Reading gate daemon stopped (SIGTERM pid ${pid}).`)
      stopped = true
    } catch (error) {
      if (!(error instanceof Error)) throw error
      console.log(`Failed to kill process ${pid}: ${error.message}`)
    }
  }
  unlinkSync(gatePidPath)
}

if (!stopped) {
  console.log('Reading gate daemon was not running.')
}

if (existsSync(gateSocketPath)) unlinkSync(gateSocketPath)
