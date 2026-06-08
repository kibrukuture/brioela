import { execFileSync, spawnSync } from 'node:child_process'
import { getuid } from 'node:process'
import { LaunchdUserError } from '../_types'
import { launchdLabel, launchdPlistPath } from './launchd.config.helper'

export function launchdDomain(): string {
  const uid = getuid?.()
  if (typeof uid !== 'number') {
    throw new LaunchdUserError()
  }
  return `gui/${uid}`
}

export function launchdService(): string {
  return `${launchdDomain()}/${launchdLabel}`
}

export function runLaunchctl(args: string[], options?: { allowFailure?: boolean }): string {
  try {
    return execFileSync('launchctl', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (error) {
    if (options?.allowFailure) return ''
    throw error
  }
}

export type LaunchctlStatus = {
  ok: boolean
  status: number | null
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
}

export function tryLaunchctl(args: string[]): LaunchctlStatus {
  const status = spawnSync('launchctl', args, { encoding: 'utf8' })

  return {
    ok: status.status === 0,
    status: status.status,
    signal: status.signal,
    stdout: status.stdout ?? '',
    stderr: status.stderr ?? '',
  }
}

export function tryBootstrapLexiconGuardDaemon(): LaunchctlStatus {
  return tryLaunchctl(['bootstrap', launchdDomain(), launchdPlistPath])
}

export function hardStopLexiconGuardDaemon(): void {
  tryLaunchctl(['bootout', launchdService()])
  tryLaunchctl(['bootout', launchdDomain(), launchdPlistPath])
  tryLaunchctl(['remove', launchdLabel])
}

export function hardStopLexiconGuardDaemonWithStatuses(): LaunchctlStatus[] {
  return [
    tryLaunchctl(['bootout', launchdService()]),
    tryLaunchctl(['bootout', launchdDomain(), launchdPlistPath]),
    tryLaunchctl(['remove', launchdLabel]),
  ]
}

export function kickstartLexiconGuardDaemon(): void {
  runLaunchctl(['kickstart', '-k', launchdService()])
}

export function printLexiconGuardDaemon(): string {
  return runLaunchctl(['print', launchdService()])
}

export type LexiconGuardDaemonState = 'running' | 'loaded' | 'missing' | 'unknown'

export type LexiconGuardDaemonHealth = {
  state: LexiconGuardDaemonState
  print: LaunchctlStatus
  pid: number | null
  lastExitStatus: number | null
}

export function getLexiconGuardDaemonHealth(): LexiconGuardDaemonHealth {
  const status = tryLaunchctl(['print', launchdService()])

  if (!status.ok) {
    if (status.stderr.includes('Could not find service') || status.stderr.includes('Bad request')) {
      return { state: 'missing', print: status, pid: null, lastExitStatus: null }
    }
    return { state: 'unknown', print: status, pid: null, lastExitStatus: null }
  }

  const pid = parseNumberField(status.stdout, 'pid')
  const lastExitStatus = parseNumberField(status.stdout, 'last exit code')
  const state = status.stdout.includes('state = running') ? 'running' : 'loaded'

  return { state, print: status, pid, lastExitStatus }
}

function parseNumberField(output: string, fieldName: string): number | null {
  const match = output.match(new RegExp(`\\b${fieldName} = (-?\\d+)`))
  if (!match?.[1]) return null
  return Number(match[1])
}
