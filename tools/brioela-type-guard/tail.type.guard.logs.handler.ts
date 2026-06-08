#!/usr/bin/env bun

import { spawn } from 'node:child_process'
import { launchdStderrPath, launchdStdoutPath } from './_helpers'

const target = process.argv[2] ?? 'all'
const paths = target === 'err'
  ? [launchdStderrPath]
  : target === 'out'
    ? [launchdStdoutPath]
    : [launchdStderrPath, launchdStdoutPath]

const child = spawn('tail', ['-n', '80', '-f', ...paths], { stdio: ['ignore', 'pipe', 'pipe'] })

child.stdout.on('data', (chunk: Buffer) => writeFilteredLines(chunk))
child.stderr.on('data', (chunk: Buffer) => writeFilteredLines(chunk))
child.on('exit', (code) => process.exit(code ?? 0))

let pending = ''

function writeFilteredLines(chunk: Buffer): void {
  pending += chunk.toString('utf8')

  const lines = pending.split('\n')
  pending = lines.pop() ?? ''

  for (const line of lines) {
    console.log(formatLogLine(line))
  }
}

function formatLogLine(line: string): string {
  if (isExpectedShutdownLine(line)) {
    return `Brioela Type Guard: daemon stopped cleanly. ${extractScriptName(line)}`.trim()
  }

  return line
}

function isExpectedShutdownLine(line: string): boolean {
  return line.includes('was terminated by signal SIGTERM')
    || line.includes('Polite quit request')
}

function extractScriptName(line: string): string {
  const match = line.match(/script "([^"]+)"/)
  const scriptName = match?.[1]
  if (scriptName === undefined) return ''
  return `(${scriptName})`
}
