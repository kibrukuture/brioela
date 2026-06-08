import { homedir } from 'node:os'
import { join } from 'node:path'

export const launchdLabel = 'com.brioela.name-guard'

export const launchAgentsDirectory = join(homedir(), 'Library', 'LaunchAgents')
export const launchdPlistPath = join(launchAgentsDirectory, `${launchdLabel}.plist`)
export const launchdLogDirectory = join(homedir(), 'Library', 'Logs', 'BrioelaNameGuard')
export const launchdStdoutPath = join(launchdLogDirectory, 'name-guard.out.log')
export const launchdStderrPath = join(launchdLogDirectory, 'name-guard.err.log')
