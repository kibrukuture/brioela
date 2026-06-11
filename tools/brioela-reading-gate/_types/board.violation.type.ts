export type BoardViolation = {
  guard: 'name' | 'type' | 'lexicon'
  rule: string
  path: string
  line: number
  column: number
  text: string
  suggestion: string | null
}
