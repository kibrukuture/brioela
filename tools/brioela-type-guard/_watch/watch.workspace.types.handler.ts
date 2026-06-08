import { watch } from 'node:fs'
import { join } from 'node:path'
import { checkedRoots, formatTypeViolations, runTypeGuard } from '../_helpers'

export function watchWorkspaceTypes(workspaceRoot: string): void {
  let timeout: ReturnType<typeof setTimeout> | undefined

  async function runCheck(): Promise<void> {
    const violations = await runTypeGuard(workspaceRoot, 'check')
    if (violations.length > 0) {
      console.error(formatTypeViolations(violations))
      return
    }
    console.log('Brioela Type Guard: clean.')
  }

  function scheduleCheck(): void {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      void runCheck()
    }, 150)
  }

  for (const root of checkedRoots) {
    try {
      watch(join(workspaceRoot, root), { recursive: true }, scheduleCheck)
    } catch {
      // Missing roots are allowed while the new app is being scaffolded.
    }
  }

  void runCheck()
  console.log('Brioela Type Guard: watching TypeScript safety.')
}
