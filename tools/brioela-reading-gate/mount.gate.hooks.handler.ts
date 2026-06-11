#!/usr/bin/env bun

import { chmodSync } from 'node:fs'
import { join } from 'node:path'
import { exit } from 'node:process'
import { resolveWorkspaceRoot } from './_helpers'

const workspaceRoot = resolveWorkspaceRoot()
const hooksPath = 'tools/brioela-reading-gate/githooks'

chmodSync(join(workspaceRoot, hooksPath, 'pre-commit'), 0o755)

const configRun = Bun.spawnSync(['git', 'config', 'core.hooksPath', hooksPath], { cwd: workspaceRoot })

if (configRun.exitCode !== 0) {
  console.error('Could not point git at the gate hooks path:')
  console.error(configRun.stderr.toString())
  exit(1)
}

console.log(`Gate wall mounted: core.hooksPath → ${hooksPath}`)
console.log('Every commit now requires a live daemon, a clean board, and a signed receipt for the staged diff.')
