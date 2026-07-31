import React, { useState } from 'react'
import './App.css'
import CalculatorDisplay from './components/CalculatorDisplay'
import CalculatorKeypad from './components/CalculatorKeypad'
import { safeEvaluateExpression } from './utils/expression'

export default function App() {
  const [expression, setExpression] = useState<string>('')
  const [result, setResult] = useState<string>('')
  const [statusLabel, setStatusLabel] = useState<string>('Waiting for input')
  const [ans, setAns] = useState<number | string>('')
  const [error, setError] = useState<string>('')

  const setEditingFeedback = () => {
    setResult('')
    setError('')
    setStatusLabel('Editing')
  }

  const applyEvaluationError = (message: string) => {
    setResult('')
    setError(message)
    setStatusLabel(message === 'Cannot divide by zero' ? 'Math error' : 'Error')
  }

  const appendValue = (value: string) => {
    setExpression(prev => `${prev}${value}`)
    setEditingFeedback()
  }

  const insertDecimalPoint = () => {
    setExpression(prev => {
      let newExpr: string
      if (!prev || /[+\-×÷*/^]$/.test(prev)) {
        newExpr = `${prev}0.`
      } else {
        const lastNumberMatch = prev.match(/(\d+(\.\d*)?)$/)
        if (lastNumberMatch && lastNumberMatch[0].includes('.')) {
          return prev
        }
        newExpr = `${prev}.`
      }
      setEditingFeedback()
      return newExpr
    })
  }

  const deleteLastCharacter = () => {
    setExpression(prev => {
      const newExpr = prev.slice(0, -1)
      if (newExpr) {
        setEditingFeedback()
      } else {
        setResult('')
        setError('')
        setStatusLabel('Waiting for input')
      }
      return newExpr
    })
  }

  const clearExpression = () => {
    setExpression('')
    setResult('')
    setError('')
    setStatusLabel('Waiting for input')
  }

  const handleKeyPress = (key: string) => {
    if (['+', '-', '×', '÷', '*', '/', '^'].includes(key)) {
      if (!expression && key !== '-') {
        return
      }

      setExpression(prev => {
        if (/[+\-×÷*/^]$/.test(prev)) {
          if (prev.length === 1) {
            return prev
          }
          return prev.slice(0, -1) + key
        }
        return prev + key
      })
      setEditingFeedback()
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

        const resultString = String(evaluation.value)
        setResult(resultString)
        setExpression(resultString)
        setAns(evaluation.value)
        setError('')
        setStatusLabel('Result')
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

  return (
    <main className="calculator-shell">
      <div className="calculator-panel">
        <CalculatorDisplay
          expression={expression}
          result={result}
          statusLabel={statusLabel}
          error={error}
        />
        <CalculatorKeypad onKeyPress={handleKeyPress} />
      </div>
    </main>
  )
}
