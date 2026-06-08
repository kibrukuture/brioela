import { homedir } from 'node:os'
import { join } from 'node:path'

export const launchdLabel = 'com.brioela.type-guard'

export const launchAgentsDirectory = join(homedir(), 'Library', 'LaunchAgents')
export const launchdPlistPath = join(launchAgentsDirectory, `${launchdLabel}.plist`)
export const launchdLogDirectory = join(homedir(), 'Library', 'Logs', 'BrioelaTypeGuard')
export const launchdStdoutPath = join(launchdLogDirectory, 'type-guard.out.log')
export const launchdStderrPath = join(launchdLogDirectory, 'type-guard.err.log')
