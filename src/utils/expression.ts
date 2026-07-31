export class ExpressionError extends Error {}

type Token = { type: 'number'; value: number } | { type: 'operator'; value: string } | { type: 'paren'; value: '(' | ')' };

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < input.length) {
    const ch = input[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
      i++;
      continue;
    }
    if ((ch >= '0' && ch <= '9') || ch === '.') {
      let numStr = '';
      let dotCount = 0;
      while (i < input.length && ((input[i] >= '0' && input[i] <= '9') || input[i] === '.')) {
        if (input[i] === '.') {
          dotCount++;
          if (dotCount > 1) throw new ExpressionError('Invalid number format');
        }
        numStr += input[i++];
      }
      if (numStr === '.' || numStr === '') {
        throw new ExpressionError('Invalid number');
      }
      tokens.push({ type: 'number', value: parseFloat(numStr) });
      continue;
    }
    if ('+-*/^'.includes(ch)) {
      tokens.push({ type: 'operator', value: ch });
      i++;
      continue;
    }
    if (ch === '(' || ch === ')') {
      tokens.push({ type: 'paren', value: ch });
      i++;
      continue;
    }
    throw new ExpressionError(`Unexpected character '${ch}'`);
  }
  return tokens;
}

/**
 * Evaluate a mathematical expression string supporting +, -, *, /, ^, parentheses, unary minus
 * Throws ExpressionError on invalid syntax or evaluation issues.
 * Unary minus now has lower precedence than exponentiation (so "-2^2" === -(2^2) === -4).
 */
export function evaluateExpression(input: string): number {
  const tokens = tokenize(input);
  let pos = 0;

  function peek(): Token | null {
    return tokens[pos] ?? null;
  }

  function consume(): Token {
    const tok = tokens[pos];
    if (!tok) throw new ExpressionError('Incomplete expression');
    pos++;
    return tok;
  }

  function parseExpression(): number {
    return parseAddSub();
  }

  function parseAddSub(): number {
    let value = parseMulDiv();
    while (peek()?.type === 'operator' && (peek()!.value === '+' || peek()!.value === '-')) {
      const op = consume().value;
      const rhs = parseMulDiv();
      value = op === '+' ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseMulDiv(): number {
    let value = parseUnary();
    while (peek()?.type === 'operator' && (peek()!.value === '*' || peek()!.value === '/')) {
      const op = consume().value;
      const rhs = parseUnary();
      if (op === '*') {
        value = value * rhs;
      } else {
        if (rhs === 0) throw new ExpressionError('Division by zero');
        value = value / rhs;
      }
    }
    return value;
  }

  function parseUnary(): number {
    if (peek()?.type === 'operator' && peek()!.value === '-') {
      consume();
      return -parseUnary();
    }
    return parsePower();
  }

  function parsePower(): number {
    let value = parsePrimary();
    if (peek()?.type === 'operator' && peek()!.value === '^') {
      consume();
      const rhs = parsePower(); // right-associative
      value = Math.pow(value, rhs);
    }
    return value;
  }

  function parsePrimary(): number {
    const tok = peek();
    if (!tok) throw new ExpressionError('Incomplete expression');
    if (tok.type === 'paren' && tok.value === ')') {
      throw new ExpressionError('Mismatched parentheses');
    }
    if (tok.type === 'number') {
      consume();
      return tok.value;
    }
    if (tok.type === 'paren' && tok.value === '(') {
      consume();
      const value = parseExpression();
      if (!peek() || peek()!.type !== 'paren' || peek()!.value !== ')') {
        throw new ExpressionError('Missing closing parenthesis');
      }
      consume();
      return value;
    }
    throw new ExpressionError('Invalid syntax');
  }

  const result = parseExpression();
  if (pos < tokens.length) {
    throw new ExpressionError('Invalid syntax');
  }
  if (!isFinite(result)) {
    throw new ExpressionError('Result is not a finite number');
  }
  return result;
}