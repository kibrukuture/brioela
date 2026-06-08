import ts from 'typescript'
import { createViolation } from '../_helpers/create.violation.helper'
import type { TypePolicy } from './type.guard.policy'

const bannedDirectives = [
  '@ts-ignore',
  '@ts-nocheck',
  '@ts-expect-error',
  'eslint-disable',
] as const

export const banUnsafeCommentPolicy: TypePolicy = ({ repoPath, sourceFile }) => {
  const violations = []
  const text = sourceFile.getFullText()
  const commentRanges = [
    ...(ts.getLeadingCommentRanges(text, 0) ?? []),
    ...findCommentRanges(text),
  ]

  for (const range of commentRanges) {
    const commentText = text.slice(range.pos, range.end)
    const directive = bannedDirectives.find((candidate) => commentText.includes(candidate))
    if (!directive) continue

    violations.push(createViolation({
      rule: 'ban-unsafe-comment',
      repoPath,
      sourceFile,
      node: sourceFile,
      message: `Unsafe suppression comment \`${directive}\` is illegal.`,
      suggestion: 'Fix the type problem directly. If a third-party boundary is bad, wrap it with a typed adapter.',
    }))
  }

  return dedupeByLine(violations)
}

function findCommentRanges(text: string): ts.CommentRange[] {
  const ranges: ts.CommentRange[] = []
  const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, text)

  while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) {
    const kind = scanner.getToken()
    if (kind === ts.SyntaxKind.SingleLineCommentTrivia || kind === ts.SyntaxKind.MultiLineCommentTrivia) {
      ranges.push({ pos: scanner.getTokenPos(), end: scanner.getTextPos(), kind })
    }
  }

  return ranges
}

function dedupeByLine<T extends { line: number; column: number; message: string }>(violations: T[]): T[] {
  const seen = new Set<string>()
  return violations.filter((violation) => {
    const key = `${violation.line}:${violation.column}:${violation.message}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
