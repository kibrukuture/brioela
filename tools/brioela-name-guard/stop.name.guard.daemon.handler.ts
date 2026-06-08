#!/usr/bin/env bun

import { bootoutNameGuardDaemon, launchdLabel } from './_helpers'

bootoutNameGuardDaemon()
console.log(`Brioela Name Guard daemon stopped: ${launchdLabel}`)
