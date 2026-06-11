import { existsSync, readFileSync } from 'node:fs'
import { gateHeartbeatPath, gatePublicKeyPath, heartbeatTtlMs } from './gate.config.helper'
import { checkGateSignature } from './check.gate.signature.helper'
import { readCurrentEpochMs } from './read.current.epoch.ms.helper'

export function checkGateHeartbeat(heartbeatPath = gateHeartbeatPath, keyPath = gatePublicKeyPath): boolean {
  if (!existsSync(heartbeatPath)) return false

  const [whenText, signature] = readFileSync(heartbeatPath, 'utf8').trim().split(' ')
  if (typeof whenText !== 'string' || typeof signature !== 'string') return false

  const whenMs = Number(whenText)
  if (!Number.isInteger(whenMs)) return false
  if (readCurrentEpochMs() - whenMs > heartbeatTtlMs) return false

  return checkGateSignature(whenText, signature, keyPath)
}
