import React from 'react'

type ScientificControlType = 'function' | 'constant' | 'operator'

type ScientificControl = {
  label: string
  value: string
  type: ScientificControlType
  description: string
}

const scientificGroups: { title: string; controls: ScientificControl[] }[] = [
  {
    title: 'Functions',
    controls: [
      { label: 'sin()', value: 'sin(', type: 'function', description: 'Sine (degrees)' },
      { label: 'cos()', value: 'cos(', type: 'function', description: 'Cosine (degrees)' },
      { label: 'tan()', value: 'tan(', type: 'function', description: 'Tangent (degrees)' },
      { label: 'asin()', value: 'asin(', type: 'function', description: 'Inverse Sine' },
      { label: 'acos()', value: 'acos(', type: 'function', description: 'Inverse Cosine' },
      { label: 'atan()', value: 'atan(', type: 'function', description: 'Inverse Tangent' },
      { label: 'ln()', value: 'ln(', type: 'function', description: 'Natural logarithm' },
      { label: 'log()', value: 'log(', type: 'function', description: 'Base 10 logarithm' }
    ]
  },
  {
    title: 'Constants',
    controls: [
      { label: 'π', value: 'π', type: 'constant', description: 'Pi constant' },
      { label: 'e', value: 'e', type: 'constant', description: 'Euler’s number' },
      { label: 'Ans', value: 'Ans', type: 'constant', description: 'Last result' }
    ]
  },
  {
    title: 'Operators',
    controls: [
      { label: '^', value: ' ^ ', type: 'operator', description: 'Power' },
      { label: '%', value: ' % ', type: 'operator', description: 'Percent' }
    ]
  }
]

type ScientificInputControlsProps = {
  onInsert: (token: string, type: ScientificControlType) => void
}

export default function ScientificInputControls({ onInsert }: ScientificInputControlsProps) {
  const renderControl = (control: ScientificControl) => (
    <button
      key={`${control.label}-${control.type}`}
      type="button"
      className={`scientific-control-button scientific-control-button--${control.type}`}
      aria-label={`Insert ${control.label}`}
      title={control.description}
      onClick={() => onInsert(control.value, control.type)}
    >
      <span className="scientific-control-button__label">{control.label}</span>
      <span className="scientific-control-button__description">{control.description}</span>
    </button>
  )

  return (
    <section className="scientific-controls" aria-label="Scientific controls">
      {scientificGroups.map(group => (
        <div className="scientific-controls__group" key={group.title}>
          <p className="scientific-controls__title">{group.title}</p>
          <div className="scientific-controls__grid">{group.controls.map(renderControl)}</div>
        </div>
      ))}
    </section>
  )
}
