import ts from 'typescript'
import type { TypeViolation } from '../_types'

export type TypePolicyInput = {
  repoPath: string
  sourceFile: ts.SourceFile
}

export type TypePolicy = (input: TypePolicyInput) => TypeViolation[]
