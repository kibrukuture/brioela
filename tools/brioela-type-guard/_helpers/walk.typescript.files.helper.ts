import { readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { checkedExtensions, checkedRoots, ignoredPathParts, ignoredRepoPaths } from './type.guard.config.helper'
import { hasIgnoredPart, isInsideCheckedRoot, toRepoPath } from './path.helper'

export type TypeScriptFileEntry = {
  absolutePath: string
  repoPath: string
}

export async function walkTypeScriptFiles(workspaceRoot: string): Promise<TypeScriptFileEntry[]> {
  const entries: TypeScriptFileEntry[] = []

  async function visit(absolutePath: string): Promise<void> {
    const dirents = await readdir(absolutePath, { withFileTypes: true })

    for (const dirent of dirents) {
      const childAbsolutePath = join(absolutePath, dirent.name)
      const childRepoPath = toRepoPath(workspaceRoot, childAbsolutePath)

      if (hasIgnoredPart(childRepoPath, ignoredPathParts)) continue
      if (!isInsideCheckedRoot(childRepoPath, checkedRoots)) continue
      if (ignoredRepoPaths.has(childRepoPath)) continue

      if (dirent.isDirectory()) {
        await visit(childAbsolutePath)
        continue
      }

      if (!dirent.isFile()) continue
      if (!isCheckedExtension(extname(childRepoPath))) continue

      entries.push({ absolutePath: childAbsolutePath, repoPath: childRepoPath })
    }
  }

  for (const root of checkedRoots) {
    await visit(join(workspaceRoot, root)).catch(() => undefined)
  }

  return entries.sort((a, b) => a.repoPath.localeCompare(b.repoPath))
}

function isCheckedExtension(extension: string): boolean {
  return checkedExtensions.some((checkedExtension) => checkedExtension === extension)
}
