export class ExpressionError extends Error {}

type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: string }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'identifier'; value: string }

const allowedCharactersRegex = /^[0-9+\-*/^%().\sA-Za-z\u03c0]+$/
const binaryOperatorSequenceRegex = /([+*/^]){2,}/
const DIVISION_BY_ZERO_MESSAGE = 'Cannot divide by zero'
const DEG_TO_RAD = Math.PI / 180
const RAD_TO_DEG = 180 / Math.PI

function toRadians(degrees: number): number {
  return degrees * DEG_TO_RAD
}

function toDegrees(radians: number): number {
  return radians * RAD_TO_DEG
}

const SCIENTIFIC_CONSTANTS: Record<string, number> = {
  pi: Math.PI,
  e: Math.E
}

const SCIENTIFIC_FUNCTION_HANDLERS: Record<string, (value: number) => number> = {
  sqrt: value => {
    if (value < 0) {
      throw new ExpressionError('Cannot compute square root of a negative value')
    }
    return Math.sqrt(value)
  },
  square: value => Math.pow(value, 2),
  cube: value => Math.pow(value, 3),
  reciprocal: value => {
    if (value === 0) {
      throw new ExpressionError(DIVISION_BY_ZERO_MESSAGE)
    }
    return 1 / value
  },
  abs: value => Math.abs(value),
  absolute: value => Math.abs(value),
  ln: value => {
    if (value <= 0) {
      throw new ExpressionError('Natural logarithm is only defined for positive values')
    }
    return Math.log(value)
  },
  log: value => {
    if (value <= 0) {
      throw new ExpressionError('Log10 is only defined for positive values')
    }
    return Math.log10 ? Math.log10(value) : Math.log(value) / Math.LN10
  },
  log10: value => {
    if (value <= 0) {
      throw new ExpressionError('Log10 is only defined for positive values')
    }
    return Math.log10 ? Math.log10(value) : Math.log(value) / Math.LN10
  },
  exp: value => Math.exp(value),
  factorial: value => {
    if (!Number.isInteger(value) || value < 0) {
      throw new ExpressionError('Factorial is only defined for non-negative integers')
    }
    let result = 1
    for (let i = 2; i <= value; i++) {
      result *= i
      if (!isFinite(result)) {
        throw new ExpressionError('Result is too large to compute')
      }
    }
    return result
  },
  sin: value => Math.sin(toRadians(value)),
  cos: value => Math.cos(toRadians(value)),
  tan: value => {
    const radians = toRadians(value)
    if (Math.abs(Math.cos(radians)) < 1e-12) {
      throw new ExpressionError('Tangent is undefined near 90° increments')
    }
    return Math.tan(radians)
  },
  asin: value => {
    if (value < -1 || value > 1) {
      throw new ExpressionError('Inverse sine input must be between -1 and 1')
    }
    return toDegrees(Math.asin(value))
  },
  acos: value => {
    if (value < -1 || value > 1) {
      throw new ExpressionError('Inverse cosine input must be between -1 and 1')
    }
    return toDegrees(Math.acos(value))
  },
  atan: value => toDegrees(Math.atan(value))
}

const SCIENTIFIC_FUNCTIONS = new Set(Object.keys(SCIENTIFIC_FUNCTION_HANDLERS))

function normalizeExpression(input: string): string {
  return input.replace(/×/g, '*').replace(/÷/g, '/')
}

export function validateExpressionInput(rawExpression: string): void {
  const normalized = normalizeExpression(rawExpression)
  const trimmed = normalized.trim()
  if (!trimmed) {
    throw new ExpressionError('Expression cannot be empty')
  }

  if (!allowedCharactersRegex.test(trimmed)) {
    throw new ExpressionError('Expression contains unsupported characters')
  }

  const compact = trimmed.replace(/\s+/g, '')

  if (compact[0] && /[+*/^]/.test(compact[0])) {
    throw new ExpressionError('Expression cannot start with an operator')
  }

  if (compact[0] === '%') {
    throw new ExpressionError('Expression cannot start with the percent operator')
  }

  const lastChar = compact[compact.length - 1]
  if (lastChar && /[+\-*/^]/.test(lastChar)) {
    throw new ExpressionError('Expression cannot end with an operator')
  }

  if (binaryOperatorSequenceRegex.test(compact)) {
    throw new ExpressionError('Invalid operator sequence')
  }

  const operatorChars = '+-*/^%'
  for (let i = 1; i < compact.length; i++) {
    const prevChar = compact[i - 1]
    const currChar = compact[i]
    if (operatorChars.includes(prevChar) && operatorChars.includes(currChar)) {
      const nextChar = compact[i + 1]
      const currIsUnaryMinus =
        currChar === '-' &&
        !!nextChar &&
        /[0-9.πA-Za-z(]/.test(nextChar)
      if (!currIsUnaryMinus) {
        throw new ExpressionError('Invalid operator sequence')
      }
    }
  }

  let depth = 0
  for (const char of compact) {
    if (char === '(') {
      depth++
    }
    if (char === ')') {
      depth--
      if (depth < 0) {
        throw new ExpressionError('Mismatched parentheses')
      }
    }
  }

  if (depth !== 0) {
    throw new ExpressionError('Mismatched parentheses')
  }
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < input.length) {
    const ch = input[i]

    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++
      continue
    }

    if (ch === 'π') {
      tokens.push({ type: 'identifier', value: 'pi' })
      i++
      continue
    }

    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let numStr = ''
      let dotCount = 0
      while (
        i < input.length &&
        ((input[i] >= '0' && input[i] <= '9') || input[i] === '.')
      ) {
        if (input[i] === '.') {
          dotCount++
          if (dotCount > 1) throw new ExpressionError('Invalid number format')
        }
        numStr += input[i++]
      }
      if (numStr === '.' || numStr === '') {
        throw new ExpressionError('Invalid number')
      }

      if (i < input.length) {
        const nextChar = input[i]
        if (nextChar === 'π' || /[A-Za-z]/.test(nextChar)) {
          let identifier = ''
          let j = i
          while (j < input.length && /[A-Za-z0-9π]/.test(input[j])) {
            identifier += input[j++] // eslint-disable-line no-plusplus
          }
          throw new ExpressionError(
            `Missing operator before identifier or constant '${identifier}'`
          )
        }
      }

      tokens.push({ type: 'number', value: parseFloat(numStr) })
      continue
    }

    if (/[A-Za-z]/.test(ch)) {
      let identifier = ''
      while (i < input.length && /[A-Za-z0-9]/.test(input[i])) {
        identifier += input[i++]
      }
      tokens.push({ type: 'identifier', value: identifier.toLowerCase() })
      continue
    }

    if ('+-*/^%'.includes(ch)) {
      tokens.push({ type: 'operator', value: ch })
      i++
      continue
    }

    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch })
      i++
      continue
    }

    throw new ExpressionError(`Unexpected character '${ch}'`)
  }

  return tokens
}

export function evaluateExpression(input: string): number {
  const tokens = tokenize(input)
  let pos = 0

  function peek(): Token | null {
    return tokens[pos] ?? null
  }

  function consume(): Token {
    const tok = tokens[pos]
    if (!tok) throw new ExpressionError('Incomplete expression')
    pos++
    return tok
  }

  function parseExpression(): number {
    return parseAddSub()
  }

  function parseAddSub(): number {
    let lhs = parseMulDiv()
    while (peek()?.type === 'operator' && (peek()!.value === '+' || peek()!.value === '-')) {
      const op = consume().value
      const rhs = parseMulDiv()
      lhs = op === '+' ? lhs + rhs : lhs - rhs
    }
    return lhs
  }

  function parseMulDiv(): number {
    let lhs = parseUnary()
    while (peek()?.type === 'operator' && (peek()!.value === '*' || peek()!.value === '/')) {
      const op = consume().value
      const rhs = parseUnary()
      if (op === '*') {
        lhs *= rhs
      } else {
        if (rhs === 0) throw new ExpressionError(DIVISION_BY_ZERO_MESSAGE)
        lhs /= rhs
      }
    }
    return lhs
  }

  function parseUnary(): number {
    if (peek()?.type === 'operator' && peek()!.value === '-') {
      consume()
      return -parseUnary()
    }
    return parsePower()
  }

  function parsePower(): number {
    let lhs = parsePercent()
    if (peek()?.type === 'operator' && peek()!.value === '^') {
      consume()
      const rhs = parseUnary()
      lhs = Math.pow(lhs, rhs)
    }
    return lhs
  }

  function parsePercent(): number {
    let lhs = parsePrimary()
    while (peek()?.type === 'operator' && peek()!.value === '%') {
      consume()
      lhs = lhs / 100
    }
    return lhs
  }

  function parsePrimary(): number {
    const tok = peek()
    if (!tok) throw new ExpressionError('Incomplete expression')
    if (tok.type === 'paren' && tok.value === ')') {
      throw new ExpressionError('Mismatched parentheses')
    }
    if (tok.type === 'number') {
      consume()
      return tok.value
    }
    if (tok.type === 'identifier') {
      const name = tok.value
      if (name in SCIENTIFIC_CONSTANTS) {
        consume()
        return SCIENTIFIC_CONSTANTS[name]
      }
      if (!SCIENTIFIC_FUNCTIONS.has(name)) {
        throw new ExpressionError(`Unknown function or constant '${name}'`)
      }
      return parseFunctionCall(name)
    }
    if (tok.type === 'paren' && tok.value === '(') {
      consume()
      const inside = parseExpression()
      if (!peek() || peek()!.type !== 'paren' || peek()!.value !== ')') {
        throw new ExpressionError('Missing closing parenthesis')
      }
      consume()
      return inside
    }
    throw new ExpressionError('Invalid syntax')
  }

  function parseFunctionCall(name: string): number {
    if (!peek() || peek()!.type !== 'paren' || peek()!.value !== '(') {
      throw new ExpressionError(`Missing opening parenthesis for function '${name}'`)
    }
    consume()
    const argument = parseExpression()
    if (!peek() || peek()!.type !== 'paren' || peek()!.value !== ')') {
      throw new ExpressionError(`Missing closing parenthesis for function '${name}'`)
    }
    consume()
    const handler = SCIENTIFIC_FUNCTION_HANDLERS[name]
    if (!handler) {
      throw new ExpressionError(`Unknown function '${name}'`)
    }
    return handler(argument)
  }

  const finalValue = parseExpression()
  if (pos < tokens.length) {
    const leftover = tokens[pos]
    if (leftover?.type === 'identifier') {
      throw new ExpressionError(`Invalid identifier or constant '${leftover.value}'`)
    }
    throw new ExpressionError('Invalid syntax')
  }
  if (!isFinite(finalValue)) {
    throw new ExpressionError('Result is not a finite number')
  }
  return finalValue
}

export function safeEvaluateExpression(rawExpression: string): { value?: number; error?: string } {
  const normalized = normalizeExpression(rawExpression)
  try {
    validateExpressionInput(normalized)
    const value = evaluateExpression(normalized)
    return { value }
  } catch (error) {
    if (error instanceof ExpressionError) {
      return { error: error.message }
    }
    return { error: 'Unexpected error while evaluating expression' }
  }
}
