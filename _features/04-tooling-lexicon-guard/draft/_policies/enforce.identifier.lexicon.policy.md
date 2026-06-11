# Draft: _policies/enforce.identifier.lexicon.policy.ts

Target: `tools/brioela-lexicon-guard/_policies/enforce.identifier.lexicon.policy.ts`

```typescript
import { collectIdentifierDeclarations, createViolation, loadLexicon, resolveLexiconScopes, splitIdentifierWords } from '../_helpers'
import type { IdentifierDeclarationKind, LexiconViolation, LexiconWordKind } from '../_types'
import type { LexiconPolicy } from './lexicon.guard.policy'

const bannedPaddingWords = new Set([
  'data',
  'info',
  'input',
  'object',
  'output',
  'payload',
  'request',
  'response',
  'result',
])

const grammarWords = new Set(['from', 'to'])

export const enforceIdentifierLexiconPolicy: LexiconPolicy = ({ repoPath, sourceFile }) => {
  const scopes = resolveLexiconScopes(repoPath)
  const lexicon = loadLexicon(scopes)
  const violations: LexiconViolation[] = []

  for (const declaration of collectIdentifierDeclarations(sourceFile)) {
    const words = splitIdentifierWords(declaration.name)
    if (words.length === 0) continue

    for (const word of words) {
      if (bannedPaddingWords.has(word)) {
        violations.push(createViolation({
          rule: 'ban-padding-word',
          repoPath,
          sourceFile,
          node: declaration.node,
          message: `Identifier '${declaration.name}' uses padded word '${word}'.`,
          suggestion: 'Name the exact domain thing. Do not use padding words such as result, request, response, input, output, data, info, object, or payload.',
        }))
      }

      if (!lexicon.words.has(word)) {
        violations.push(createViolation({
          rule: 'enforce-identifier-lexicon',
          repoPath,
          sourceFile,
          node: declaration.node,
          message: `Identifier '${declaration.name}' contains unknown word '${word}' for scopes ${scopes.join(', ')}.`,
          suggestion: 'Use existing Brioela vocabulary, or add this real concept to the scoped lexicon with meaning and ownership.',
        }))
      }
    }

    const grammarViolation = validateDeclarationGrammar(declaration.kind, words, (word) => lexicon.words.get(word)?.kind ?? 'grammar')
    if (grammarViolation) {
      violations.push(createViolation({
        rule: 'enforce-identifier-grammar',
        repoPath,
        sourceFile,
        node: declaration.node,
        message: `Identifier '${declaration.name}' has invalid ${declaration.kind} grammar: ${grammarViolation}.`,
        suggestion: 'Use action + domain for functions/methods, predicate + domain for booleans, and domain noun phrases for types/classes/interfaces.',
      }))
    }
  }

  return violations
}

function validateDeclarationGrammar(
  kind: IdentifierDeclarationKind,
  words: string[],
  wordKind: (word: string) => LexiconWordKind,
): string | null {
  const firstWord = words[0]
  if (!firstWord) return null

  if (kind === 'function' || kind === 'method') {
    if (wordKind(firstWord) === 'action') return null
    if (wordKind(firstWord) === 'predicate') return null
    return 'functions and methods must begin with an action or predicate word'
  }

  if (kind === 'class' || kind === 'interface' || kind === 'type' || kind === 'enum') {
    if (hasDomainWord(words, wordKind)) return null
    return 'type-level declarations must contain a domain word'
  }

  if (kind === 'variable' || kind === 'property' || kind === 'parameter') {
    if (words.every((word) => grammarWords.has(word))) return 'identifiers cannot be only grammar words'
    return null
  }

  return null
}

function hasDomainWord(words: string[], wordKind: (word: string) => LexiconWordKind): boolean {
  return words.some((word) => {
    const kind = wordKind(word)
    return kind === 'domain' || kind === 'role' || kind === 'platform'
  })
}
```
