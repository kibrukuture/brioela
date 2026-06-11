import type { LexiconWord } from '../_types'
import { toolsDaemonLexicon, toolsReadingGateLexicon } from './tools'

export const toolsLexicon: LexiconWord[] = [...toolsDaemonLexicon, ...toolsReadingGateLexicon]
