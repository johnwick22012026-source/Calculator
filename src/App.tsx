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

export default function App() {
  const [expression, setExpression] = useState<string>('')
  const [result, setResult] = useState<string>('')
  const [statusLabel, setStatusLabel] = useState<string>('Waiting for input')
  const [ans, setAns] = useState<number | string>('')
  const [error, setError] = useState<string>('')

  const handleKeyPress = (key: string) => {
    switch (key) {
      case 'AC':
        setExpression('')
        setResult('')
        setError('')
        setStatusLabel('Cleared')
        break
      case 'DEL':
        setExpression(prev => prev.slice(0, -1))
        setResult('')
        setError('')
        setStatusLabel('Editing')
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
        setExpression(prev => prev + ans)
        setError('')
        setStatusLabel('Editing')
        break
      default:
        setExpression(prev => prev + key)
        setResult('')
        setError('')
        setStatusLabel('Editing')
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
