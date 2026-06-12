# Draft: tools/brioela-type-guard/_policies/ban.any.policy.ts

Target: `tools/brioela-type-guard/_policies/ban.any.policy.ts`

```
import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypePolicy } from './type.guard.policy'
import type { TypeViolation } from '../_types'

export const banAnyPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      violations.push(createViolation({
        rule: 'ban-any',
        repoPath,
        sourceFile,
        node,
        message: '`any` is illegal in Brioela TypeScript.',
        suggestion: 'Use `unknown` at boundaries, then narrow with a schema, type guard, or explicit domain type.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}
```
