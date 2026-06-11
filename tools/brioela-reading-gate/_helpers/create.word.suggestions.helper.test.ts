import { describe, expect, test } from 'bun:test'
import { createWordDistance, createWordSuggestions } from './create.word.suggestions.helper'

describe('createWordDistance', () => {
  test('identical words have distance zero', () => {
    expect(createWordDistance('socket', 'socket')).toBe(0)
  })

  test('one edit apart', () => {
    expect(createWordDistance('sock', 'socket')).toBe(2)
    expect(createWordDistance('verdct', 'verdict')).toBe(1)
  })
})

describe('createWordSuggestions', () => {
  test('finds nearby vocabulary within two edits', () => {
    expect(createWordSuggestions('verdct', ['verdict', 'session', 'board'])).toEqual(['verdict'])
  })

  test('exact matches and far words are excluded', () => {
    expect(createWordSuggestions('board', ['board'])).toEqual([])
    expect(createWordSuggestions('xyzzy', ['verdict', 'session'])).toEqual([])
  })
})
