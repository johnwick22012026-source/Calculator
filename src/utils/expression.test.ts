import { describe, it, expect } from 'vitest'
import { evaluateExpression, ExpressionError } from './expression'

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
    expect(() => evaluateExpression('1/0')).toThrow(ExpressionError)
    expect(() => evaluateExpression('0^0')).not.toThrow() // Math.pow(0,0) == 1
  })
})
