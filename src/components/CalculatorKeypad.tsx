import React from 'react'
import { mapKeyboardToCalculatorKey } from '../utils/keyboard'

type KeypadButton = {
  label: string
  variant: 'primary' | 'secondary' | 'tinted'
  value?: string
}

const scientificKeys: KeypadButton[] = [
  { label: 'sin', value: 'sin(', variant: 'secondary' },
  { label: 'cos', value: 'cos(', variant: 'secondary' },
  { label: 'tan', value: 'tan(', variant: 'secondary' },
  { label: 'asin', value: 'asin(', variant: 'secondary' },
  { label: 'acos', value: 'acos(', variant: 'secondary' },
  { label: 'atan', value: 'atan(', variant: 'secondary' },
  { label: 'sqrt', value: 'sqrt(', variant: 'secondary' },
  { label: 'log', value: 'log(', variant: 'secondary' },
  { label: 'ln', value: 'ln(', variant: 'secondary' },
  { label: 'log10', value: 'log10(', variant: 'secondary' },
  { label: 'exp', value: 'exp(', variant: 'secondary' },
  { label: 'abs', value: 'abs(', variant: 'secondary' },
  { label: 'square', value: 'square(', variant: 'secondary' },
  { label: 'cube', value: 'cube(', variant: 'secondary' },
  { label: 'reciprocal', value: 'reciprocal(', variant: 'secondary' },
  { label: 'factorial', value: 'factorial(', variant: 'secondary' },
  { label: 'π', value: 'π', variant: 'tinted' },
  { label: 'e', value: 'e', variant: 'tinted' }
]

const coreKeys: KeypadButton[] = [
  { label: 'AC', variant: 'secondary' },
  { label: 'DEL', variant: 'secondary' },
  { label: '(', variant: 'tinted' },
  { label: ')', variant: 'tinted' },
  { label: '%', variant: 'tinted' },
  { label: '÷', variant: 'primary' },
  { label: '7', variant: 'tinted' },
  { label: '8', variant: 'tinted' },
  { label: '9', variant: 'tinted' },
  { label: '×', variant: 'primary' },
  { label: '4', variant: 'tinted' },
  { label: '5', variant: 'tinted' },
  { label: '6', variant: 'tinted' },
  { label: '-', variant: 'primary' },
  { label: '1', variant: 'tinted' },
  { label: '2', variant: 'tinted' },
  { label: '3', variant: 'tinted' },
  { label: '+', variant: 'primary' },
  { label: '0', variant: 'tinted' },
  { label: '.', variant: 'tinted' },
  { label: '=', variant: 'primary' },
  { label: 'Ans', variant: 'secondary' }
]

type CalculatorKeypadProps = {
  onKeyPress: (key: string) => void
}

export default function CalculatorKeypad({ onKeyPress }: CalculatorKeypadProps) {
  // Handle keyboard input only when this keypad section is focused
  const handleKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.metaKey || e.ctrlKey || e.altKey) {
      return
    }

    const mappedKey = mapKeyboardToCalculatorKey(e.key)
    if (!mappedKey) {
      return
    }

    e.preventDefault()
    onKeyPress(mappedKey)
  }

  const renderButton = (key: KeypadButton) => {
    const value = key.value ?? key.label
    return (
      <button
        type="button"
        key={key.label}
        className={`keypad-button keypad-button--${key.variant}`}
        aria-label={`Key ${key.label}`}
        onClick={() => onKeyPress(value)}
      >
        {key.label}
      </button>
    )
  }

  return (
    <section
      className="calculator-keypad"
      aria-label="Calculator keypad region"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="keypad-header">
        <div>
          <p>Calculator Keypad</p>
          <span>Use buttons or keyboard input to build expressions</span>
        </div>
        <div className="keypad-operator-hint">^ for power, % for percentage</div>
      </div>
      <div className="keypad-helper-text">
        Examples: <strong>200+10%</strong> (percent increment), <strong>2^8</strong> (power)
      </div>
      <div className="keypad-grid keypad-grid--scientific" role="group" aria-label="Scientific controls">
        {scientificKeys.map(renderButton)}
      </div>
      <div className="keypad-grid" role="group" aria-label="Calculator buttons">
        {coreKeys.map(renderButton)}
      </div>
    </section>
  )
}
