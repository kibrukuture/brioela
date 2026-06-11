# Draft: _helpers/create.diff.hash.helper.ts

Target: `tools/brioela-reading-gate/_helpers/create.diff.hash.helper.ts`

```typescript
export function createDiffHash(workspaceRoot: string): string {
  const gitDiff = Bun.spawnSync(['git', 'diff', '--cached', '--no-color'], { cwd: workspaceRoot })
  return Bun.SHA256.hash(gitDiff.stdout, 'hex')
}
```
