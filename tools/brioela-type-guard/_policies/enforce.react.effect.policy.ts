import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

const bannedReactEffectNames = new Set(['useEffect', 'useLayoutEffect'])

export const enforceReactEffectPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  if (!repoPath.startsWith('mobile/')) return []

  const violations: TypeViolation[] = []

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue
    if (statement.moduleSpecifier.text !== 'react') continue

    const namedBindings = statement.importClause?.namedBindings
    if (!namedBindings || !ts.isNamedImports(namedBindings)) continue

    for (const element of namedBindings.elements) {
      if (!bannedReactEffectNames.has(element.name.text)) continue

      violations.push(createViolation({
        rule: 'enforce-react-effect',
        repoPath,
        sourceFile,
        node: element.name,
        message: `Direct React effect hook \`${element.name.text}\` is illegal in mobile code.`,
        suggestion: 'Use `useIsomorphicLayoutEffect` from `usehooks-ts` inside a proper `.hook.ts` file.',
      }))
    }
  }

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && bannedReactEffectNames.has(node.expression.text)) {
      violations.push(createViolation({
        rule: 'enforce-react-effect',
        repoPath,
        sourceFile,
        node,
        message: `Direct React effect hook \`${node.expression.text}\` is illegal in mobile code.`,
        suggestion: 'Use `useIsomorphicLayoutEffect` from `usehooks-ts` inside a proper `.hook.ts` file.',
      }))
    }

    if (ts.isCallExpression(node) && isUseIsomorphicLayoutEffectCall(node) && !isHookFile(repoPath)) {
      violations.push(createViolation({
        rule: 'enforce-react-effect',
        repoPath,
        sourceFile,
        node,
        message: '`useIsomorphicLayoutEffect` is only allowed inside hook files.',
        suggestion: 'Move side-effect logic into a `use.*.hook.ts` file and let components consume the hook.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function isUseIsomorphicLayoutEffectCall(node: ts.CallExpression): boolean {
  return ts.isIdentifier(node.expression) && node.expression.text === 'useIsomorphicLayoutEffect'
}

function isHookFile(repoPath: string): boolean {
  return repoPath.endsWith('.hook.ts') || repoPath.endsWith('.hook.tsx') || repoPath.includes('/_hooks/')
}
