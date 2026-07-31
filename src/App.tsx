import React, { useState } from 'react'
import { evaluateExpression, ExpressionError } from './utils/expression'

// Embedded placeholder display component to avoid missing module errors
interface DisplayProps {
  expression: string
  result: string
  statusLabel: string
  error: string
}
const CalculatorDisplay: React.FC<DisplayProps> = ({ expression, result, statusLabel, error }) => (
  <div className="calculator-display">
    <div className="status-label">{statusLabel}</div>
    {error ? (
      <div className="error">{error}</div>
    ) : (
      <div className="values">
        <span className="expression">{expression}</span>
        {result && <span className="result">= {result}</span>}
      </div>
    )}
  </div>
)

// Embedded placeholder keypad component to avoid missing module errors
interface KeypadProps {
  onKeyPress: (key: string) => void
}
const CalculatorKeypad: React.FC<KeypadProps> = ({ onKeyPress }) => {
  const keys = [
    'AC', 'DEL', '^', '÷',
    '7', '8', '9', '×',
    '4', '5', '6', '-',
    '1', '2', '3', '+',
    '0', '.', 'Ans', '='
  ]
  return (
    <div className="calculator-keypad">
      {keys.map(key => (
        <button key={key} onClick={() => onKeyPress(key)}>
          {key}
        </button>
      ))}
    </div>
  )
}

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
      setResult('')
      setError('')
      setStatusLabel('Editing')
      return newExpr
    })
  }

  const deleteLastCharacter = () => {
    setExpression(prev => {
      const newExpr = prev ? prev.slice(0, -1) : ''
      if (newExpr) {
        setResult('')
        setError('')
        setStatusLabel('Editing')
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
      case '=':
        if (!expression) {
          setError('Nothing to evaluate')
          setResult('')
          setStatusLabel('Error')
          return
        }
        try {
          const sanitized = expression.replace(/×/g, '*').replace(/÷/g, '/')
          const evalResult = evaluateExpression(sanitized)
          const resultString = String(evalResult)
          setResult(resultString)
          setAns(evalResult)
          setError('')
          setStatusLabel('Result')
        } catch (e) {
          const message = e instanceof ExpressionError ? e.message : 'Error evaluating expression'
          setError(message)
          setResult('')
          setStatusLabel('Error')
        }
        break
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
