import React, { useMemo, useState } from 'react'
import './App.css'

const buttons = [
  '7',
  '8',
  '9',
  '/',
  '4',
  '5',
  '6',
  '*',
  '1',
  '2',
  '3',
  '- ',
  '0',
  '.',
  '=',
  '+',
]

export default function App() {
  const [expression, setExpression] = useState('')
  const [error, setError] = useState('')

  const displayValue = useMemo(() => {
    if (error) {
      return error
    }
    if (!expression) {
      return '0'
    }
    return expression
  }, [expression, error])

  const appendValue = (value: string) => {
    if (value === '=') {
      calculateResult()
      return
    }

    if (value.trim() === '') {
      return
    }

    setError('')
    setExpression(prev => {
      const sanitizedPrev = prev.trim()
      if (/[+\-*/.]$/.test(sanitizedPrev) && /[+\-*/.]/.test(value)) {
        return sanitizedPrev.slice(0, -1) + value.trim()
      }
      return sanitizedPrev + value
    })
  }

  const calculateResult = () => {
    try {
      // eslint-disable-next-line no-new-func
      const result = Function(`"use strict"; return (${expression})`)()
      setExpression(String(result))
      setError('')
    } catch (err) {
      setError('Error')
    }
  }

  const clearAll = () => {
    setExpression('')
    setError('')
  }

  const deleteLast = () => {
    setError('')
    setExpression(prev => prev.slice(0, -1))
  }

  return (
    <div className="calculator-container">
      <div className="calculator-display" aria-label="Calculator display">
        {displayValue}
      </div>
      <div className="calculator-keypad" aria-label="Calculator keypad">
        <div className="calculator-controls">
          <button type="button" className="calculator-action" onClick={clearAll}>
            AC
          </button>
          <button type="button" className="calculator-action" onClick={deleteLast}>
            DEL
          </button>
        </div>
        <div className="calculator-grid">
          {buttons.map(btn => (
            <button
              type="button"
              key={btn}
              className={`calculator-button ${/[+\-*/=]/.test(btn) ? 'calculator-button--operator' : ''}`}
              onClick={() => appendValue(btn)}
            >
              {btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
