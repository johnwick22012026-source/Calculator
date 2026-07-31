import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

async function clickKey(user: ReturnType<typeof userEvent.setup>, label: string) {
  const button = screen.getByRole('button', { name: `Key ${label}` })
  await user.click(button)
}

describe('Calculator error handling', () => {
  it('shows errors for malformed expressions', async () => {
    const user = userEvent.setup()
    render(<App />)

    await clickKey(user, '2')
    await clickKey(user, '+')
    await clickKey(user, '+')
    await clickKey(user, '3')
    await clickKey(user, '=')

    expect(await screen.findByText('Invalid operator sequence')).toBeInTheDocument()
    expect(screen.getByText('Error detected – fix expression')).toBeInTheDocument()
  })

  it('reports divide-by-zero expressions gracefully', async () => {
    const user = userEvent.setup()
    render(<App />)

    await clickKey(user, '1')
    await clickKey(user, '÷')
    await clickKey(user, '0')
    await clickKey(user, '=')

    expect(await screen.findByText('Cannot divide by zero')).toBeInTheDocument()
  })

  it('recovers from an error state once a valid expression is provided', async () => {
    const user = userEvent.setup()
    render(<App />)

    // trigger divide-by-zero first
    await clickKey(user, '1')
    await clickKey(user, '÷')
    await clickKey(user, '0')
    await clickKey(user, '=')
    expect(await screen.findByText('Cannot divide by zero')).toBeInTheDocument()

    // clear everything to reset error
    await clickKey(user, 'AC')
    expect(screen.queryByText('Cannot divide by zero')).not.toBeInTheDocument()

    // build a valid expression and verify result is shown
    await clickKey(user, '8')
    await clickKey(user, '÷')
    await clickKey(user, '2')
    await clickKey(user, '=')

    expect(screen.getByTestId('display-result')).toHaveTextContent('4')
    expect(screen.queryByText('Cannot divide by zero')).not.toBeInTheDocument()
  })
})

// New tests for nested expressions and unmatched parentheses

describe('Nested expression evaluation and validation feedback', () => {
  it('correctly evaluates nested parentheses expressions', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Expression: (2+(3*4)) = 14
    await clickKey(user, '(')
    await clickKey(user, '2')
    await clickKey(user, '+')
    await clickKey(user, '(')
    await clickKey(user, '3')
    await clickKey(user, '×')
    await clickKey(user, '4')
    await clickKey(user, ')')
    await clickKey(user, ')')
    await clickKey(user, '=')

    expect(await screen.findByTestId('display-result')).toHaveTextContent('14')
    expect(screen.getByText('Result')).toBeInTheDocument()
  })

  it('surfaces mismatched parentheses with a clear error', async () => {
    const user = userEvent.setup()
    render(<App />)

    // Expression: (2+3 = Mismatched parentheses
    await clickKey(user, '(')
    await clickKey(user, '2')
    await clickKey(user, '+')
    await clickKey(user, '3')
    await clickKey(user, '=')

    expect(await screen.findByText('Mismatched parentheses')).toBeInTheDocument()
    expect(screen.getByText('Error detected – fix expression')).toBeInTheDocument()
  })
})

// New tests for scientific insertion UI

describe('Scientific input controls', () => {
  it('inserts function tokens without clearing existing input', async () => {
    const user = userEvent.setup()
    render(<App />)

    await clickKey(user, '2')
    const sinControl = screen.getByRole('button', { name: 'Insert sin()' })
    await user.click(sinControl)
    await clickKey(user, '3')

    const input = screen.getByLabelText('Expression input') as HTMLInputElement
    expect(input.value).toBe('2 sin(3')
  })

  it('inserts constants with spacing to avoid token collisions', async () => {
    const user = userEvent.setup()
    render(<App />)

    const piControl = screen.getByRole('button', { name: 'Insert π' })
    await user.click(piControl)
    await clickKey(user, '÷')
    await clickKey(user, '2')

    const input = screen.getByLabelText('Expression input') as HTMLInputElement
    expect(input.value).toBe('π÷2')
  })
})
