import type { LexiconWord } from '../_types'
import { backendCloudflareLexicon, backendDatabaseLexicon, backendExecutableLexicon } from './backend'

export const backendLexicon: LexiconWord[] = [...backendCloudflareLexicon, ...backendDatabaseLexicon, ...backendExecutableLexicon]
