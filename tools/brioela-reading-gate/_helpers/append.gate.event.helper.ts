import { appendFileSync } from 'node:fs'
import dayjs from 'dayjs'
import { gateEventsLogPath } from './gate.config.helper'

export function appendGateEvent(text: string): void {
  const whenText = dayjs().format('YYYY-MM-DD HH:mm:ss')
  appendFileSync(gateEventsLogPath, `[${whenText}] ${text}\n`, { mode: 0o644 })
}
