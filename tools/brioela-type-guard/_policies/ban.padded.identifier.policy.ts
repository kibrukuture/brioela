import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypeViolation } from '../_types'
import type { TypePolicy } from './type.guard.policy'

const paddedSuffixes = [
  'Data',
  'Info',
  'Input',
  'Object',
  'Output',
  'Payload',
  'Request',
  'Response',
  'Result',
]

export const banPaddedIdentifierPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations: TypeViolation[] = []

  function visit(node: ts.Node): void {
    const name = declaredIdentifierName(node)

    if (name && hasPaddedSuffix(name)) {
      violations.push(createViolation({
        rule: 'ban-padded-identifier',
        repoPath,
        sourceFile,
        node,
        message: 'Padded identifier names are illegal because they hide the real domain noun.',
        suggestion: 'Name the thing what it is. Remove suffixes such as Result, Request, Response, Input, Output, Data, Info, Object, or Payload.',
      }))
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

function declaredIdentifierName(node: ts.Node): string | null {
  if (ts.isImportSpecifier(node)) return node.name.text
  if (ts.isExportSpecifier(node)) return node.name.text
  if (ts.isBindingElement(node) && ts.isIdentifier(node.name)) return node.name.text
  if (ts.isClassDeclaration(node)) return identifierText(node.name)
  if (ts.isFunctionDeclaration(node)) return identifierText(node.name)
  if (ts.isInterfaceDeclaration(node)) return node.name.text
  if (ts.isTypeAliasDeclaration(node)) return node.name.text
  if (ts.isEnumDeclaration(node)) return node.name.text
  if (ts.isVariableDeclaration(node)) return identifierText(node.name)
  if (ts.isParameter(node)) return identifierText(node.name)
  if (ts.isPropertyDeclaration(node)) return identifierText(node.name)
  if (ts.isPropertySignature(node)) return identifierText(node.name)
  if (ts.isMethodDeclaration(node)) return identifierText(node.name)
  if (ts.isMethodSignature(node)) return identifierText(node.name)
  return null
}

function identifierText(name: ts.Node | null): string | null {
  return ts.isIdentifier(name) ? name.text : null
}

function hasPaddedSuffix(name: string): boolean {
  return paddedSuffixes.some((suffix) => name.endsWith(suffix))
}
