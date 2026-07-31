import React, { useState } from 'react'
import CalculatorDisplay from './components/CalculatorDisplay'
import './App.css'

const KEYS: string[][] = [
  ['AC', 'DEL', 'Ans', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
]

interface KeypadProps {
  onKeyPress: (key: string) => void
}

const CalculatorKeypad: React.FC<KeypadProps> = ({ onKeyPress }) => (
  <div className="calculator-keypad">
    {KEYS.map((row, rowIndex) => (
      <div className="keypad-row" key={rowIndex}>
        {row.map(key => (
          <button
            key={key}
            className="keypad-key"
            onClick={() => onKeyPress(key)}
            type="button"
          >
            {key}
          </button>
        ))}
      </div>
    ))}
  </div>
)

const OPERATOR_KEYS = ['+', '-', '×', '÷']
const isOperatorEnding = (input: string) => /[+\-×÷*/]$/.test(input)

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
      if (!prev || isOperatorEnding(prev)) {
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
    if (OPERATOR_KEYS.includes(key)) {
      // Prevent invalid operator sequences
      if (!expression && key !== '-') {
        // Cannot start with operator other than '-'
        return
      }
      setExpression(prev => {
        if (isOperatorEnding(prev)) {
          // Replace the last operator with the new one
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
          // eslint-disable-next-line no-eval
          const evalResult = eval(sanitized)
          const resultString = String(evalResult)
          setResult(resultString)
          setAns(evalResult)
          setError('')
          setStatusLabel('Result')
        } catch {
          setError('Error evaluating expression')
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
        // Digit or other
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