import { runTypeGuard } from '../../brioela-type-guard/_helpers/run.type.guard.helper'
import { runNameGuard } from '../../brioela-name-guard/_helpers/run.name.guard.helper'
import { runLexiconGuard } from '../../brioela-lexicon-guard/_helpers/run.lexicon.guard.helper'
import { readCurrentEpochMs } from './read.current.epoch.ms.helper'
import type { BoardViolation, GateBoard } from '../_types'

export async function runGuardBoard(workspaceRoot: string): Promise<GateBoard> {
  const startedAtMs = readCurrentEpochMs()

  const [typeViolations, nameViolations, lexiconViolations] = await Promise.all([
    runTypeGuard(workspaceRoot, 'check'),
    runNameGuard(workspaceRoot, 'check'),
    runLexiconGuard(workspaceRoot, 'check'),
  ])

  const violations: BoardViolation[] = [
    ...nameViolations.map((entry): BoardViolation => ({
      guard: 'name',
      rule: entry.rule,
      path: entry.path,
      line: 0,
      column: 0,
      text: entry.message,
      suggestion: entry.suggestion ?? null,
    })),
    ...typeViolations.map((entry): BoardViolation => ({
      guard: 'type',
      rule: entry.rule,
      path: entry.path,
      line: entry.line,
      column: entry.column,
      text: entry.message,
      suggestion: entry.suggestion ?? null,
    })),
    ...lexiconViolations.map((entry): BoardViolation => ({
      guard: 'lexicon',
      rule: entry.rule,
      path: entry.path,
      line: entry.line,
      column: entry.column,
      text: entry.message,
      suggestion: entry.suggestion ?? null,
    })),
  ]

  const checkedAtMs = readCurrentEpochMs()
  return { violations, checkedAtMs, elapsedMs: checkedAtMs - startedAtMs }
}
