import type { LexiconWord } from '../_types'
import { backendCloudflareLexicon, backendDatabaseLexicon } from './backend'

export const backendLexicon: LexiconWord[] = [...backendCloudflareLexicon, ...backendDatabaseLexicon]
