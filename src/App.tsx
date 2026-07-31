import React, { useState } from 'react'
import './App.css'
import CalculatorDisplay from './components/CalculatorDisplay'
import CalculatorKeypad from './components/CalculatorKeypad'
import { evaluateExpression, ExpressionError } from './utils/expression'

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
          setExpression(resultString)
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
