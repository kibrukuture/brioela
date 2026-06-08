import { execFileSync } from 'node:child_process'
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

export function bootstrapNameGuardDaemon(): void {
  runLaunchctl(['bootstrap', launchdDomain(), launchdPlistPath])
}

export function bootoutNameGuardDaemon(): void {
  runLaunchctl(['bootout', launchdService()], { allowFailure: true })
}

export function kickstartNameGuardDaemon(): void {
  runLaunchctl(['kickstart', '-k', launchdService()])
}

export function printNameGuardDaemon(): string {
  return runLaunchctl(['print', launchdService()])
}
