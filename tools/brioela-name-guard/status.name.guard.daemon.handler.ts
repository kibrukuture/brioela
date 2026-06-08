#!/usr/bin/env bun

import { existsSync } from 'node:fs'
import {
  launchdLabel,
  launchdPlistPath,
  launchdStderrPath,
  launchdStdoutPath,
} from './_helpers'

console.log(`Label: ${launchdLabel}`)
console.log(`Plist: ${launchdPlistPath}`)
console.log(`Plist exists: ${existsSync(launchdPlistPath) ? 'yes' : 'no'}`)
console.log(`Stdout log: ${launchdStdoutPath}`)
console.log(`Stderr log: ${launchdStderrPath}`)
console.log(`Check launchd: launchctl print gui/$(id -u)/${launchdLabel}`)
