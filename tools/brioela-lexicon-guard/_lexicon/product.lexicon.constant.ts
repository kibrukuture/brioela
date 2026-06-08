import type { LexiconWord } from '../_types'
import {
  productBrainLexicon,
  productConstraintsLexicon,
  productFoodLexicon,
  productMemoryLexicon,
  productMigrationLexicon,
  productSessionsLexicon,
  productSkillsLexicon,
} from './product'

export const productLexicon: LexiconWord[] = [
  ...productBrainLexicon,
  ...productConstraintsLexicon,
  ...productFoodLexicon,
  ...productMemoryLexicon,
  ...productMigrationLexicon,
  ...productSessionsLexicon,
  ...productSkillsLexicon,
]
