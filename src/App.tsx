import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import './App.css'
import CalculatorDisplay from './components/CalculatorDisplay'
import CalculatorKeypad from './components/CalculatorKeypad'
import ScientificInputControls from './components/ScientificInputControls'
import {
  ExpressionError,
  safeEvaluateExpression,
  validateExpressionInput
} from './utils/expression'
import { formatResult } from './utils/formatResult'
import { mapKeyboardToCalculatorKey } from './utils/keyboard'

type ScientificControlType = 'function' | 'constant' | 'operator'

const INPUT_VALIDATION_HINTS: { pattern: string; hint: string }[] = [
  {
    pattern: 'Expression contains unsupported characters',
    hint: 'Use numbers, parentheses, and supported operators or functions only.'
  },
  {
    pattern: 'Expression cannot start with an operator',
    hint: 'Start with a number, constant (π, e), or the Ans value.'
  },
  {
    pattern: 'Expression cannot start with the percent operator',
    hint: 'Place % after a number or grouped expression instead of at the beginning.'
  },
  {
    pattern: 'Expression cannot end with an operator',
    hint: 'Finish the expression with a number, constant, or closing parenthesis.'
  },
  {
    pattern: 'Invalid operator sequence',
    hint: 'Use only one operator between values (e.g., 2 + 3, not 2 ++ 3).'
  },
  {
    pattern: 'Mismatched parentheses',
    hint: 'Ensure every opening parenthesis has a corresponding closing parenthesis.'
  },
  {
    pattern: 'Missing closing parenthesis',
    hint: 'Close any open parentheses (including those following functions) before evaluating.'
  },
  {
    pattern: 'Missing opening parenthesis',
    hint: 'Include the opening parenthesis when calling a function (e.g., sin()).'
  },
  {
    pattern: 'Invalid number',
    hint: 'Check your numbers to make sure they use digits and at most one decimal point.'
  },
  {
    pattern: 'Invalid number format',
    hint: 'Each number may only contain one decimal point (e.g., 3.14).'
  }
]

const DEFAULT_INPUT_HINT = 'Fix the expression so the calculator can parse it correctly.'

function getInputValidationHint(message: string) {
  const match = INPUT_VALIDATION_HINTS.find(entry => message.startsWith(entry.pattern))
  return match?.hint ?? DEFAULT_INPUT_HINT
}

export default function App() {
  const [expression, setExpression] = useState<string>('')
  const [result, setResult] = useState<string>('')
  const [statusLabel, setStatusLabel] = useState<string>('Waiting for input')
  const [ans, setAns] = useState<number | string>('')
  const [error, setError] = useState<string>('')
  const [inputValidationMessage, setInputValidationMessage] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 })
  const nextCaretRef = useRef<{ start: number; end: number } | null>(null)
  const handleKeyPressRef = useRef<(key: string) => void>(() => {})

  // initial focus on expression input for keyboard users
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const normalized = expression.replace(/×/g, '*').replace(/÷/g, '/')
    if (!normalized.trim()) {
      setInputValidationMessage('')
      return
    }

    try {
      validateExpressionInput(normalized)
      setInputValidationMessage('')
    } catch (validationError) {
      if (validationError instanceof ExpressionError) {
        setInputValidationMessage(validationError.message)
      } else {
        setInputValidationMessage('Please adjust the expression to include only supported characters.')
      }
    }
  }, [expression])

  // Restore caret and focus after controlled updates
  useLayoutEffect(() => {
    const next = nextCaretRef.current
    if (next && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.setSelectionRange(next.start, next.end)
      nextCaretRef.current = null
    }
  }, [expression])

  const setEditingFeedback = () => {
    setResult('')
    setError('')
    setStatusLabel('Editing expression')
  }

  const applyEvaluationError = (message: string) => {
    setResult('')
    setError(message)
    setStatusLabel('Error detected – fix expression')
  }

  const insertTextAtSelection = (
    value: string,
    options?: { suffix?: string; caretOffset?: number }
  ) => {
    const { suffix = '', caretOffset = value.length } = options ?? {}
    const prev = expression
    const { start, end } = selectionRef.current
    const newExpr = `${prev.slice(0, start)}${value}${suffix}${prev.slice(end)}`
    const caretPos = start + caretOffset
    setExpression(newExpr)
    selectionRef.current = { start: caretPos, end: caretPos }
    nextCaretRef.current = { start: caretPos, end: caretPos }
    setEditingFeedback()
  }

  const appendValue = (value: string) => {
    insertTextAtSelection(value)
  }

  const endsWithImplicitMultiplicationTrigger = (segment: string): boolean => {
    const trimmed = segment.replace(/\s+$/, '')
    if (!trimmed) return false
    return /(?:[0-9πe)]|ans)$/i.test(trimmed)
  }

  const startsWithImplicitMultiplicationTrigger = (segment: string): boolean => {
    const trimmed = segment.replace(/^\s+/, '')
    if (!trimmed) return false
    return /^(?:[0-9πe(]|ans)/i.test(trimmed)
  }

  const insertScientificToken = (token: string, type: ScientificControlType) => {
    const { start, end } = selectionRef.current
    const leftSegment = expression.slice(0, start)
    const rightSegment = expression.slice(end)

    const needsMultiplyBefore =
      type !== 'operator' && endsWithImplicitMultiplicationTrigger(leftSegment)
    const needsMultiplyAfter =
      type === 'constant' && startsWithImplicitMultiplicationTrigger(rightSegment)

    const prefix = needsMultiplyBefore ? '×' : ''
    const suffix = needsMultiplyAfter ? '×' : ''
    const insertedValue = `${prefix}${token}`

    insertTextAtSelection(insertedValue, {
      suffix,
      caretOffset: insertedValue.length + suffix.length
    })
  }

  const insertDecimalPoint = () => {
    const prev = expression
    const { start, end } = selectionRef.current
    const left = prev.slice(0, start)
    const right = prev.slice(end)
    let insert = '.'

    if (!left || /[+\-×÷*/^%]$/.test(left)) {
      insert = '0.'
    } else {
      const lastNumberMatch = left.match(/(\d+(\.\d*)?)$/)
      if (lastNumberMatch && lastNumberMatch[0].includes('.')) {
        return
      }
    }

    const newExpr = left + insert + right
    const pos = left.length + insert.length
    setExpression(newExpr)
    selectionRef.current = { start: pos, end: pos }
    nextCaretRef.current = { start: pos, end: pos }
    setEditingFeedback()
  }

  const deleteLastCharacter = () => {
    const prev = expression
    const { start, end } = selectionRef.current
    let newExpr = ''
    let pos = 0

    if (start !== end) {
      // delete selected text
      newExpr = prev.slice(0, start) + prev.slice(end)
      pos = start
    } else if (start > 0) {
      newExpr = prev.slice(0, start - 1) + prev.slice(start)
      pos = start - 1
    } else {
      newExpr = prev
      pos = 0
    }

    setExpression(newExpr)
    selectionRef.current = { start: pos, end: pos }
    nextCaretRef.current = { start: pos, end: pos }

    if (newExpr) {
      setEditingFeedback()
    } else {
      setResult('')
      setError('')
      setStatusLabel('Waiting for input')
    }
  }

  const clearExpression = () => {
    setExpression('')
    selectionRef.current = { start: 0, end: 0 }
    nextCaretRef.current = { start: 0, end: 0 }
    setResult('')
    setError('')
    setStatusLabel('Waiting for input')
  }

  const handleKeyPress = (key: string) => {
    // core operators insertion at caret
    if (['+', '-', '×', '÷', '*', '/', '^', '%'].includes(key)) {
      if (!expression && key !== '-') {
        return
      }
      appendValue(key)
      return
    }

    switch (key) {
      case 'AC':
        clearExpression()
        break
      case 'DEL':
        deleteLastCharacter()
        break
      case '.':
        insertDecimalPoint()
        break
      case '=': {
        if (!expression.trim()) {
          applyEvaluationError('Nothing to evaluate')
          return
        }

        if (inputValidationMessage) {
          applyEvaluationError(inputValidationMessage)
          return
        }

        const sanitized = expression.replace(/×/g, '*').replace(/÷/g, '/')
        const evaluation = safeEvaluateExpression(sanitized)

        if (evaluation.error || evaluation.value === undefined) {
          applyEvaluationError(evaluation.error ?? 'Unable to evaluate expression')
          return
        }

        const resultString = formatResult(evaluation.value)
        setResult(resultString)
        setExpression(resultString)
        setAns(evaluation.value)
        setError('')
        setStatusLabel('Result')
        // place caret at end
        nextCaretRef.current = { start: resultString.length, end: resultString.length }
        selectionRef.current = { start: resultString.length, end: resultString.length }
        break
      }
      case 'Ans':
        if (ans !== '') {
          appendValue(String(ans))
        }
        break
      default:
        appendValue(key)
    }
  }

  const synchronizeSelectionFromInput = (target: HTMLInputElement | null) => {
    if (!target) return
    const start = target.selectionStart ?? 0
    const end = target.selectionEnd ?? 0
    selectionRef.current = { start, end }
  }

  const handleInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) {
      return
    }

    const mappedKey = mapKeyboardToCalculatorKey(event.key)
    if (!mappedKey) {
      return
    }

    synchronizeSelectionFromInput(event.currentTarget)
    event.preventDefault()
    handleKeyPressRef.current(mappedKey)
  }

  useEffect(() => {
    handleKeyPressRef.current = handleKeyPress
  }, [handleKeyPress])

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return
      }

      const mappedKey = mapKeyboardToCalculatorKey(event.key)
      if (!mappedKey) {
        return
      }

      synchronizeSelectionFromInput(inputRef.current)
      event.preventDefault()
      handleKeyPressRef.current(mappedKey)
      inputRef.current?.focus()
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [])

  const hasError = Boolean(error || inputValidationMessage)
  const inputValidationHint = inputValidationMessage ? getInputValidationHint(inputValidationMessage) : ''

  const onExpressionChange = (newExpr: string, selStart: number, selEnd: number) => {
    selectionRef.current = { start: selStart, end: selEnd }
    setExpression(newExpr)
    setEditingFeedback()
  }

  return (
    <main className="calculator-shell">
      <div className="calculator-panel">
        <CalculatorDisplay
          ref={inputRef}
          expression={expression}
          result={result}
          statusLabel={statusLabel}
          error={error}
          hasError={hasError}
          inputValidationMessage={inputValidationMessage}
          inputValidationHint={inputValidationHint}
          onExpressionChange={onExpressionChange}
          onInputKeyDown={handleInputKeyDown}
        />
        <ScientificInputControls onInsert={insertScientificToken} />
        <CalculatorKeypad onKeyPress={handleKeyPress} />
      </div>
    </main>
  )
}
