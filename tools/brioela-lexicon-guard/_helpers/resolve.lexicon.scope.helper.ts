export function resolveLexiconScopes(repoPath: string): string[] {
  const scopes = ['global']

  if (repoPath.startsWith('backend/')) scopes.push('backend', 'product')
  if (repoPath.startsWith('shared/')) scopes.push('shared', 'product')
  if (repoPath.startsWith('mobile/')) scopes.push('mobile', 'product')
  if (repoPath.startsWith('tools/')) scopes.push('tools')

  if (repoPath.includes('/agents/brain/')) scopes.push('brain')
  if (repoPath.includes('/database/')) scopes.push('database')
  if (repoPath.includes('brioela-lexicon-guard')) scopes.push('lexicon')

  return scopes
}
