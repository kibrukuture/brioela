#!/usr/bin/env bun

import { hardStopTypeGuardDaemon, launchdLabel } from './_helpers'

hardStopTypeGuardDaemon()
console.log(`Brioela Type Guard daemon stopped: ${launchdLabel}`)
