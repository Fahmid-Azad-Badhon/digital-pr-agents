import { describe, it, expect } from 'vitest'
import { addThoughtTags } from '@/lib/llm/utils/addThoughtTags'
import { containsForbiddenWords } from '@/lib/llm/utils/forbiddenWordsChecker'
import { sanitizeAndParseJSON } from '@/lib/llm/utils/jsonRepair'
import { isZombieResponse } from '@/lib/llm/utils/zombieDetector'

const expectedSuffix = `

Before giving your final answer, wrap your reasoning in <thought> tags:
<thought>
Explain your reasoning process, what data you're using, and why you're making certain decisions.
</thought>

Now provide your final response:`

describe('containsForbiddenWords', () => {
  it('returns empty array for safe text', () => {
    expect(containsForbiddenWords('This is a completely safe sentence.')).toEqual([])
  })

  it('detects forbidden words case-insensitively', () => {
    const result = containsForbiddenWords('We need to LEVERAGE our SyNeRgY')
    expect(result).toEqual(['synergy', 'leverage'])
  })

  it('detects multi-word forbidden phrases', () => {
    const result = containsForbiddenWords('This is a game-changer paradigm shift')
    expect(result).toContain('game-changer')
    expect(result).toContain('paradigm shift')
  })

  it('returns only the matched forbidden words', () => {
    const result = containsForbiddenWords('We need to deep dive into this leverage opportunity')
    expect(result).toEqual(['leverage', 'deep dive'])
  })

  it('returns empty array for empty string', () => {
    expect(containsForbiddenWords('')).toEqual([])
  })

  it('handles text with no matches from the fixed list', () => {
    const result = containsForbiddenWords('Please review the attached proposal and provide feedback.')
    expect(result).toEqual([])
  })
})

describe('isZombieResponse', () => {
  it('detects short refusal: I\'m sorry', () => {
    expect(isZombieResponse("I'm sorry, I can't do that.")).toBe(true)
  })

  it('detects short refusal: cannot assist', () => {
    expect(isZombieResponse('I cannot assist with this request.')).toBe(true)
  })

  it('returns false for normal short non-refusal', () => {
    expect(isZombieResponse('Hello, here is the information you requested.')).toBe(false)
  })

  it('returns false for long response even containing refusal phrase', () => {
    const longContent = 'A'.repeat(99) + " I'm sorry " + 'B'.repeat(99)
    expect(isZombieResponse(longContent)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isZombieResponse('')).toBe(false)
  })

  it('returns false at exactly 100-character boundary even with refusal phrase', () => {
    const content = 'A'.repeat(89) + " I'm sorry "
    expect(content.length).toBe(100)
    expect(isZombieResponse(content)).toBe(false)
  })

  it('detects: cannot fulfill', () => {
    expect(isZombieResponse('I cannot fulfill that request')).toBe(true)
  })

  it('detects: content policy', () => {
    expect(isZombieResponse('This violates our content policy')).toBe(true)
  })
})

describe('sanitizeAndParseJSON', () => {
  it('parses valid JSON without repair', () => {
    const result = sanitizeAndParseJSON('{"name": "test", "value": 42}')
    expect(result.data).toEqual({ name: 'test', value: 42 })
    expect(result.wasFixed).toBe(false)
  })

  it('parses JSON wrapped in markdown code fences', () => {
    const input = '```json\n{"key": "value"}\n```'
    const result = sanitizeAndParseJSON(input)
    expect(result.data).toEqual({ key: 'value' })
    expect(result.wasFixed).toBe(false)
  })

  it('parses JSON wrapped in plain code fences without language', () => {
    const input = '```\n{"hello": "world"}\n```'
    const result = sanitizeAndParseJSON(input)
    expect(result.data).toEqual({ hello: 'world' })
    expect(result.wasFixed).toBe(false)
  })

  it('removes trailing commas before closing braces', () => {
    const result = sanitizeAndParseJSON('{"a": 1, "b": 2,}')
    expect(result.data).toEqual({ a: 1, b: 2 })
    expect(result.wasFixed).toBe(false)
  })

  it('removes trailing commas before closing brackets', () => {
    const result = sanitizeAndParseJSON('[1, 2, 3,]')
    expect(result.data).toEqual([1, 2, 3])
    expect(result.wasFixed).toBe(false)
  })

  it('extracts JSON from surrounding text when possible', () => {
    const result = sanitizeAndParseJSON('Here is the data: {"x": 10} some trailing text')
    expect(result.data).toEqual({ x: 10 })
    expect(result.wasFixed).toBe(true)
    expect(result.original).toBeDefined()
  })

  it('returns null data for unrecoverable invalid JSON', () => {
    const result = sanitizeAndParseJSON('This is not JSON at all')
    expect(result.data).toBeNull()
    expect(result.wasFixed).toBe(true)
    expect(result.original).toBeDefined()
  })

  it('handles empty object', () => {
    const result = sanitizeAndParseJSON('{}')
    expect(result.data).toEqual({})
    expect(result.wasFixed).toBe(false)
  })
})

describe('addThoughtTags', () => {
  it('appends thought-tag instructions to a plain prompt with exact equality', () => {
    const prompt = 'Analyze this campaign data.'
    const result = addThoughtTags(prompt)
    expect(result).toBe(`${prompt}${expectedSuffix}`)
  })

  it('preserves the original prompt text at the beginning', () => {
    const prompt = 'Write a pitch for a SaaS product.'
    const result = addThoughtTags(prompt)
    expect(result.startsWith(prompt)).toBe(true)
  })

  it('includes the thought tag wrapper in the output', () => {
    const result = addThoughtTags('Test')
    expect(result).toContain('<thought>')
    expect(result).toContain('</thought>')
  })

  it('returns exactly the suffix block for empty prompt', () => {
    const result = addThoughtTags('')
    expect(result).toBe(expectedSuffix)
  })

  it('appends additional instruction block on repeated calls (not idempotent)', () => {
    const initial = 'Analyze.'
    const first = addThoughtTags(initial)
    const second = addThoughtTags(first)
    expect(first).toBe(`${initial}${expectedSuffix}`)
    expect(second).toBe(`${initial}${expectedSuffix}${expectedSuffix}`)
  })
})
