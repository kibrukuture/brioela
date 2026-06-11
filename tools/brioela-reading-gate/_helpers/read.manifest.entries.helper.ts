import { existsSync, readFileSync } from 'node:fs'
import { parseManifestEntry } from './parse.manifest.entry.helper'
import type { ReadManifestEntry } from '../_types'

export function readManifestEntries(manifestPath: string): ReadManifestEntry[] {
  if (!existsSync(manifestPath)) return []

  const entries: ReadManifestEntry[] = []

  for (const text of readFileSync(manifestPath, 'utf8').split('\n')) {
    if (text.length === 0) continue
    const entry = parseManifestEntry(text)
    if (entry) entries.push(entry)
  }

  return entries
}
