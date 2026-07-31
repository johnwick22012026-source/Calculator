export class ExpressionError extends Error {}

type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: string }
  | { type: 'paren'; value: '(' | ')' }
  | { type: 'identifier'; value: string }

const allowedCharactersRegex = /^[0-9+\-*/^%().\sA-Za-z\u03c0]+$/
const binaryOperatorSequenceRegex = /([+*/^]){2,}/
const DIVISION_BY_ZERO_MESSAGE = 'Cannot divide by zero'
const SCIENTIFIC_FUNCTIONS = new Set([
  'sqrt',
  'square',
  'cube',
  'reciprocal',
  'abs',
  'absolute',
  'ln',
  'log10',
  'exp',
  'factorial'
])

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

function computeScientificFunction(name: string, value: number): number {
  switch (name) {
    case 'sqrt':
      if (value < 0) {
        throw new ExpressionError('Cannot compute square root of a negative value')
      }
      return Math.sqrt(value)
    case 'square':
      return value * value
    case 'cube':
      return value * value * value
    case 'reciprocal':
      if (value === 0) {
        throw new ExpressionError(DIVISION_BY_ZERO_MESSAGE)
      }
      return 1 / value
    case 'abs':
    case 'absolute':
      return Math.abs(value)
    case 'ln':
      if (value <= 0) {
        throw new ExpressionError('Natural logarithm is only defined for positive values')
      }
      return Math.log(value)
    case 'log10':
      if (value <= 0) {
        throw new ExpressionError('Log10 is only defined for positive values')
      }
      return Math.log10 ? Math.log10(value) : Math.log(value) / Math.LN10
    case 'exp':
      return Math.exp(value)
    case 'factorial':
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
    default:
      throw new ExpressionError(`Unknown function '${name}'`)
  }
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

  type Eval = { value: number; isPercent: boolean }

  function parseExpression(): Eval {
    return parseAddSub()
  }

  function parseAddSub(): Eval {
    let lhs = parseMulDiv()
    while (peek()?.type === 'operator' && (peek()!.value === '+' || peek()!.value === '-')) {
      const op = consume().value
      const rhs = parseMulDiv()
      let newVal: number
      if (rhs.isPercent) {
        newVal = op === '+' ? lhs.value + lhs.value * rhs.value : lhs.value - lhs.value * rhs.value
      } else {
        newVal = op === '+' ? lhs.value + rhs.value : lhs.value - rhs.value
      }
      lhs = { value: newVal, isPercent: false }
    }
    return lhs
  }

  function parseMulDiv(): Eval {
    let lhs = parseUnary()
    while (peek()?.type === 'operator' && (peek()!.value === '*' || peek()!.value === '/')) {
      const op = consume().value
      const rhs = parseUnary()
      let newVal: number
      if (op === '*') {
        newVal = lhs.value * rhs.value
      } else {
        if (rhs.value === 0) throw new ExpressionError(DIVISION_BY_ZERO_MESSAGE)
        newVal = lhs.value / rhs.value
      }
      lhs = { value: newVal, isPercent: false }
    }
    return lhs
  }

  function parseUnary(): Eval {
    if (peek()?.type === 'operator' && peek()!.value === '-') {
      consume()
      const res = parseUnary()
      return { value: -res.value, isPercent: res.isPercent }
    }
    return parsePower()
  }

  function parsePower(): Eval {
    let lhs = parsePercent()
    if (peek()?.type === 'operator' && peek()!.value === '^') {
      consume()
      const rhs = parseUnary()
      lhs = { value: Math.pow(lhs.value, rhs.value), isPercent: false }
    }
    return lhs
  }

  function parsePercent(): Eval {
    let lhs = parsePrimary()
    while (peek()?.type === 'operator' && peek()!.value === '%') {
      consume()
      lhs = { value: lhs.value / 100, isPercent: true }
    }
    return lhs
  }

  function parsePrimary(): Eval {
    const tok = peek()
    if (!tok) throw new ExpressionError('Incomplete expression')
    if (tok.type === 'paren' && tok.value === ')') {
      throw new ExpressionError('Mismatched parentheses')
    }
    if (tok.type === 'number') {
      consume()
      return { value: tok.value, isPercent: false }
    }
    if (tok.type === 'identifier') {
      const name = tok.value
      if (name === 'pi') {
        consume()
        return { value: Math.PI, isPercent: false }
      }
      if (name === 'e') {
        consume()
        return { value: Math.E, isPercent: false }
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
      return { value: inside.value, isPercent: inside.isPercent }
    }
    throw new ExpressionError('Invalid syntax')
  }

  function parseFunctionCall(name: string): Eval {
    if (!peek() || peek()!.type !== 'paren' || peek()!.value !== '(') {
      throw new ExpressionError(`Missing opening parenthesis for function '${name}'`)
    }
    consume()
    const argument = parseExpression()
    if (!peek() || peek()!.type !== 'paren' || peek()!.value !== ')') {
      throw new ExpressionError(`Missing closing parenthesis for function '${name}'`)
    }
    consume()
    const computed = computeScientificFunction(name, argument.value)
    return { value: computed, isPercent: false }
  }

  const finalEval = parseExpression()
  if (pos < tokens.length) {
    throw new ExpressionError('Invalid syntax')
  }
  if (!isFinite(finalEval.value)) {
    throw new ExpressionError('Result is not a finite number')
  }
  return finalEval.value
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
