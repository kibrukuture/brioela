import type { LexiconWord } from '../../_types'

export const productSessionsLexicon: LexiconWord[] = [
  { word: 'alarm', kind: 'domain', scopes: ['product'], meaning: 'Brain scheduled wake or user-facing reminder work item.' },
  { word: 'alarms', kind: 'domain', scopes: ['product'], meaning: 'Many Brain scheduled wake or reminder work items.' },
  { word: 'scheduled', kind: 'predicate', scopes: ['product'], meaning: 'Planned to run at a future Brain wake time.' },
  { word: 'session', kind: 'domain', scopes: ['product'], meaning: 'One bounded user, agent, background, or cooking interaction.' },
  { word: 'sessions', kind: 'domain', scopes: ['product'], meaning: 'Many bounded user, agent, background, or cooking interactions.' },
  { word: 'turn', kind: 'domain', scopes: ['product'], meaning: 'One ordered message or tool exchange within a session.' },
  { word: 'turns', kind: 'domain', scopes: ['product'], meaning: 'Many ordered messages or tool exchanges within a session.' },
]
