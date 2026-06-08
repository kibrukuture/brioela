import type ts from 'typescript'

export type SourceLocation = {
  line: number
  column: number
}

export function getNodeLocation(sourceFile: ts.SourceFile, node: ts.Node): SourceLocation {
  const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
  return {
    line: position.line + 1,
    column: position.character + 1,
  }
}
