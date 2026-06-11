import { describe, expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkGateSignature } from './check.gate.signature.helper'
import { createGateKey } from './create.gate.key.helper'
import { signGateText } from './sign.gate.text.helper'

describe('gate signatures', () => {
  test('sign then check round trip, wrong text rejected', () => {
    const folder = mkdtempSync(join(tmpdir(), 'gate-key-'))
    const privatePath = join(folder, 'gate.key')
    const publicPath = join(folder, 'gate.pub')

    createGateKey(privatePath, publicPath)

    const receiptText = 'receipt abc123 1000'
    const signature = signGateText(receiptText, privatePath)

    expect(checkGateSignature(receiptText, signature, publicPath)).toBe(true)
    expect(checkGateSignature('receipt FORGED 1000', signature, publicPath)).toBe(false)
    expect(checkGateSignature(receiptText, signature, join(folder, 'missing.pub'))).toBe(false)
  })
})
