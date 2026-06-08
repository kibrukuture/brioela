import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

export const enforceContractSpinePolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  if (isForbiddenApiFile(repoPath)) {
    violations.push(createViolation({
      rule: 'enforce-contract-spine',
      repoPath,
      sourceFile,
      node: sourceFile,
      message: 'Normal `.api.ts` files are illegal for ts-rest product endpoints.',
      suggestion: 'Use `mobile/network/tsr.ts` plus feature hooks wrapping generated ts-rest hooks. `.api.ts` is only for non-standard boundaries.',
    }))
  }

  if (isContractFile(repoPath) && !hasContractTestPair(sourceFile.fileName)) {
    violations.push(createViolation({
      rule: 'enforce-contract-spine',
      repoPath,
      sourceFile,
      node: sourceFile,
      message: 'Every contract file must have a contract test pair.',
      suggestion: 'Add a nearby `.test.ts` covering valid input, invalid input, response parsing, Brioela UI policy, and stable `contractKey`.',
    }))
  }

  function visit(node: ts.Node): void {
    if (ts.isPropertyAccessExpression(node) && isTsrUsage(node) && !isAllowedTsrUsageFile(repoPath)) {
      violations.push(createViolation({
        rule: 'enforce-contract-spine',
        repoPath,
        sourceFile,
        node,
        message: 'Direct `tsr.*` usage is illegal outside ts-rest setup and feature hook files.',
        suggestion: 'Wrap generated ts-rest hooks in `mobile/features/*/_hooks/` or `mobile/features/*/*.hook.ts`.',
      }))
    }

    if (ts.isCallExpression(node) && isTanStackQueryOrMutation(node) && !callContainsContractKey(node)) {
      violations.push(createViolation({
        rule: 'enforce-contract-spine',
        repoPath,
        sourceFile,
        node,
        message: 'TanStack query/mutation calls must use contract-derived keys for product endpoints.',
        suggestion: 'Use `contractKey(API_CONTRACT.feature.endpoint, input)` for `queryKey` or `mutationKey`.',
      }))
    }

    if (ts.isCallExpression(node) && isInitTsrReactQueryCall(node) && !tsrSetupIsStrict(node)) {
      violations.push(createViolation({
        rule: 'enforce-contract-spine',
        repoPath,
        sourceFile,
        node,
        message: '`initTsrReactQuery` must validate responses and reject unknown statuses.',
        suggestion: 'Set `validateResponse: true`, `throwOnUnknownStatus: true`, and initialize from `API_CONTRACT`.',
      }))
    }

    if (ts.isCallExpression(node) && isFetchRequestHandlerCall(node) && !fetchHandlerIsStrict(node)) {
      violations.push(createViolation({
        rule: 'enforce-contract-spine',
        repoPath,
        sourceFile,
        node,
        message: '`fetchRequestHandler` must run with response validation.',
        suggestion: 'Pass `options: { responseValidation: true }` and mount a shared `API_CONTRACT` contract.',
      }))
    }

    if (ts.isObjectLiteralExpression(node) && looksLikeContractEndpoint(node) && !contractEndpointIsStrict(node)) {
      violations.push(createViolation({
        rule: 'enforce-contract-spine',
        repoPath,
        sourceFile,
        node,
        message: 'Contract endpoints must include strict status codes, responses, metadata.id, and Brioela UI policy metadata.',
        suggestion: 'Add `strictStatusCodes: true`, `responses`, and `metadata: { id, brioela_generative_ui }`.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function isForbiddenApiFile(repoPath: string): boolean {
  if (!repoPath.startsWith('mobile/')) return false
  if (!repoPath.endsWith('.api.ts')) return false
  return !repoPath.includes('/websocket/')
    && !repoPath.includes('/upload')
    && !repoPath.includes('/download')
    && !repoPath.includes('/native')
}

function isContractFile(repoPath: string): boolean {
  return repoPath.startsWith('shared/contracts/') && repoPath.endsWith('.contract.ts')
}

function hasContractTestPair(absolutePath: string): boolean {
  const folder = dirname(absolutePath)
  const fileName = absolutePath.split('/').at(-1)
  if (fileName === undefined) return false
  const baseName = fileName.replace(/\.ts$/, '')
  return existsSync(join(folder, `${baseName}.test.ts`))
}

function isTsrUsage(node: ts.PropertyAccessExpression): boolean {
  return ts.isIdentifier(node.expression) && node.expression.text === 'tsr'
}

function isAllowedTsrUsageFile(repoPath: string): boolean {
  if (repoPath === 'mobile/network/tsr.ts') return true
  if (!repoPath.startsWith('mobile/features/')) return false
  return repoPath.endsWith('.hook.ts') || repoPath.endsWith('.hook.tsx') || repoPath.includes('/_hooks/')
}

function isTanStackQueryOrMutation(node: ts.CallExpression): boolean {
  const expression = node.expression
  if (ts.isIdentifier(expression)) {
    return expression.text === 'useQuery' || expression.text === 'useMutation'
  }
  if (!ts.isPropertyAccessExpression(expression)) return false
  return expression.name.text === 'useQuery' || expression.name.text === 'useMutation'
}

function callContainsContractKey(node: ts.CallExpression): boolean {
  return node.arguments.some((argument) => textContains(argument, 'contractKey'))
}

function isInitTsrReactQueryCall(node: ts.CallExpression): boolean {
  return ts.isIdentifier(node.expression) && node.expression.text === 'initTsrReactQuery'
}

function tsrSetupIsStrict(node: ts.CallExpression): boolean {
  return node.arguments.some((argument) => textContains(argument, 'API_CONTRACT'))
    && node.arguments.some((argument) => objectHasTrueProperty(argument, 'validateResponse'))
    && node.arguments.some((argument) => objectHasTrueProperty(argument, 'throwOnUnknownStatus'))
}

function isFetchRequestHandlerCall(node: ts.CallExpression): boolean {
  return ts.isIdentifier(node.expression) && node.expression.text === 'fetchRequestHandler'
}

function fetchHandlerIsStrict(node: ts.CallExpression): boolean {
  return node.arguments.some((argument) => textContains(argument, 'API_CONTRACT'))
    && node.arguments.some((argument) => objectHasTrueProperty(argument, 'responseValidation'))
}

function looksLikeContractEndpoint(node: ts.ObjectLiteralExpression): boolean {
  return hasProperty(node, 'method') && hasProperty(node, 'path')
}

function contractEndpointIsStrict(node: ts.ObjectLiteralExpression): boolean {
  return hasTrueProperty(node, 'strictStatusCodes')
    && hasProperty(node, 'responses')
    && textContains(node, 'metadata')
    && textContains(node, 'id')
    && textContains(node, 'brioela_generative_ui')
}

function hasProperty(node: ts.ObjectLiteralExpression, propertyName: string): boolean {
  return node.properties.some((property) => getPropertyName(property) === propertyName)
}

function hasTrueProperty(node: ts.ObjectLiteralExpression, propertyName: string): boolean {
  return node.properties.some((property) => {
    if (!ts.isPropertyAssignment(property)) return false
    if (getPropertyName(property) !== propertyName) return false
    return property.initializer.kind === ts.SyntaxKind.TrueKeyword
  })
}

function objectHasTrueProperty(node: ts.Node, propertyName: string): boolean {
  if (ts.isObjectLiteralExpression(node) && hasTrueProperty(node, propertyName)) return true
  let found = false

  function visit(child: ts.Node): void {
    if (found) return
    if (ts.isObjectLiteralExpression(child) && hasTrueProperty(child, propertyName)) {
      found = true
      return
    }
    ts.forEachChild(child, visit)
  }

  ts.forEachChild(node, visit)
  return found
}

function getPropertyName(property: ts.ObjectLiteralElementLike): string | null {
  const name = property.name
  if (!name) return null
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text
  return null
}

function textContains(node: ts.Node, text: string): boolean {
  return node.getText(node.getSourceFile()).includes(text)
}
