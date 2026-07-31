export class ExpressionError extends Error {}

type Token =
  | { type: 'number'; value: number }
  | { type: 'operator'; value: string }
  | { type: 'paren'; value: '(' | ')' };

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
      while (
        i < input.length &&
        ((input[i] >= '0' && input[i] <= '9') || input[i] === '.')
      ) {
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
    if ('+-*/^%'.includes(ch)) {
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
 * Evaluate a mathematical expression string supporting +, -, *, /, ^, %, parentheses, unary minus
 * with operator precedence and percent semantics:
 *  - Percent (%) acts as a postfix operator: divides a number by 100,
 *    used in multiplication/division as ratio, and in addition/subtraction
 *    as percent-of the left operand (e.g., "100+10%" === 110).
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
    if (!tok) throw new ExpressionError('Incomplete expression');
    pos++;
    return tok;
  }

  type Eval = { value: number; isPercent: boolean };

  function parseExpression(): Eval {
    return parseAddSub();
  }

  function parseAddSub(): Eval {
    let lhs = parseMulDiv();
    while (peek()?.type === 'operator' && (peek()!.value === '+' || peek()!.value === '-')) {
      const op = consume().value;
      const rhs = parseMulDiv();
      let newVal: number;
      if (rhs.isPercent) {
        // percent of lhs
        newVal = op === '+' ? lhs.value + lhs.value * rhs.value : lhs.value - lhs.value * rhs.value;
      } else {
        newVal = op === '+' ? lhs.value + rhs.value : lhs.value - rhs.value;
      }
      lhs = { value: newVal, isPercent: false };
    }
    return lhs;
  }

  function parseMulDiv(): Eval {
    let lhs = parseUnary();
    while (peek()?.type === 'operator' && (peek()!.value === '*' || peek()!.value === '/')) {
      const op = consume().value;
      const rhs = parseUnary();
      let newVal: number;
      if (op === '*') {
        newVal = lhs.value * rhs.value;
      } else {
        if (rhs.value === 0) throw new ExpressionError('Division by zero');
        newVal = lhs.value / rhs.value;
      }
      lhs = { value: newVal, isPercent: false };
    }
    return lhs;
  }

  function parseUnary(): Eval {
    if (peek()?.type === 'operator' && peek()!.value === '-') {
      consume();
      const res = parseUnary();
      return { value: -res.value, isPercent: res.isPercent };
    }
    return parsePower();
  }

  function parsePower(): Eval {
    let lhs = parsePercent();
    if (peek()?.type === 'operator' && peek()!.value === '^') {
      consume();
      const rhs = parsePower(); // right-associative
      lhs = { value: Math.pow(lhs.value, rhs.value), isPercent: false };
    }
    return lhs;
  }

  function parsePercent(): Eval {
    let lhs = parsePrimary();
    while (peek()?.type === 'operator' && peek()!.value === '%') {
      // postfix percent: convert to ratio and mark percent flag
      consume();
      lhs = { value: lhs.value / 100, isPercent: true };
    }
    return lhs;
  }

  function parsePrimary(): Eval {
    const tok = peek();
    if (!tok) throw new ExpressionError('Incomplete expression');
    if (tok.type === 'paren' && tok.value === ')') {
      throw new ExpressionError('Mismatched parentheses');
    }
    if (tok.type === 'number') {
      consume();
      return { value: tok.value, isPercent: false };
    }
    if (tok.type === 'paren' && tok.value === '(') {
      consume();
      const inside = parseExpression();
      if (!peek() || peek()!.type !== 'paren' || peek()!.value !== ')') {
        throw new ExpressionError('Missing closing parenthesis');
      }
      consume();
      return { value: inside.value, isPercent: inside.isPercent };
    }
    throw new ExpressionError('Invalid syntax');
  }

  const finalEval = parseExpression();
  if (pos < tokens.length) {
    throw new ExpressionError('Invalid syntax');
  }
  if (!isFinite(finalEval.value)) {
    throw new ExpressionError('Result is not a finite number');
  }
  return finalEval.value;
}
