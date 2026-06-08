import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypePolicy } from './type.guard.policy'

type ImportBinding = {
  localName: string
  node: ts.Node
  declaration: ts.ImportDeclaration
}

export const enforceTypeImportPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const importedValues = collectValueImports(sourceFile)
  if (importedValues.length === 0) return []

  const valueUses = new Set<string>()
  const typeUses = new Set<string>()

  function visit(node: ts.Node): void {
    if (ts.isImportDeclaration(node)) return

    if (ts.isIdentifier(node) && importedValues.some((binding) => binding.localName === node.text)) {
      if (isInsideTypePosition(node)) {
        typeUses.add(node.text)
      } else {
        valueUses.add(node.text)
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  return importedValues.flatMap((binding) => {
    if (!typeUses.has(binding.localName) || valueUses.has(binding.localName)) return []

    return [createViolation({
      rule: 'enforce-type-import',
      repoPath,
      sourceFile,
      node: binding.node,
      message: `\`${binding.localName}\` is imported as a runtime value but only used as a type.`,
      suggestion: 'Use `import type` or an inline `type` import specifier.',
    })]
  })
}

function collectValueImports(sourceFile: ts.SourceFile): ImportBinding[] {
  const bindings: ImportBinding[] = []

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    const clause = statement.importClause
    if (!clause || clause.isTypeOnly) continue

    if (clause.name) {
      bindings.push({ localName: clause.name.text, node: clause.name, declaration: statement })
    }

    const namedBindings = clause.namedBindings
    if (!namedBindings) continue

    if (ts.isNamespaceImport(namedBindings)) {
      bindings.push({ localName: namedBindings.name.text, node: namedBindings.name, declaration: statement })
      continue
    }

    for (const element of namedBindings.elements) {
      if (element.isTypeOnly) continue
      bindings.push({ localName: element.name.text, node: element.name, declaration: statement })
    }
  }

  return bindings
}

function isInsideTypePosition(node: ts.Node): boolean {
  let current: ts.Node | undefined = node

  while (current.parent) {
    current = current.parent

    if (isValueBoundary(current)) return false
    if (isTypeNode(current)) return true
  }

  return false
}

function isTypeNode(node: ts.Node): boolean {
	return ts.isTypeNode(node)
		|| ts.isInterfaceDeclaration(node)
		|| ts.isTypeAliasDeclaration(node)
		|| ts.isImportTypeNode(node)
}

function isValueBoundary(node: ts.Node): boolean {
	return ts.isExpressionStatement(node)
		|| ts.isCallExpression(node)
		|| ts.isNewExpression(node)
		|| isClassExtendsExpression(node)
		|| ts.isPropertyAccessExpression(node)
    || ts.isElementAccessExpression(node)
    || ts.isJsxOpeningElement(node)
    || ts.isJsxSelfClosingElement(node)
		|| ts.isJsxClosingElement(node)
}

function isClassExtendsExpression(node: ts.Node): boolean {
	if (!ts.isExpressionWithTypeArguments(node)) return false
	if (!ts.isHeritageClause(node.parent)) return false
	if (node.parent.token !== ts.SyntaxKind.ExtendsKeyword) return false
	return ts.isClassDeclaration(node.parent.parent)
}
