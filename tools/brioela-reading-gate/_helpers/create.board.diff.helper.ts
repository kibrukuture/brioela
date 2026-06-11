import type { BoardDiff, BoardViolation, GateBoard } from '../_types'

function createViolationKey(violation: BoardViolation): string {
  return [violation.guard, violation.rule, violation.path, violation.text].join('::')
}

export function createBoardDiff(previous: GateBoard | null, current: GateBoard): BoardDiff {
  if (previous === null) {
    return { added: current.violations, fixed: [], kept: [] }
  }

  const previousIndex = new Set(previous.violations.map(createViolationKey))
  const currentIndex = new Set(current.violations.map(createViolationKey))

  return {
    added: current.violations.filter((violation) => !previousIndex.has(createViolationKey(violation))),
    fixed: previous.violations.filter((violation) => !currentIndex.has(createViolationKey(violation))),
    kept: current.violations.filter((violation) => previousIndex.has(createViolationKey(violation))),
  }
}
