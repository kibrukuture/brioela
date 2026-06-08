#!/usr/bin/env bun

import { rm } from 'node:fs/promises'
import { launchdLabel, launchdPlistPath } from './_helpers'

console.log(`Unload it with: launchctl bootout gui/$(id -u)/${launchdLabel}`)

await rm(launchdPlistPath, { force: true })

console.log(`Brioela Name Guard daemon plist removed: ${launchdPlistPath}`)
