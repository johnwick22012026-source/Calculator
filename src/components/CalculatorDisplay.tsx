import React from 'react'

type CalculatorDisplayProps = {
  expression?: string
  result?: string
  statusLabel?: string
}

export default function CalculatorDisplay({
  expression = '',
  result = '',
  statusLabel = 'Ready',
}: CalculatorDisplayProps) {
  return (
    <section className="calculator-display" aria-label="Calculator display region">
      <div className="display-header">
        <span>{statusLabel}</span>
        <span className="display-subtle">Scientific toolbar</span>
      </div>
      <div className="display-expression" role="textbox" aria-live="polite">
        {expression || 'Enter an expression'}
      </div>
      <div className="display-result" aria-live="polite">
        {result || 'Result area'}
      </div>
    </section>
  )
}
