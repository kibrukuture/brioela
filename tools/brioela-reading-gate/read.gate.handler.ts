#!/usr/bin/env bun

import { argv, exit } from 'node:process'
import { gateSocketPath } from './_helpers'

const filePath = argv[2]

if (typeof filePath !== 'string' || filePath.length === 0) {
  console.error('Usage: bun gate:read <file>')
  console.error('Streams the file through the gate daemon so the read is recorded as proof.')
  exit(1)
}

const gateCall = await fetch(`http://gate/read?file=${encodeURIComponent(filePath)}`, { unix: gateSocketPath })
  .catch(() => null)

if (gateCall === null) {
  console.error('The reading gate daemon is not running, so this read cannot earn credit.')
  console.error('Only the human can start it: sudo bun gate:up')
  exit(1)
}

if (!gateCall.ok) {
  console.error((await gateCall.text()).trim())
  exit(1)
}

const content = await gateCall.text()
const hash = gateCall.headers.get('x-gate-hash') ?? 'unknown'
const bytesText = gateCall.headers.get('x-gate-bytes') ?? '0'
const file = gateCall.headers.get('x-gate-file') ?? filePath

process.stdout.write(content)
console.error('')
console.error(`gate:read ✓ ${file}  sha256 ${hash.slice(0, 8)}  ${bytesText} bytes  (recorded by the gate daemon)`)
