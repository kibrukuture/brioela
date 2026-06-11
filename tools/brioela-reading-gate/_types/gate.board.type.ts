import type { BoardViolation } from './board.violation.type'

export type GateBoard = {
  violations: BoardViolation[]
  checkedAtMs: number
  elapsedMs: number
}
