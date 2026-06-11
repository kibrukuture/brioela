import type { LexiconWord } from '../../_types'

export const toolsReadingGateLexicon: LexiconWord[] = [
  { word: 'reading', kind: 'domain', scopes: ['tools'], meaning: 'Proof-of-reading concept owned by the reading gate.' },
  { word: 'gate', kind: 'domain', scopes: ['tools'], meaning: 'Reading gate — proof-of-reading enforcement system.' },
  { word: 'hash', kind: 'domain', scopes: ['tools'], meaning: 'SHA-256 content digest proving which bytes were served.' },
  { word: 'fresh', kind: 'predicate', scopes: ['tools'], meaning: 'Read proof still inside the ttl window and hash-current.' },
  { word: 'socket', kind: 'platform', scopes: ['tools'], meaning: 'Unix domain socket transport for the gate daemon.' },
  { word: 'pid', kind: 'platform', scopes: ['tools'], meaning: 'Operating-system process id.' },
  { word: 'url', kind: 'platform', scopes: ['tools'], meaning: 'Parsed request locator for socket routing.' },
  { word: 'content', kind: 'domain', scopes: ['tools'], meaning: 'File bytes streamed through the gate into agent context.' },
  { word: 'bytes', kind: 'domain', scopes: ['tools'], meaning: 'Byte count of content served by the gate.' },
  { word: 'serve', kind: 'action', scopes: ['tools'], meaning: 'Listen and respond on a transport.' },
]
