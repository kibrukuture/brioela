import type { LexiconWord } from '../_types'

export const backendLexicon: LexiconWord[] = [
  { word: 'align', kind: 'platform', scopes: ['backend'], meaning: 'Existing backend integration namespace.' },
  { word: 'cloudflare', kind: 'platform', scopes: ['backend'], meaning: 'Backend runtime platform.' },
  { word: 'column', kind: 'domain', scopes: ['backend'], meaning: 'Database table field.' },
  { word: 'ctx', kind: 'platform', scopes: ['backend'], meaning: 'Cloudflare Durable Object or Agent context parameter.' },
  { word: 'cursor', kind: 'domain', scopes: ['backend'], meaning: 'Stable ordered database position used to resume a large result set.' },
  { word: 'env', kind: 'platform', scopes: ['backend'], meaning: 'Cloudflare Worker environment bindings.' },
  { word: 'integer', kind: 'platform', scopes: ['backend'], meaning: 'SQLite integer column builder.' },
  { word: 'limit', kind: 'domain', scopes: ['backend'], meaning: 'Maximum number of records accepted or returned by a bounded data access command.' },
  { word: 'raw', kind: 'domain', scopes: ['backend'], meaning: 'Unparsed runtime boundary content that must remain explicit.' },
  { word: 'selected', kind: 'predicate', scopes: ['backend'], meaning: 'Chosen by a Drizzle query before final shaping.' },
  { word: 'table', kind: 'domain', scopes: ['backend'], meaning: 'Drizzle database table definition.' },
]
