import type { LexiconWord } from '../_types'
import {
  globalActionLexicon,
  globalCoreLexicon,
  globalFilesystemLexicon,
  globalGrammarLexicon,
  globalGuardLexicon,
  globalOriginLexicon,
  globalPlatformLexicon,
  globalPredicateLexicon,
  globalRoleLexicon,
  globalRuntimeLexicon,
  globalStatusLexicon,
  globalStorageLexicon,
  globalTimeLexicon,
} from './global'

export const globalLexicon: LexiconWord[] = [
  ...globalActionLexicon,
  ...globalCoreLexicon,
  ...globalFilesystemLexicon,
  ...globalGrammarLexicon,
  ...globalGuardLexicon,
  ...globalOriginLexicon,
  ...globalPlatformLexicon,
  ...globalPredicateLexicon,
  ...globalRoleLexicon,
  ...globalRuntimeLexicon,
  ...globalStatusLexicon,
  ...globalStorageLexicon,
  ...globalTimeLexicon,
]
