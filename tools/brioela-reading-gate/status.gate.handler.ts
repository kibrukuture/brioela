#!/usr/bin/env bun

import { exit } from 'node:process'
import { gateSocketPath } from './_helpers'

const gateCall = await fetch('http://gate/status', { unix: gateSocketPath }).catch(() => null)

if (gateCall === null) {
  console.error('The reading gate daemon is not running.')
  console.error('Only the human can start it: sudo bun gate:up')
  exit(1)
}

console.log((await gateCall.text()).trimEnd())
