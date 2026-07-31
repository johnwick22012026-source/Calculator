import React, { useEffect } from 'react'

type KeypadButton = {
  label: string
  variant: 'primary' | 'secondary' | 'tinted'
  value?: string
}

const scientificKeys: KeypadButton[] = [
  { label: 'sqrt', value: 'sqrt(', variant: 'secondary' },
  { label: 'square', value: 'square(', variant: 'secondary' },
  { label: 'cube', value: 'cube(', variant: 'secondary' },
  { label: 'reciprocal', value: 'reciprocal(', variant: 'secondary' },
  { label: 'abs', value: 'abs(', variant: 'secondary' },
  { label: 'ln', value: 'ln(', variant: 'secondary' },
  { label: 'log10', value: 'log10(', variant: 'secondary' },
  { label: 'exp', value: 'exp(', variant: 'secondary' },
  { label: 'factorial', value: 'factorial(', variant: 'secondary' },
  { label: 'π', value: 'π', variant: 'tinted' },
  { label: 'e', value: 'e', variant: 'tinted' },
]

const coreKeys: KeypadButton[] = [
  { label: 'AC', variant: 'secondary' },
  { label: 'DEL', variant: 'secondary' },
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
  { label: 'Ans', variant: 'secondary' },
]

type CalculatorKeypadProps = {
  onKeyPress: (key: string) => void
}

export default function CalculatorKeypad({ onKeyPress }: CalculatorKeypadProps) {
  // Handle keyboard input globally to match UI copy instructions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      let mappedKey: string | undefined
      const { key } = e

      switch (key) {
        case 'Enter':
          mappedKey = '='
          break
        case 'Backspace':
          mappedKey = 'DEL'
          break
        case 'Escape':
          mappedKey = 'AC'
          break
        case '*':
          mappedKey = '×'
          break
        case '/':
          mappedKey = '÷'
          break
        default:
          // digits, dot, operators, percent, power, equals
          if (/^[0-9]$/.test(key) || ['.', '+', '-', '%', '^', '='].includes(key)) {
            mappedKey = key
          }
      }

      if (mappedKey) {
        e.preventDefault()
        onKeyPress(mappedKey)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onKeyPress])

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
