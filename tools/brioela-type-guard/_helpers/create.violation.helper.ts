import ts from 'typescript'
import { getNodeLocation } from './source.location.helper'
import type { TypeViolation } from '../_types'

export function createViolation(input: {
  rule: string
  repoPath: string
  sourceFile: ts.SourceFile
  node: ts.Node
  message: string
  suggestion?: string
}): TypeViolation {
  const location = getNodeLocation(input.sourceFile, input.node)

  return {
    rule: input.rule,
    path: input.repoPath,
    line: location.line,
    column: location.column,
    message: input.message,
    suggestion: input.suggestion,
  }
}
