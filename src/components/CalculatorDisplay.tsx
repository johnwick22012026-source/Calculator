import React from 'react'

type CalculatorDisplayProps = {
  expression?: string
  result?: string
  statusLabel?: string
  error?: string
}

export default function CalculatorDisplay({
  expression = '',
  result = '',
  statusLabel = 'Ready',
  error = ''
}: CalculatorDisplayProps) {
  const hasError = Boolean(error)

  return (
    <section className="calculator-display" aria-label="Calculator display region">
      <div className="display-header">
        <span>{statusLabel}</span>
        <span className="display-subtle">Scientific toolbar</span>
      </div>
      <div className="display-expression" aria-live="polite">
        {expression || 'Enter an expression'}
      </div>
      <div className="display-feedback" aria-live={hasError ? 'assertive' : 'polite'}>
        <div className="display-result" aria-hidden={hasError}>
          {result || 'Result area'}
        </div>
        <div className={`display-error ${hasError ? 'display-error--visible' : ''}`} role="alert">
          {hasError ? error : ''}
        </div>
      </div>
    </section>
  )
}
