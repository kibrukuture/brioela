# Draft: _helpers/collect.identifier.declarations.helper.ts

Target: `tools/brioela-lexicon-guard/_helpers/collect.identifier.declarations.helper.ts`

```typescript
import ts from 'typescript'
import type { IdentifierDeclaration, IdentifierDeclarationKind } from '../_types'

export type CollectedIdentifierDeclaration = IdentifierDeclaration & {
  node: ts.Node
}

export function collectIdentifierDeclarations(sourceFile: ts.SourceFile): CollectedIdentifierDeclaration[] {
  const declarations: CollectedIdentifierDeclaration[] = []

  function collect(name: ts.Node | null, kind: IdentifierDeclarationKind): void {
    if (!name || !ts.isIdentifier(name)) return
    if (isExternalImportIdentifier(name)) return
    declarations.push({ name: name.text, kind, node: name })
  }

  function visit(node: ts.Node): void {
    if (ts.isClassDeclaration(node)) collect(node.name ?? null, 'class')
    if (ts.isFunctionDeclaration(node)) collect(node.name ?? null, 'function')
    if (ts.isInterfaceDeclaration(node)) collect(node.name, 'interface')
    if (ts.isTypeAliasDeclaration(node)) collect(node.name, 'type')
    if (ts.isEnumDeclaration(node)) collect(node.name, 'enum')
    if (ts.isVariableDeclaration(node)) collect(node.name, 'variable')
    if (ts.isParameter(node)) collect(node.name, 'parameter')
    if (ts.isPropertyDeclaration(node)) collect(node.name, 'property')
    if (ts.isPropertySignature(node)) collect(node.name, 'property')
    if (ts.isMethodDeclaration(node)) collect(node.name, 'method')
    if (ts.isMethodSignature(node)) collect(node.name, 'method')
    if (ts.isBindingElement(node)) collect(node.name, 'variable')

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return declarations
}

function isExternalImportIdentifier(node: ts.Identifier): boolean {
  return ts.isImportSpecifier(node.parent)
    || ts.isImportClause(node.parent)
    || ts.isNamespaceImport(node.parent)
}
```
