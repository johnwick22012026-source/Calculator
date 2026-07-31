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
    if (ch >= '0' && ch <= '9' || ch === '.') {
      let numStr = '';
      let dotCount = 0;
      while (i < input.length && ((input[i] >= '0' && input[i] <= '9') || input[i] === '.')) {
        if (input[i] === '.') {
          dotCount++;
          if (dotCount > 1) throw new ExpressionError(`Invalid number with multiple decimals at position ${i}`);
        }
        numStr += input[i++];
      }
      if (numStr === '.' || numStr === '') {
        throw new ExpressionError(`Invalid number at position ${i}`);
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
    throw new ExpressionError(`Unexpected character '${ch}' at position ${i}`);
  }
  return tokens;
}

/**
 * Evaluate a mathematical expression string supporting +, -, *, /, ^, parentheses, unary minus
 * Throws ExpressionError on invalid syntax or evaluation issues.
 */
export function evaluateExpression(input: string): number {
  const tokens = tokenize(input);
  let pos = 0;

  function peek(): Token | null {
    return tokens[pos] ?? null;
  }
  function consume(): Token {
    const tok = tokens[pos];
    if (!tok) throw new ExpressionError('Unexpected end of expression');
    pos++;
    return tok;
  }

  function parseExpression(): number {
    return parseAddSub();
  }

  function parseAddSub(): number {
    let value = parseMulDiv();
    while (peek() && peek()!.type === 'operator' && (peek()!.value === '+' || peek()!.value === '-')) {
      const op = consume().value;
      const rhs = parseMulDiv();
      if (op === '+') value = value + rhs;
      else value = value - rhs;
    }
    return value;
  }

  function parseMulDiv(): number {
    let value = parsePower();
    while (peek() && peek()!.type === 'operator' && (peek()!.value === '*' || peek()!.value === '/')) {
      const op = consume().value;
      const rhs = parsePower();
      if (op === '*') value = value * rhs;
      else {
        if (rhs === 0) throw new ExpressionError('Division by zero');
        value = value / rhs;
      }
    }
    return value;
  }

  function parsePower(): number {
    let value = parseUnary();
    if (peek() && peek()!.type === 'operator' && peek()!.value === '^') {
      consume();
      const rhs = parsePower(); // right-associative
      value = Math.pow(value, rhs);
    }
    return value;
  }

  function parseUnary(): number {
    if (peek() && peek()!.type === 'operator' && peek()!.value === '-') {
      consume();
      return -parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const tok = peek();
    if (!tok) throw new ExpressionError('Unexpected end of expression');
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
    throw new ExpressionError(`Unexpected token '${tok.type === 'operator' ? tok.value : tok.value}' at position ${pos}`);
  }

  const result = parseExpression();
  if (pos < tokens.length) {
    throw new ExpressionError(`Unexpected token at position ${pos}`);
  }
  if (!isFinite(result)) {
    throw new ExpressionError('Result is not a finite number');
  }
  return result;
}
