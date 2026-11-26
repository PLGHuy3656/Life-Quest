import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LandingPage } from './LandingPage'

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/welcome']}>
      <LandingPage />
    </MemoryRouter>,
  )
}

describe('LandingPage (FE-12B)', () => {
  it('renders approved hero headline, subtitle, and auth CTAs', () => {
    renderLanding()

    expect(screen.getByTestId('landing-page')).toBeInTheDocument()
    expect(screen.getAllByText(/Mỗi ngày đều là/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/phiêu lưu\./i).length).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByText(
        /Không cần hoàn hảo ngay từ đầu\. Chỉ cần bắt đầu, Fox sẽ đồng hành cùng bạn\./i,
      ).length,
    ).toBeGreaterThanOrEqual(1)

    const startBtn = screen.getByTestId('landing-start-btn')
    expect(startBtn).toHaveAttribute('href', '/register')
    expect(startBtn).toHaveTextContent(/Bắt đầu hành trình/i)

    const loginBtn = screen.getByTestId('landing-login-btn')
    expect(loginBtn).toHaveAttribute('href', '/login')
  })

  it('renders all 4 journey checkpoints and honest preview/upcoming labels', () => {
    renderLanding()

    expect(screen.getAllByText('CHẶNG 1').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('CHẶNG 2').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('CHẶNG 3').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText('CHẶNG 4').length).toBeGreaterThanOrEqual(1)

    expect(screen.getAllByText(/Việc nhỏ mỗi ngày/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Đạt IELTS 6\.5/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Một người bạn luôn/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Đi xa hơn khi có/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Sắp ra mắt/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Bản xem trước/i).length).toBeGreaterThanOrEqual(1)
  })

  it('uses static WebP reduced-motion picture sources and zero WebGL canvases', () => {
    const { container } = renderLanding()

    const reducedSources = container.querySelectorAll(
      'picture > source[media="(prefers-reduced-motion: reduce)"]',
    )
    expect(reducedSources.length).toBeGreaterThanOrEqual(10)
    expect(container.querySelectorAll('canvas').length).toBe(0)
  })

  it('opens and closes privacy and terms legal notices from footer signpost', async () => {
    const user = userEvent.setup()
    renderLanding()

    const privacyButtons = screen.getAllByRole('button', { name: 'Quyền riêng tư' })
    await user.click(privacyButtons[0])

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/Quyền riêng tư · LifeQuest/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Đã hiểu' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
