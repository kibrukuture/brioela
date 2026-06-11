# Draft: _helpers/format.board.verdict.helper.ts

Target: `tools/brioela-reading-gate/_helpers/format.board.verdict.helper.ts`

```typescript
import { createWordSuggestions } from './create.word.suggestions.helper'
import type { BoardDiff, BoardViolation, GateBoard } from '../_types'

const red = '\x1b[31m'
const green = '\x1b[32m'
const yellow = '\x1b[33m'
const dim = '\x1b[2m'
const bold = '\x1b[1m'
const reset = '\x1b[0m'

const wordPattern = /unknown word '([a-z0-9]+)'/

function formatViolation(violation: BoardViolation, lexicon: string[]): string[] {
  const violationText: string[] = []
  const pathText = violation.line > 0 ? `${violation.path}:${violation.line}:${violation.column}` : violation.path

  violationText.push(`  ${red}${bold}✖${reset} ${bold}${pathText}${reset}`)
  violationText.push(`    ${dim}rule${reset}  ${yellow}${violation.rule}${reset} ${dim}(${violation.guard}-guard)${reset}`)
  violationText.push(`    ${dim}what${reset}  ${violation.text}`)

  const wordText = violation.text.match(wordPattern)?.[1]
  if (wordText && lexicon.length > 0) {
    const nearbyText = createWordSuggestions(wordText, lexicon)
    if (nearbyText.length > 0) {
      violationText.push(`    ${dim}near${reset}  ${green}did you mean: ${nearbyText.join(' · ')}${reset}`)
    }
  }

  if (violation.suggestion) {
    violationText.push(`    ${dim}fix${reset}   ${green}${violation.suggestion}${reset}`)
  }

  return violationText
}

export function formatBoardVerdict(
  board: GateBoard,
  diff: BoardDiff,
  lexicon: string[],
  verdictRuns: number[],
): string {
  const verdictText: string[] = ['']
  const count = board.violations.length

  if (diff.added.length > 0 || diff.fixed.length > 0) {
    const diffText: string[] = []
    if (diff.added.length > 0) diffText.push(`${red}${bold}${diff.added.length} NEW${reset}`)
    if (diff.fixed.length > 0) diffText.push(`${green}${diff.fixed.length} fixed${reset}`)
    if (diff.kept.length > 0) diffText.push(`${yellow}${diff.kept.length} remain${reset}`)
    verdictText.push(`  ${dim}change${reset}   ${diffText.join(` ${dim}·${reset} `)}`)
  }

  if (verdictRuns.length > 1) {
    verdictText.push(`  ${dim}trend${reset}    ${verdictRuns.join(' → ')}`)
  }

  if (count === 0) {
    verdictText.push(`  ${green}${bold}VERDICT — CLEAN${reset}  ${dim}all guards green · ${board.elapsedMs}ms${reset}`)
    verdictText.push('')
    return verdictText.join('\n')
  }

  verdictText.push('')
  for (const violation of diff.added) {
    verdictText.push(...formatViolation(violation, lexicon), '')
  }
  for (const violation of diff.kept) {
    verdictText.push(...formatViolation(violation, lexicon), '')
  }

  verdictText.push(`  ${red}${bold}VERDICT — BLOCKED · ${count} violation${count === 1 ? '' : 's'}${reset}  ${dim}${board.elapsedMs}ms${reset}`)
  verdictText.push(`  ${dim}Nothing lands while the board is red. Every entry above carries its own fix.${reset}`)
  verdictText.push('')
  return verdictText.join('\n')
}
```
