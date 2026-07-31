import { describe, it, expect } from 'vitest'
import { evaluateExpression, ExpressionError, safeEvaluateExpression } from './expression'

describe('evaluateExpression', () => {
  it('parses integers and decimals with whitespace tolerance', () => {
    expect(evaluateExpression('  2 ')).toBe(2)
    expect(evaluateExpression('3.14')).toBeCloseTo(3.14)
    expect(evaluateExpression('  10.0 +  5.5 ')).toBeCloseTo(15.5)
  })

  it('supports operator precedence for power, multiplication/division, addition/subtraction', () => {
    expect(evaluateExpression('2+3*4')).toBe(14)
    expect(evaluateExpression('2*3+4')).toBe(10)
    expect(evaluateExpression('2^3^2')).toBe(512) // 2^(3^2)
  })

  it('supports nested parentheses and unary minus', () => {
    expect(evaluateExpression('-(1+2)*3')).toBe(-9)
    expect(evaluateExpression('(-2)^3')).toBe(-8)
    expect(evaluateExpression('2*(3+(4-1))')).toBe(12)
  })

  it('returns correct numeric results for valid expressions', () => {
    expect(evaluateExpression('4/2')).toBe(2)
    expect(evaluateExpression('2+3-4')).toBe(1)
    expect(evaluateExpression('2.5*4')).toBe(10)
  })

  it('handles percent operator as ratio and percent-of semantics', () => {
    // standalone percent as ratio
    expect(evaluateExpression('50%')).toBeCloseTo(0.5)
    // percent in multiplication/division yields ratio
    expect(evaluateExpression('200*10%')).toBeCloseTo(20)
    expect(evaluateExpression('200/10%')).toBeCloseTo(2000)
    // percent in addition/subtraction is percent-of left operand
    expect(evaluateExpression('200+10%')).toBeCloseTo(220)
    expect(evaluateExpression('200-10%')).toBeCloseTo(180)
  })

  it('rejects or reports invalid syntax without crashing', () => {
    const badInputs = ['++2', '2*/3', '2+(', 'abc', '.', '1..2']
    badInputs.forEach(input => {
      expect(() => evaluateExpression(input)).toThrow(ExpressionError)
    })
  })

  it('handles division by zero and non-finite results', () => {
    expect(() => evaluateExpression('1/0')).toThrow('Cannot divide by zero')
    expect(() => evaluateExpression('0^0')).not.toThrow() // Math.pow(0,0) == 1
  })

  it('rejects division by zero when denominator resolves to zero', () => {
    expect(() => evaluateExpression('4/(2-2)')).toThrow('Cannot divide by zero')
  })

  // New tests for percentage and exponent edge cases and realistic scenarios
  it('handles basic exponent cases and chained exponent scenarios', () => {
    expect(evaluateExpression('2^3')).toBe(8)
    expect(evaluateExpression('3^2^2')).toBe(81) // 3^(2^2)
    expect(evaluateExpression('2^3*4')).toBe(32) // (2^3)*4
    expect(evaluateExpression('2^(3*4)')).toBe(4096) // parentheses change precedence
  })

  it('handles realistic percentage scenarios including discount and percent-of-value', () => {
    // discount scenario: subtract percentage of value
    expect(evaluateExpression('150-20%')).toBeCloseTo(120)
    // percent-of-value via multiplication
    expect(evaluateExpression('20%*300')).toBeCloseTo(60)
  })

  it('verifies precedence interactions between percentage, power, and other operators', () => {
    // percent parsed before multiplication and addition
    expect(evaluateExpression('100+10%*2')).toBeCloseTo(100.2)
    // power has higher precedence than percent postfix on right operand
    expect(evaluateExpression('2^3%')).toBeCloseTo(Math.pow(2, 0.03))
  })

  it('supports chained percent operators as nested percent conversions', () => {
    expect(evaluateExpression('200%%')).toBeCloseTo(0.02)
  })

  it('handles negative exponent values', () => {
    expect(evaluateExpression('2^-3')).toBeCloseTo(0.125)
  })

  it('safeEvaluateExpression reports syntax issues without throwing', () => {
    const invalidSequence = safeEvaluateExpression('++2')
    expect(invalidSequence.value).toBeUndefined()
    expect(invalidSequence.error).toBe('Invalid operator sequence')

    const invalidCharacter = safeEvaluateExpression('5a3')
    expect(invalidCharacter.value).toBeUndefined()
    expect(invalidCharacter.error).toBe('Expression contains unsupported characters')

    const divByZero = safeEvaluateExpression('1/0')
    expect(divByZero.value).toBeUndefined()
    expect(divByZero.error).toBe('Cannot divide by zero')
  })

  it('safeEvaluateExpression surfaces division by zero on computed denominators', () => {
    const divByZero = safeEvaluateExpression('4/(2-2)')
    expect(divByZero.value).toBeUndefined()
    expect(divByZero.error).toBe('Cannot divide by zero')
  })
})
