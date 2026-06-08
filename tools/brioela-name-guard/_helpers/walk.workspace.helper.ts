import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { checkedRoots, ignoredPathParts } from './name.guard.config.helper'
import { hasIgnoredPart, isInsideCheckedRoot, toRepoPath } from './path.helper'

export type WorkspaceEntry = {
  absolutePath: string
  repoPath: string
  kind: 'file' | 'directory'
}

export async function walkWorkspace(workspaceRoot: string): Promise<WorkspaceEntry[]> {
  const entries: WorkspaceEntry[] = []

  async function visit(absolutePath: string): Promise<void> {
    const repoPath = toRepoPath(workspaceRoot, absolutePath)

    if (repoPath && hasIgnoredPart(repoPath, ignoredPathParts)) return
    if (repoPath && !isInsideCheckedRoot(repoPath, checkedRoots)) return

    const dirents = await readdir(absolutePath, { withFileTypes: true })

    for (const dirent of dirents) {
      const childAbsolutePath = join(absolutePath, dirent.name)
      const childRepoPath = toRepoPath(workspaceRoot, childAbsolutePath)

      if (hasIgnoredPart(childRepoPath, ignoredPathParts)) continue
      if (!isInsideCheckedRoot(childRepoPath, checkedRoots)) continue

      if (dirent.isDirectory()) {
        entries.push({ absolutePath: childAbsolutePath, repoPath: childRepoPath, kind: 'directory' })
        await visit(childAbsolutePath)
      } else if (dirent.isFile()) {
        entries.push({ absolutePath: childAbsolutePath, repoPath: childRepoPath, kind: 'file' })
      }
    }
  }

  for (const root of checkedRoots) {
    await visit(join(workspaceRoot, root)).catch(() => undefined)
  }

  return entries.sort((a, b) => a.repoPath.localeCompare(b.repoPath))
}
