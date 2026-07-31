import React, { useLayoutEffect, useRef, useState } from 'react'
import './App.css'
import CalculatorDisplay from './components/CalculatorDisplay'
import CalculatorKeypad from './components/CalculatorKeypad'
import ScientificInputControls from './components/ScientificInputControls'
import { safeEvaluateExpression } from './utils/expression'
import { formatResult } from './utils/formatResult'

type ScientificControlType = 'function' | 'constant' | 'operator'

export default function App() {
  const [expression, setExpression] = useState<string>('')
  const [result, setResult] = useState<string>('')
  const [statusLabel, setStatusLabel] = useState<string>('Waiting for input')
  const [ans, setAns] = useState<number | string>('')
  const [error, setError] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 })
  const nextCaretRef = useRef<{ start: number; end: number } | null>(null)

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

  const hasError = Boolean(error)

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
          onExpressionChange={onExpressionChange}
        />
        <ScientificInputControls onInsert={insertScientificToken} />
        <CalculatorKeypad onKeyPress={handleKeyPress} />
      </div>
    </main>
  )
}
