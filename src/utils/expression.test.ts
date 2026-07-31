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
    expect(evaluateExpression('50%')).toBeCloseTo(0.5)
    expect(evaluateExpression('200*10%')).toBeCloseTo(20)
    expect(evaluateExpression('200/10%')).toBeCloseTo(2000)
    expect(evaluateExpression('200+10%')).toBeCloseTo(220)
    expect(evaluateExpression('200-10%')).toBeCloseTo(180)
  })

  it('rejects or reports invalid syntax without crashing', () => {
    const badInputs = ['++2', '2*/3', '2+(', '.', '1..2']
    badInputs.forEach(input => {
      expect(() => evaluateExpression(input)).toThrow(ExpressionError)
    })
    expect(() => evaluateExpression('abc')).toThrow(ExpressionError)
  })

  it('handles division by zero and non-finite results', () => {
    expect(() => evaluateExpression('1/0')).toThrow('Cannot divide by zero')
    expect(() => evaluateExpression('0^0')).not.toThrow()
  })

  it('rejects division by zero when denominator resolves to zero', () => {
    expect(() => evaluateExpression('4/(2-2)')).toThrow('Cannot divide by zero')
  })

  it('handles basic exponent cases and chained exponent scenarios', () => {
    expect(evaluateExpression('2^3')).toBe(8)
    expect(evaluateExpression('3^2^2')).toBe(81)
    expect(evaluateExpression('2^3*4')).toBe(32)
    expect(evaluateExpression('2^(3*4)')).toBe(4096)
  })

  it('handles realistic percentage scenarios including discount and percent-of-value', () => {
    expect(evaluateExpression('150-20%')).toBeCloseTo(120)
    expect(evaluateExpression('20%*300')).toBeCloseTo(60)
  })

  it('verifies precedence interactions between percentage, power, and other operators', () => {
    expect(evaluateExpression('100+10%*2')).toBeCloseTo(100.2)
    expect(evaluateExpression('2^3%')).toBeCloseTo(Math.pow(2, 0.03))
  })

  it('supports chained percent operators as nested percent conversions', () => {
    expect(evaluateExpression('200%%')).toBeCloseTo(0.02)
  })

  it('handles negative exponent values', () => {
    expect(evaluateExpression('2^-3')).toBeCloseTo(0.125)
  })

  it('supports scientific functions and constants', () => {
    expect(evaluateExpression('sqrt(9)')).toBe(3)
    expect(evaluateExpression('square(5)')).toBe(25)
    expect(evaluateExpression('cube(3)')).toBe(27)
    expect(evaluateExpression('reciprocal(4)')).toBeCloseTo(0.25)
    expect(evaluateExpression('abs(-7)')).toBe(7)
    expect(evaluateExpression('ln(exp(1))')).toBeCloseTo(1)
    expect(evaluateExpression('log10(1000)')).toBe(3)
    expect(evaluateExpression('exp(2)')).toBeCloseTo(Math.exp(2))
    expect(evaluateExpression('factorial(5)')).toBe(120)
    expect(evaluateExpression('π+1')).toBeCloseTo(Math.PI + 1)
    expect(evaluateExpression('e*2')).toBeCloseTo(Math.E * 2)
  })

  it('reports errors for invalid scientific function usage', () => {
    expect(() => evaluateExpression('sqrt(-1)')).toThrow('Cannot compute square root of a negative value')
    expect(() => evaluateExpression('reciprocal(0)')).toThrow('Cannot divide by zero')
    expect(() => evaluateExpression('ln(0)')).toThrow('Natural logarithm is only defined for positive values')
    expect(() => evaluateExpression('log10(-10)')).toThrow('Log10 is only defined for positive values')
    expect(() => evaluateExpression('factorial(3.5)')).toThrow('Factorial is only defined for non-negative integers')
  })

  it('safeEvaluateExpression reports syntax issues without throwing', () => {
    const invalidSequence = safeEvaluateExpression('++2')
    expect(invalidSequence.value).toBeUndefined()
    expect(invalidSequence.error).toBe('Invalid operator sequence')

    const invalidIdentifier = safeEvaluateExpression('5a3')
    expect(invalidIdentifier.value).toBeUndefined()
    expect(invalidIdentifier.error).toBe("Unknown function or constant 'a3'")

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
