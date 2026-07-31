import React, { forwardRef } from 'react'

type CalculatorDisplayProps = {
  expression?: string
  result?: string
  statusLabel?: string
  error?: string
  hasError?: boolean
  angleModeLabel?: string
  onExpressionChange: (expr: string, selStart: number, selEnd: number) => void
}

const CalculatorDisplay = forwardRef<HTMLInputElement, CalculatorDisplayProps>(
  (
    {
      expression = '',
      result = '',
      statusLabel = 'Ready',
      error = '',
      hasError = false,
      angleModeLabel = 'Degrees',
      onExpressionChange
    },
    ref
  ) => {
    const placeholderText = 'Enter an expression'

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onExpressionChange(e.target.value, e.target.selectionStart ?? 0, e.target.selectionEnd ?? 0)
    }

    const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement
      onExpressionChange(target.value, target.selectionStart ?? 0, target.selectionEnd ?? 0)
    }

    return (
      <section
        className={`calculator-display ${hasError ? 'calculator-display--error' : ''}`}
        aria-label="Calculator display region"
      >
        <div className="display-header">
          <span>{statusLabel}</span>
          <span className="display-subtle">Scientific toolbar</span>
        </div>
        <div className="display-mode" aria-live="polite">
          <span>Angle mode:</span>
          <strong>{angleModeLabel}</strong>
          <span className="display-mode-hint">Trig results and inputs follow this mode</span>
        </div>
        <input
          ref={ref}
          className={`display-expression ${hasError ? 'display-expression--error' : ''}`}
          type="text"
          aria-label="Expression input"
          placeholder={placeholderText}
          value={expression}
          onChange={handleChange}
          onSelect={handleSelect}
          autoComplete="off"
        />
        <div className="display-feedback" aria-live={hasError ? 'assertive' : 'polite'}>
          <div className="display-result" data-testid="display-result" aria-hidden={hasError}>
            {result || 'Result area'}
          </div>
          <div className={`display-error ${hasError ? 'display-error--visible' : ''}`} role="alert">
            {hasError && (
              <div className="display-error__wrapper">
                <span className="display-error__icon" aria-hidden="true">
                  ⚠️
                </span>
                <div>
                  <p className="display-error__message" data-testid="display-error-message">
                    {error}
                  </p>
                  <p className="display-error__hint">Edit the expression to clear this message.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    )
  }
)

CalculatorDisplay.displayName = 'CalculatorDisplay'
export default CalculatorDisplay
