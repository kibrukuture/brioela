import { execFileSync, spawnSync } from 'node:child_process'
import { getuid } from 'node:process'
import { launchdLabel, launchdPlistPath } from './launchd.config.helper'

export function launchdDomain(): string {
  const uid = getuid?.()
  if (typeof uid !== 'number') {
    throw new Error('Could not determine the current user id for launchctl.')
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

export type LaunchctlResult = {
  ok: boolean
  status: number | null
  signal: NodeJS.Signals | null
  stdout: string
  stderr: string
}

export function tryLaunchctl(args: string[]): LaunchctlResult {
  const result = spawnSync('launchctl', args, { encoding: 'utf8' })

  return {
    ok: result.status === 0,
    status: result.status,
    signal: result.signal,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  }
}

export function bootstrapNameGuardDaemon(): void {
  runLaunchctl(['bootstrap', launchdDomain(), launchdPlistPath])
}

export function tryBootstrapNameGuardDaemon(): LaunchctlResult {
  return tryLaunchctl(['bootstrap', launchdDomain(), launchdPlistPath])
}

export function bootoutNameGuardDaemon(): void {
  runLaunchctl(['bootout', launchdService()], { allowFailure: true })
}

export function hardStopNameGuardDaemon(): void {
  // Service target: loaded service by label.
  tryLaunchctl(['bootout', launchdService()])

  // Plist target: partially loaded LaunchAgent from file path.
  tryLaunchctl(['bootout', launchdDomain(), launchdPlistPath])

  // Legacy fallback. Harmless when the service is absent.
  tryLaunchctl(['remove', launchdLabel])
}

export function hardStopNameGuardDaemonWithResults(): LaunchctlResult[] {
  return [
    tryLaunchctl(['bootout', launchdService()]),
    tryLaunchctl(['bootout', launchdDomain(), launchdPlistPath]),
    tryLaunchctl(['remove', launchdLabel]),
  ]
}

export function kickstartNameGuardDaemon(): void {
  runLaunchctl(['kickstart', '-k', launchdService()])
}

export function printNameGuardDaemon(): string {
  return runLaunchctl(['print', launchdService()])
}

export type NameGuardDaemonState = 'running' | 'loaded' | 'missing' | 'unknown'

export type NameGuardDaemonHealth = {
  state: NameGuardDaemonState
  print: LaunchctlResult
  pid: number | null
  lastExitStatus: number | null
}

export function getNameGuardDaemonState(): NameGuardDaemonState {
  return getNameGuardDaemonHealth().state
}

export function getNameGuardDaemonHealth(): NameGuardDaemonHealth {
  const result = tryLaunchctl(['print', launchdService()])

  if (!result.ok) {
    if (result.stderr.includes('Could not find service') || result.stderr.includes('Bad request')) {
      return { state: 'missing', print: result, pid: null, lastExitStatus: null }
    }
    return { state: 'unknown', print: result, pid: null, lastExitStatus: null }
  }

  const pid = parseNumberField(result.stdout, 'pid')
  const lastExitStatus = parseNumberField(result.stdout, 'last exit code')
  const state = result.stdout.includes('state = running') ? 'running' : 'loaded'

  return { state, print: result, pid, lastExitStatus }
}

function parseNumberField(output: string, fieldName: string): number | null {
  const match = output.match(new RegExp(`\\b${fieldName} = (-?\\d+)`))
  if (!match?.[1]) return null
  return Number(match[1])
}
