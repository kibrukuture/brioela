#!/usr/bin/env bun

import { spawn } from 'node:child_process'
import { launchdStderrPath, launchdStdoutPath } from './_helpers'

const target = process.argv[2] ?? 'both'
const paths = target === 'err'
  ? [launchdStderrPath]
  : target === 'out'
    ? [launchdStdoutPath]
    : [launchdStderrPath, launchdStdoutPath]

const tail = spawn('tail', ['-f', ...paths], { stdio: 'inherit' })

tail.on('exit', (code) => {
  process.exit(code ?? 0)
})
