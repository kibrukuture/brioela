import { homedir } from 'node:os'
import { join } from 'node:path'

export const launchdLabel = 'com.brioela.lexicon-guard'

export const launchAgentsDirectory = join(homedir(), 'Library', 'LaunchAgents')
export const launchdPlistPath = join(launchAgentsDirectory, `${launchdLabel}.plist`)
export const launchdLogDirectory = join(homedir(), 'Library', 'Logs', 'BrioelaLexiconGuard')
export const launchdStdoutPath = join(launchdLogDirectory, 'lexicon-guard.out.log')
export const launchdStderrPath = join(launchdLogDirectory, 'lexicon-guard.err.log')
