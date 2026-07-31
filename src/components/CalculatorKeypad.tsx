import React, { useEffect } from 'react'

type KeypadButton = {
  label: string
  variant: 'primary' | 'secondary' | 'tinted'
}

const placeholderKeys: KeypadButton[] = [
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
      <div className="keypad-grid" role="group" aria-label="Calculator buttons">
        {placeholderKeys.map(key => (
          <button
            type="button"
            key={key.label}
            className={`keypad-button keypad-button--${key.variant}`}
            aria-label={`Key ${key.label}`}
            onClick={() => onKeyPress(key.label)}
          >
            {key.label}
          </button>
        ))}
      </div>
    </section>
  )
}
