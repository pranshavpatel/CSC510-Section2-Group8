import React from 'react'
import { render } from '@testing-library/react'
import Loading from '@/app/browse/loading'

describe('Browse Loading Component', () => {
  it('should render without errors', () => {
    const { container } = render(<Loading />)
    expect(container).toBeInTheDocument()
  })

  it('should return null', () => {
    const { container } = render(<Loading />)
    expect(container.firstChild).toBeNull()
  })
})

