import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

const rawApiMethodNames = new Set(['get', 'post', 'patch', 'put', 'del', 'delete'])

export const enforceContractBoundaryPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    if (ts.isCallExpression(node)) {
      if (isJsonBodyRead(node) && !isAllowedBoundaryFile(repoPath)) {
        violations.push(createViolation({
          rule: 'enforce-contract-boundary',
          repoPath,
          sourceFile,
          node,
          message: 'Raw request/response JSON reads are illegal outside contract boundary adapters.',
          suggestion: 'Use ts-rest contracts, `parseBody(c, CONTRACT)`, contract stream parsers, or a named schema decoder file.',
        }))
      }

      if (isRawApiMethodCall(node)) {
        violations.push(createViolation({
          rule: 'enforce-contract-boundary',
          repoPath,
          sourceFile,
          node,
          message: 'Raw generic API calls are illegal for new Brioela HTTP code.',
          suggestion: 'Use a ts-rest contract request or generated contract-backed hook.',
        }))
      }

      if (isBackendRawJsonResponse(node, repoPath)) {
        violations.push(createViolation({
          rule: 'enforce-contract-boundary',
          repoPath,
          sourceFile,
          node,
          message: 'Backend handlers must not return raw `c.json(apiSuccessResponse(...))` for contract-backed endpoints.',
          suggestion: 'Use `send(c, CONTRACT, status, payload)` so the response schema and Brioela UI policy are enforced.',
        }))
      }
    }

    if (ts.isStringLiteral(node) && isRouteString(node.text) && !isContractFile(repoPath)) {
      violations.push(createViolation({
        rule: 'enforce-contract-boundary',
        repoPath,
        sourceFile,
        node,
        message: 'Raw route strings are illegal outside shared contract files.',
        suggestion: 'Declare route paths in `shared/contracts/*.contract.ts` and consume the contract elsewhere.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function isJsonBodyRead(node: ts.CallExpression): boolean {
  const expression = node.expression
  if (!ts.isPropertyAccessExpression(expression)) return false
  if (expression.name.text !== 'json') return false
  return true
}

function isRawApiMethodCall(node: ts.CallExpression): boolean {
  const expression = node.expression
  if (!ts.isPropertyAccessExpression(expression)) return false
  if (!rawApiMethodNames.has(expression.name.text)) return false
  return ts.isIdentifier(expression.expression) && expression.expression.text === 'api'
}

function isBackendRawJsonResponse(node: ts.CallExpression, repoPath: string): boolean {
  if (!repoPath.startsWith('backend/src/api/')) return false

  const expression = node.expression
  if (!ts.isPropertyAccessExpression(expression)) return false
  if (expression.name.text !== 'json') return false

  return node.arguments.some((argument) => {
    if (!ts.isCallExpression(argument)) return false
    return ts.isIdentifier(argument.expression) && argument.expression.text === 'apiSuccessResponse'
  })
}

function isRouteString(value: string): boolean {
  return value.startsWith('/v1/') || value.startsWith('/api/')
}

function isContractFile(repoPath: string): boolean {
  return repoPath.startsWith('shared/contracts/') && repoPath.endsWith('.contract.ts')
}

function isAllowedBoundaryFile(repoPath: string): boolean {
  if (isContractFile(repoPath)) return true
  if (repoPath.includes('/contracts/')) return true
  if (repoPath.endsWith('.schema.ts')) return true
  if (repoPath.endsWith('.decoder.ts')) return true
  if (repoPath.endsWith('.contract.ts')) return true
  if (repoPath.endsWith('.webhook.ts')) return true
  if (repoPath.endsWith('.middleware.ts')) return true
  if (repoPath.includes('/webhooks/')) return true
  return false
}
