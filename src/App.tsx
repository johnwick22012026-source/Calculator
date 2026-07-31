import React, { useState } from 'react'
import CalculatorDisplay from './components/CalculatorDisplay'
import CalculatorKeypad from './components/CalculatorKeypad'
import './App.css'

export default function App() {
  const [expression, setExpression] = useState<string>('')
  const [result, setResult] = useState<string>('')
  const [statusLabel, setStatusLabel] = useState<string>('Waiting for input')
  const [ans, setAns] = useState<number | string>('')

  const handleKeyPress = (key: string) => {
    switch (key) {
      case 'AC':
        setExpression('')
        setResult('')
        setStatusLabel('Cleared')
        break
      case 'DEL':
        setExpression(prev => prev.slice(0, -1))
        setResult('')
        setStatusLabel('Editing')
        break
      case '=':
        try {
          if (!expression) {
            setStatusLabel('Nothing to evaluate')
            return
          }
          const sanitized = expression
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
          // eslint-disable-next-line no-eval
          const evalResult = eval(sanitized)
          const resultString = String(evalResult)
          setResult(resultString)
          setAns(evalResult)
          setStatusLabel('Result')
        } catch {
          setResult('Error')
          setStatusLabel('Error')
        }
        break
      case 'Ans':
        setExpression(prev => prev + ans)
        setStatusLabel('Editing')
        break
      default:
        setExpression(prev => prev + key)
        setResult('')
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
        />
        <CalculatorKeypad onKeyPress={handleKeyPress} />
      </div>
    </main>
  )
}
