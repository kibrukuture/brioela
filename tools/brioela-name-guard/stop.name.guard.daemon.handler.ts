#!/usr/bin/env bun

import { hardStopNameGuardDaemon, launchdLabel } from './_helpers'

hardStopNameGuardDaemon()
console.log(`Brioela Name Guard daemon stopped: ${launchdLabel}`)
