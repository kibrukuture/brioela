#!/usr/bin/env bun

import {
  bootoutNameGuardDaemon,
  bootstrapNameGuardDaemon,
  kickstartNameGuardDaemon,
  launchdLabel,
  printNameGuardDaemon,
} from './_helpers'

bootoutNameGuardDaemon()
bootstrapNameGuardDaemon()
kickstartNameGuardDaemon()

console.log(`Brioela Name Guard daemon started: ${launchdLabel}`)
console.log(printNameGuardDaemon().split('\n').slice(0, 20).join('\n'))
