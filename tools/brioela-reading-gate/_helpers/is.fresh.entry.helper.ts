import type { ReadManifestEntry } from '../_types'

export function isFreshEntry(entry: ReadManifestEntry, nowMs: number, ttlMs: number): boolean {
  return nowMs - entry.readAtMs < ttlMs
}
