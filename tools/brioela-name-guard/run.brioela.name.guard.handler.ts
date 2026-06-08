#!/usr/bin/env bun

import { cwd, exit } from 'node:process'
import { formatNamingViolations, runNameGuard } from './_helpers'
import { watchWorkspace } from './_watch'

const args = new Set(process.argv.slice(2))
const workspaceRoot = cwd()

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
