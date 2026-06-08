import { readFile } from 'node:fs/promises'

export async function readFileIfExists(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8')
  } catch {
    return undefined
  }
}
