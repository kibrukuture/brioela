#!/usr/bin/env bun

import { exit } from 'node:process'
import { formatNamingViolations, resolveWorkspaceRoot, runNameGuard } from './_helpers'
import { watchWorkspace } from './_watch'

const args = new Set(process.argv.slice(2))
const workspaceRoot = resolveWorkspaceRoot()

if (args.has('--watch')) {
  watchWorkspace(workspaceRoot)
} else if (args.has('--update-baseline')) {
  await runNameGuard(workspaceRoot, 'update-baseline')
  console.log('Brioela Name Guard: baseline updated.')
} else {
  const violations = await runNameGuard(workspaceRoot, 'check')
  if (violations.length > 0) {
    console.error(formatNamingViolations(violations))
    exit(1)
  }

  console.log('Brioela Name Guard: clean.')
}
