import type { BoardViolation } from './board.violation.type'

export type BoardDiff = {
  added: BoardViolation[]
  fixed: BoardViolation[]
  kept: BoardViolation[]
}
