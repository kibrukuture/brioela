import type { LexiconWord } from '../../_types'

export const globalRuntimeLexicon: LexiconWord[] = [
  { word: 'runtime', kind: 'domain', scopes: ['global'], meaning: 'Executing system boundary for code and platform behavior.' },
  { word: 'agent', kind: 'role', scopes: ['global'], meaning: 'Stateful actor that owns AI behavior or durable runtime behavior.' },
  { word: 'app', kind: 'domain', scopes: ['global'], meaning: 'Application instance or app-level runtime surface.' },
  { word: 'backend', kind: 'domain', scopes: ['global'], meaning: 'Server-side Brioela runtime scope.' },
  { word: 'binding', kind: 'domain', scopes: ['global'], meaning: 'Named runtime dependency provided by a platform.' },
  { word: 'body', kind: 'domain', scopes: ['global'], meaning: 'Request or message body content.' },
  { word: 'boundary', kind: 'domain', scopes: ['global'], meaning: 'Explicit crossing point between trust zones or layers.' },
  { word: 'callable', kind: 'platform', scopes: ['global'], meaning: 'Agents SDK method exposed as typed RPC.' },
  { word: 'context', kind: 'domain', scopes: ['global'], meaning: 'Typed runtime request or execution context.' },
  { word: 'current', kind: 'domain', scopes: ['global'], meaning: 'Current runtime value or time.' },
  { word: 'effect', kind: 'domain', scopes: ['global'], meaning: 'Side effect or runtime impact.' },
  { word: 'email', kind: 'domain', scopes: ['global'], meaning: 'Email address or email delivery concept.' },
  { word: 'entity', kind: 'domain', scopes: ['global'], meaning: 'Object being inspected by a type guard.' },
  { word: 'environment', kind: 'domain', scopes: ['global'], meaning: 'Typed runtime environment shape.' },
  { word: 'env', kind: 'platform', scopes: ['global'], meaning: 'Runtime environment binding surface.' },
  { word: 'error', kind: 'domain', scopes: ['global'], meaning: 'Named failure state.' },
  { word: 'log', kind: 'domain', scopes: ['global'], meaning: 'Operational output record.' },
  { word: 'state', kind: 'domain', scopes: ['global'], meaning: 'Runtime state held by an actor or process.' },
]
