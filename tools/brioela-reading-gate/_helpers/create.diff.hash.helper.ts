export function createDiffHash(workspaceRoot: string): string {
  const gitDiff = Bun.spawnSync(['git', 'diff', '--cached', '--no-color'], { cwd: workspaceRoot })
  return Bun.SHA256.hash(gitDiff.stdout, 'hex')
}
