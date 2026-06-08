import { watch } from 'node:fs'
import { join } from 'node:path'
import { checkedRoots, explicitlyDetached, formatLexiconViolations, runLexiconGuard } from '../_helpers'

export function watchWorkspaceLexicon(workspaceRoot: string): void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  async function runCheck(): Promise<void> {
    const violations = await runLexiconGuard(workspaceRoot, 'check')
    if (violations.length > 0) {
      console.error(formatLexiconViolations(violations))
      return
    }
    console.log('Brioela Lexicon Guard: clean.')
  }

  function scheduleCheck(): void {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      explicitlyDetached(runCheck(), 'scheduled lexicon check')
    }, 150)
  }

  for (const root of checkedRoots) {
    try {
      watch(join(workspaceRoot, root), { recursive: true }, scheduleCheck)
    } catch (error) {
      console.error(`Brioela Lexicon Guard could not watch ${root}.`)
      console.error(error)
    }
  }

  explicitlyDetached(runCheck(), 'initial lexicon check')
  console.log('Brioela Lexicon Guard: watching identifier meaning.')
}
