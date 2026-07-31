/**
 * Map native keyboard keys to calculator input tokens.
 * Ensures consistent handling between mouse and keyboard interaction paths.
 */
export function mapKeyboardToCalculatorKey(key: string): string | undefined {
  if (/^[0-9]$/.test(key)) {
    return key
  }

  switch (key) {
    case 'Enter':
      return '='
    case '=':
      return '='
    case '+':
    case '-':
    case '^':
    case '%':
      return key
    case '.':
      return '.'
    case '*':
      return '×'
    case '/':
      return '÷'
    case '×':
    case '÷':
      return key
    case '(': 
    case ')':
      return key
    case 'Backspace':
    case 'Delete':
      return 'DEL'
    case 'Escape':
      return 'AC'
    default:
      return undefined
  }
}
