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
