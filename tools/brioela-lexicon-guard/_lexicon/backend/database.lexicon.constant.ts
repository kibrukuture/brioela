import type { LexiconWord } from '../../_types'

export const backendDatabaseLexicon: LexiconWord[] = [
  { word: 'column', kind: 'domain', scopes: ['backend'], meaning: 'Database table field.' },
  { word: 'cursor', kind: 'domain', scopes: ['backend'], meaning: 'Stable ordered database position used to resume a large result set.' },
  { word: 'integer', kind: 'platform', scopes: ['backend'], meaning: 'SQLite integer column builder.' },
  { word: 'limit', kind: 'domain', scopes: ['backend'], meaning: 'Maximum number of records accepted or returned by a bounded data access command.' },
  { word: 'raw', kind: 'domain', scopes: ['backend'], meaning: 'Unparsed runtime boundary content that must remain explicit.' },
  { word: 'selected', kind: 'predicate', scopes: ['backend'], meaning: 'Chosen by a Drizzle query before final shaping.' },
  { word: 'table', kind: 'domain', scopes: ['backend'], meaning: 'Drizzle database table definition.' },
]
