import { readFile } from 'node:fs/promises'

export async function readFileIfExists(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf8')
  } catch (error) {
    void error
    return null
  }
}
