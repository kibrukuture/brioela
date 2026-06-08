export type LexiconWordKind = 'action' | 'domain' | 'grammar' | 'platform' | 'predicate' | 'role'

export type LexiconWord = {
  word: string
  kind: LexiconWordKind
  scopes: string[]
  meaning: string
}

export type IdentifierDeclarationKind = 'class' | 'enum' | 'function' | 'import' | 'interface' | 'method' | 'parameter' | 'property' | 'type' | 'variable'

export type IdentifierDeclaration = {
  name: string
  kind: IdentifierDeclarationKind
}
