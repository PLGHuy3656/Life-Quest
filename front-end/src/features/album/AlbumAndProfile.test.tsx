import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { AppRoutes } from '@/app/router'
import { CompanionProvider } from '@/features/mascot/CompanionProvider'
import { useAlbumStore } from '@/features/album/albumStore'
import { useAuthStore } from '@/stores/authStore'
import { useMockProfileStore } from '@/stores/mockProfileStore'

function renderAt(path: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={qc}>
      <CompanionProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </CompanionProvider>
    </QueryClientProvider>,
  )
}

describe('FE-13C Profile Viewer States & Privacy Projections', () => {
  beforeEach(() => {
    useAuthStore.getState().clearSession()
    useMockProfileStore.getState().deactivateMockSession()
    useMockProfileStore.getState().resetProfile()
    useAlbumStore.getState().resetAlbumStore()
  })

  it('renders Own Profile with tabs (Overview, Badges with TRANG TRÍ, Album, Moments)', async () => {
    const user = userEvent.setup()
    renderAt('/profile')

    expect(await screen.findByTestId('profile-page')).toHaveAttribute('data-viewer-relation', 'SELF')
    expect(screen.getByTestId('fox-stage')).toBeInTheDocument()

    await user.click(screen.getByTestId('profile-tab-badges'))
    expect(screen.getByTestId('profile-badges-panel')).toBeInTheDocument()
    expect(screen.getAllByText('TRANG TRÍ').length).toBeGreaterThan(0)

    await user.click(screen.getByTestId('profile-tab-album'))
    expect(screen.getByTestId('profile-album-panel')).toBeInTheDocument()

    await user.click(screen.getByTestId('profile-tab-moments'))
    expect(screen.getByTestId('profile-moments-panel')).toBeInTheDocument()
  })

  it('renders Friend Profile respecting hidden Streak and never exposing private albums', async () => {
    const user = userEvent.setup()
    renderAt('/profile/gia-huy')

    expect(await screen.findByTestId('profile-page')).toHaveAttribute('data-viewer-relation', 'FRIEND')
    expect(screen.getByTestId('ticket-stat-hidden')).toHaveTextContent('Đã ẩn bởi chủ hồ sơ')

    await user.click(screen.getByTestId('profile-tab-album'))
    expect(screen.queryByText('Nhật ký IELTS 6.5')).not.toBeInTheDocument()
    expect(screen.queryByText('Minh chứng Task')).not.toBeInTheDocument()
  })

  it('renders Non-Friend Profile with restricted lock and sends friend request', async () => {
    const user = userEvent.setup()
    renderAt('/profile/minh-khoi')

    expect(await screen.findByTestId('profile-page')).toHaveAttribute(
      'data-viewer-relation',
      'NON_FRIEND',
    )
    expect(screen.getByTestId('profile-restricted-lock')).toBeInTheDocument()
    expect(screen.queryByTestId('profile-tab-album')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('profile-send-request-btn'))
    expect(screen.getByTestId('profile-page')).toHaveAttribute(
      'data-viewer-relation',
      'PENDING_OUT',
    )
  })

  it('renders Pending In request and reloads projection as FRIEND on accept', async () => {
    const user = userEvent.setup()
    renderAt('/profile/thu-ha')

    expect(await screen.findByTestId('profile-pending-banner')).toBeInTheDocument()
    await user.click(screen.getByTestId('profile-accept-request-btn'))
    expect(screen.getByTestId('profile-page')).toHaveAttribute('data-viewer-relation', 'FRIEND')
  })

  it('renders Blocker Unblock view and identical neutral Not Found screen for missing profiles', async () => {
    const { unmount } = renderAt('/profile/an-nguyen')
    expect(await screen.findByTestId('profile-blocked-view')).toBeInTheDocument()
    expect(screen.getByTestId('profile-unblock-btn')).toBeInTheDocument()
    unmount()

    renderAt('/profile/khong-ton-tai')
    expect(await screen.findByTestId('profile-not-found')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Không tìm thấy hồ sơ' })).toBeInTheDocument()
  })
})

describe('FE-14C Album Overview, Open Book, Gallery, Timeline & Privacy Confirmation', () => {
  beforeEach(() => {
    useAlbumStore.getState().resetAlbumStore()
  })

  it('navigates Overview -> Open Book -> Chapter tabs -> Photo Detail -> Privacy confirmation dialog', async () => {
    const user = userEvent.setup()
    renderAt('/album')

    expect(await screen.findByTestId('album-overview-view')).toBeInTheDocument()
    await user.click(screen.getByTestId('album-card-alb-run-10k'))

    expect(await screen.findByTestId('open-book-view')).toBeInTheDocument()
    expect(screen.getByTestId('book-chapter-tabs')).toBeInTheDocument()

    // Switch chapter tab
    await user.click(screen.getByTestId('chapter-tab-1'))
    expect(screen.getByTestId('chapter-tab-1')).toHaveAttribute('aria-selected', 'true')

    // Go back to chapter 0 and open PRIVATE photo ph-1
    await user.click(screen.getByTestId('chapter-tab-0'))
    await user.click(screen.getByTestId('book-photo-ph-1'))
    expect(await screen.findByTestId('photo-detail-modal')).toBeInTheDocument()

    // Widening PRIVATE -> FRIENDS MUST open ConfirmVisibilityDialog (alertdialog)
    await user.click(screen.getByTestId('photo-vis-FRIENDS'))
    expect(await screen.findByTestId('confirm-visibility-dialog')).toBeInTheDocument()
    await user.click(screen.getByTestId('confirm-visibility-accept'))
    expect(screen.queryByTestId('confirm-visibility-dialog')).not.toBeInTheDocument()

    // Narrowing FRIENDS -> PRIVATE applies immediately with Undo toast
    await user.click(screen.getByTestId('photo-vis-PRIVATE'))
    expect(await screen.findByTestId('privacy-undo-toast')).toBeInTheDocument()
  })

  it('renders Gallery multi-select bulk bar and Timeline view', async () => {
    const user = userEvent.setup()
    renderAt('/album/gallery')

    expect(await screen.findByTestId('album-gallery-view')).toBeInTheDocument()
    await user.click(screen.getByTestId('gallery-select-mode-btn'))
    await user.click(screen.getByTestId('gallery-photo-ph-1'))
    expect(screen.getByTestId('gallery-bulk-bar')).toBeInTheDocument()

    await user.click(screen.getByTestId('album-nav-timeline'))
    expect(await screen.findByTestId('album-timeline-view')).toBeInTheDocument()
  })

  it('renders Upload modal with PRIVATE default and explicit no-auto-Moment guarantee', async () => {
    const user = userEvent.setup()
    renderAt('/album')

    await user.click(screen.getByTestId('album-upload-btn'))
    const modal = await screen.findByTestId('album-upload-modal')
    expect(modal).toHaveTextContent('Chỉ mình tôi')
    expect(modal).toHaveTextContent('Không tự động đăng lên Moments')
    expect(modal).toHaveTextContent('Cần backend: dịch vụ tải ảnh')
  })
})
