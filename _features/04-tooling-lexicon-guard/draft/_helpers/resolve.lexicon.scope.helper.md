# Draft: _helpers/resolve.lexicon.scope.helper.ts

Target: `tools/brioela-lexicon-guard/_helpers/resolve.lexicon.scope.helper.ts`

```typescript
export function resolveLexiconScopes(repoPath: string): string[] {
  const scopes = ['global']

  if (repoPath.startsWith('backend/')) scopes.push('backend', 'product')
  if (repoPath.startsWith('shared/')) scopes.push('shared', 'product')
  if (repoPath.startsWith('mobile/')) scopes.push('mobile', 'product')
  if (repoPath.startsWith('tools/')) scopes.push('tools')

  if (repoPath.includes('/agents/brain/')) scopes.push('brain')
  if (repoPath.includes('/database/')) scopes.push('database')
  if (repoPath.includes('brioela-brain-')) scopes.push('brain', 'product')
  if (repoPath.includes('brioela-lexicon-guard')) scopes.push('lexicon')
  if (repoPath.includes('/_lexicon/backend/')) scopes.push('backend')
  if (repoPath.includes('/_lexicon/product/')) scopes.push('product')
  if (repoPath.includes('/_lexicon/tools/')) scopes.push('tools')

  return scopes
}
```
