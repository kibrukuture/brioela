import ts from 'typescript'

export function getNodeLocation(sourceFile: ts.SourceFile, node: ts.Node): { line: number; column: number } {
  const location = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return {
    line: location.line + 1,
    column: location.character + 1,
  }
}
