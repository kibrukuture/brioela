#!/usr/bin/env bun

import { spawnSync } from 'node:child_process'
import { execPath } from 'node:process'

const bunExecutablePath = execPath.includes('/Cellar/bun/') ? '/opt/homebrew/bin/bun' : execPath

const stop = spawnSync(bunExecutablePath, ['stop.type.guard.daemon.handler.ts'], {
  cwd: import.meta.dir,
  encoding: 'utf8',
})

process.stdout.write(stop.stdout)
process.stderr.write(stop.stderr)

await sleep(500)

const start = spawnSync(bunExecutablePath, ['start.type.guard.daemon.handler.ts'], {
  cwd: import.meta.dir,
  encoding: 'utf8',
})

process.stdout.write(start.stdout)
process.stderr.write(start.stderr)

if (start.status !== 0) process.exit(start.status ?? 1)

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}
