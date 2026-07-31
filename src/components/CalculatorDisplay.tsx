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
      <div className="display-operators-hint" aria-live="polite">
        Supports <span aria-label="percent symbol">%</span> (percent-of or ratio) and <span aria-label="caret symbol">^</span> (exponent)
        — e.g. <span className="display-helper-example">200+10%</span> or <span className="display-helper-example">2^8</span>
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
