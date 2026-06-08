#!/usr/bin/env bun

import { exit } from 'node:process'
import { formatTypeViolations, resolveWorkspaceRoot, runTypeGuard } from './_helpers'
import { watchWorkspaceTypes } from './_watch'

const args = new Set(process.argv.slice(2))
const workspaceRoot = resolveWorkspaceRoot()

if (args.has('--watch')) {
  watchWorkspaceTypes(workspaceRoot)
} else if (args.has('--update-baseline')) {
  await runTypeGuard(workspaceRoot, 'update-baseline')
  console.log('Brioela Type Guard: baseline updated.')
} else {
  const violations = await runTypeGuard(workspaceRoot, 'check')
  if (violations.length > 0) {
    console.error(formatTypeViolations(violations))
    exit(1)
  }

  console.log('Brioela Type Guard: clean.')
}
