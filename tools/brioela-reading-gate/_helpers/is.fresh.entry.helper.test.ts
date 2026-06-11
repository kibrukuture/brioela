import { describe, expect, test } from 'bun:test'
import { isFreshEntry } from './is.fresh.entry.helper'
import type { ReadManifestEntry } from '../_types'

const entry: ReadManifestEntry = {
  file: 'implementable-specs/06-constraints.md',
  hash: 'a'.repeat(64),
  bytes: 512,
  readAtMs: 1_000_000,
  workspaceRoot: '/Users/test/brioela',
}

describe('isFreshEntry', () => {
  test('entry inside the ttl window is fresh', () => {
    expect(isFreshEntry(entry, entry.readAtMs + 1, 240 * 60_000)).toBe(true)
  })

  test('entry at or past the ttl window is stale', () => {
    expect(isFreshEntry(entry, entry.readAtMs + 240 * 60_000, 240 * 60_000)).toBe(false)
  })
})
