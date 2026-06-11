import type { ReadManifestEntry } from '../_types'

export function parseManifestEntry(text: string): ReadManifestEntry | null {
  const [readAtText, hashText, bytesText, workspaceText, fileText] = text.split('\t')

  if (typeof readAtText !== 'string' || typeof hashText !== 'string' || typeof bytesText !== 'string') return null
  if (typeof workspaceText !== 'string' || typeof fileText !== 'string') return null

  const readAtMs = Number(readAtText)
  const bytes = Number(bytesText)

  if (!Number.isInteger(readAtMs) || readAtMs <= 0) return null
  if (!Number.isInteger(bytes) || bytes < 0) return null
  if (hashText.length === 0 || workspaceText.length === 0 || fileText.length === 0) return null

  return {
    file: fileText,
    hash: hashText,
    bytes,
    readAtMs,
    workspaceRoot: workspaceText,
  }
}
