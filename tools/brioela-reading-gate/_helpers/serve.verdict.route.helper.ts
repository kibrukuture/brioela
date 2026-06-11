import { existsSync, readFileSync, appendFileSync } from 'node:fs'
import { loadLexicon } from '../../brioela-lexicon-guard/_helpers/load.lexicon.helper'
import { appendGateEvent } from './append.gate.event.helper'
import { createBoardDiff } from './create.board.diff.helper'
import { formatBoardVerdict } from './format.board.verdict.helper'
import { gateReceiptLogPath, gateTamperPath } from './gate.config.helper'
import { listVerdictRuns, readPreviousBoard, writeBoardState, writeWatchText } from '../gate.state.store'
import { readCurrentEpochMs } from './read.current.epoch.ms.helper'
import { runGuardBoard } from './run.guard.board.helper'
import { signGateText } from './sign.gate.text.helper'
import { writeRedFlag } from './write.red.flag.helper'

const lexiconList = [...loadLexicon(['global', 'backend', 'shared', 'mobile', 'product', 'tools', 'brain', 'database', 'lexicon']).words.keys()]

export async function serveVerdictRoute(workspaceRoot: string, diffHash: string | null): Promise<Response> {
  if (existsSync(gateTamperPath)) {
    const tamperText = readFileSync(gateTamperPath, 'utf8')
    const blockedText = [
      '',
      '  VERDICT — BLOCKED · TAMPER',
      '  Guard machinery was modified while the daemon was watching:',
      '',
      tamperText.trimEnd(),
      '',
      '  Only the human can clear this: sudo bun run gate:tamper:clear',
      '',
    ].join('\n')
    writeWatchText(`${blockedText}\n`)
    return new Response(blockedText, { status: 423, headers: { 'x-gate-clean': 'false' } })
  }

  const board = await runGuardBoard(workspaceRoot)
  const diff = createBoardDiff(readPreviousBoard(), board)
  writeBoardState(board)

  const verdictText = formatBoardVerdict(board, diff, lexiconList, listVerdictRuns())
  writeRedFlag(workspaceRoot, board, null)
  appendGateEvent(`verdict ${board.violations.length === 0 ? 'clean' : `blocked ${board.violations.length}`} (+${diff.added.length} new, -${diff.fixed.length} fixed) ${board.elapsedMs}ms`)
  writeWatchText(`${verdictText}\n`)

  const isClean = board.violations.length === 0

  if (isClean && diffHash !== null) {
    const receiptText = `receipt ${diffHash} ${readCurrentEpochMs()}`
    const signature = signGateText(receiptText)
    appendFileSync(gateReceiptLogPath, `${receiptText} ${signature}\n`, { mode: 0o644 })
    return new Response(verdictText, {
      status: 200,
      headers: {
        'x-gate-clean': 'true',
        'x-gate-receipt': receiptText,
        'x-gate-signature': signature,
      },
    })
  }

  return new Response(verdictText, {
    status: isClean ? 200 : 409,
    headers: { 'x-gate-clean': isClean ? 'true' : 'false' },
  })
}
