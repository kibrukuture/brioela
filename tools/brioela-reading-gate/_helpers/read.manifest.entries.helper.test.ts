import { describe, expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { appendReadEntry } from './append.read.entry.helper'
import { readManifestEntries } from './read.manifest.entries.helper'
import type { ReadManifestEntry } from '../_types'

const entry: ReadManifestEntry = {
  file: 'backend/src/agents/brain/_schemas/constraint.schema.ts',
  hash: 'a'.repeat(64),
  bytes: 2048,
  readAtMs: 1_000_000,
  workspaceRoot: '/Users/test/brioela',
}

describe('readManifestEntries', () => {
  test('returns empty for a missing manifest', () => {
    const folder = mkdtempSync(join(tmpdir(), 'gate-'))
    expect(readManifestEntries(join(folder, 'manifest.tsv'))).toEqual([])
  })

  test('append then read returns appended entries in order', () => {
    const folder = mkdtempSync(join(tmpdir(), 'gate-'))
    const manifestPath = join(folder, 'manifest.tsv')

    appendReadEntry(manifestPath, entry)
    appendReadEntry(manifestPath, { ...entry, file: 'implementable-specs/06-constraints.md' })

    const entries = readManifestEntries(manifestPath)
    expect(entries).toHaveLength(2)
    expect(entries[0]).toEqual(entry)
    expect(entries[1]?.file).toBe('implementable-specs/06-constraints.md')
  })
})
