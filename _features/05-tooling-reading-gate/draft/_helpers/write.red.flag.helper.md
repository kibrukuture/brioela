# Draft: _helpers/write.red.flag.helper.ts

Target: `tools/brioela-reading-gate/_helpers/write.red.flag.helper.ts`

```typescript
import { existsSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import dayjs from 'dayjs'
import { redFlagFileName } from './gate.config.helper'
import type { GateBoard } from '../_types'

export function writeRedFlag(workspaceRoot: string, board: GateBoard, tamperText: string | null): void {
  const flagPath = join(workspaceRoot, redFlagFileName)

  if (board.violations.length === 0 && tamperText === null) {
    if (existsSync(flagPath)) unlinkSync(flagPath)
    return
  }

  const flagText: string[] = [
    '# 🔴 GUARD RED — NOTHING LANDS UNTIL THIS FILE DISAPPEARS',
    '',
    'This file is written by the gate daemon while the board is red and deleted the moment it is green.',
    'Do not edit or delete it — fix the violations below, and it removes itself.',
    '',
  ]

  if (tamperText !== null) {
    flagText.push('## TAMPER — guard machinery was modified', '', tamperText, '', 'Only the human can clear this: `sudo bun run gate:tamper:clear`', '')
  }

  for (const violation of board.violations) {
    const pathText = violation.line > 0 ? `${violation.path}:${violation.line}:${violation.column}` : violation.path
    flagText.push(`- **${pathText}** — \`${violation.rule}\` (${violation.guard}-guard)`)
    flagText.push(`  - ${violation.text}`)
    if (violation.suggestion) flagText.push(`  - fix: ${violation.suggestion}`)
  }

  flagText.push('', `Re-check: \`bun run gate:verdict\` · ${board.violations.length} violation(s) · checked ${dayjs(board.checkedAtMs).format('HH:mm:ss')}`, '')

  writeFileSync(flagPath, flagText.join('\n'), { mode: 0o644 })
}
```
