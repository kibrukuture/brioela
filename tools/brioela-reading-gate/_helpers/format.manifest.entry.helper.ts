import type { ReadManifestEntry } from '../_types'

export function formatManifestEntry(entry: ReadManifestEntry): string {
  return [
    String(entry.readAtMs),
    entry.hash,
    String(entry.bytes),
    entry.workspaceRoot,
    entry.file,
  ].join('\t')
}
