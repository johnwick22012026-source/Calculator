import React from 'react'

type CalculatorDisplayProps = {
  expression?: string
  result?: string
  statusLabel?: string
  error?: string
  hasError?: boolean
}

export default function CalculatorDisplay({
  expression = '',
  result = '',
  statusLabel = 'Ready',
  error = '',
  hasError = false
}: CalculatorDisplayProps) {
  const expressionContent = expression || 'Enter an expression'
  return (
    <section
      className={`calculator-display ${hasError ? 'calculator-display--error' : ''}`}
      aria-label="Calculator display region"
    >
      <div className="display-header">
        <span>{statusLabel}</span>
        <span className="display-subtle">Scientific toolbar</span>
      </div>
      <div className="display-operators-hint" aria-live="polite">
        Supports <span aria-label="percent symbol">%</span> (percent-of or ratio) and <span aria-label="caret symbol">^</span>{' '}
        (exponent) — e.g. <span className="display-helper-example">200+10%</span> or{' '}
        <span className="display-helper-example">2^8</span>
      </div>
      <div className={`display-expression ${hasError ? 'display-expression--error' : ''}`} aria-live="polite">
        {expressionContent}
      </div>
      <div className="display-feedback" aria-live={hasError ? 'assertive' : 'polite'}>
        <div className="display-result" data-testid="display-result" aria-hidden={hasError}> {result || 'Result area'}</div>
        <div className={`display-error ${hasError ? 'display-error--visible' : ''}`} role="alert">
          {hasError && (
            <div className="display-error__wrapper">
              <span className="display-error__icon" aria-hidden="true">
                ⚠️
              </span>
              <div>
                <p className="display-error__message" data-testid="display-error-message">{error}</p>
                <p className="display-error__hint">Edit the expression to clear this message.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
