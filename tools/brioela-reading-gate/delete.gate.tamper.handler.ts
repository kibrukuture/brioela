#!/usr/bin/env bun

import { existsSync, readFileSync, unlinkSync } from 'node:fs'
import { exit } from 'node:process'
import { gateTamperPath } from './_helpers'

const ownerId = process.geteuid?.() ?? -1

if (ownerId !== 0) {
  console.error('Only the human clears tamper state: sudo bun run gate:tamper:clear   (from the repo root)')
  exit(1)
}

if (!existsSync(gateTamperPath)) {
  console.log('No tamper state recorded — board is not frozen.')
  exit(0)
}

console.log('Cleared tamper state. What had been recorded:')
console.log(readFileSync(gateTamperPath, 'utf8').trimEnd())
unlinkSync(gateTamperPath)
console.log('')
console.log('Run bun run gate:verdict to recompute the board.')
