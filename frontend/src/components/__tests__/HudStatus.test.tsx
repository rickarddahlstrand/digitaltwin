import { render, screen } from '@testing-library/react'
import HudStatus from '../HudStatus'

describe('HudStatus', () => {
  it('renders the status text', () => {
    render(<HudStatus status="Tiles: Ready" />)
    expect(screen.getByText('Tiles: Ready')).toBeInTheDocument()
  })

  it('renders inside a pointer-events-none container', () => {
    render(<HudStatus status="Loading..." />)
    const container = screen.getByText('Loading...').closest('.pointer-events-none')
    expect(container).toBeInTheDocument()
  })
})
