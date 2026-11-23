import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useUiStore } from '@/stores/uiStore'
import { SocialFeedSection } from '../SocialFeedSection'
import { SocialMediaGrid } from './SocialMediaGrid'
import {
  MAX_IMAGE_SIZE_BYTES,
  classifyAspectRatio,
  validateImageFiles,
  type SocialMediaItem
} from './mediaValidation'

describe('FE-03.5J Adaptive Social Media Validation, Grid, Lightbox & ObjectURL Cleanup', () => {
  const createdUrls: string[] = []
  let createMock: ReturnType<typeof vi.fn>
  let revokeMock: ReturnType<typeof vi.fn>
  let origCreate: typeof URL.createObjectURL | undefined
  let origRevoke: typeof URL.revokeObjectURL | undefined

  beforeEach(() => {
    createdUrls.length = 0
    useUiStore.getState().setSocialComposerDraft('')
    let seq = 0
    origCreate = URL.createObjectURL
    origRevoke = URL.revokeObjectURL
    createMock = vi.fn(() => {
      const url = `blob:http://localhost/test-${++seq}`
      createdUrls.push(url)
      return url
    })
    revokeMock = vi.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: createMock
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: revokeMock
    })
  })

  afterEach(() => {
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      writable: true,
      value: origCreate
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      writable: true,
      value: origRevoke
    })
  })

  it('classifies portrait, square, and landscape ratios accurately', () => {
    expect(classifyAspectRatio(600, 1000)).toBe('portrait')
    expect(classifyAspectRatio(800, 800)).toBe('square')
    expect(classifyAspectRatio(1600, 900)).toBe('landscape')
  })

  it('rejects invalid file types and oversized files with clear messages', () => {
    const pdf = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' })
    const big = new File(['x'], 'huge.png', { type: 'image/png' })
    Object.defineProperty(big, 'size', { value: MAX_IMAGE_SIZE_BYTES + 1024 })
    const ok = new File(['img'], 'photo.jpg', { type: 'image/jpeg' })

    const res = validateImageFiles([pdf, big, ok], 0)
    expect(res.valid).toHaveLength(1)
    expect(res.valid[0].name).toBe('photo.jpg')
    expect(res.errors).toHaveLength(2)
    expect(res.errors[0]).toMatch(/không phải định dạng ảnh hợp lệ/i)
    expect(res.errors[1]).toMatch(/vượt quá giới hạn 8 MB/i)
  })

  it('renders single portrait, square, and landscape frames with correct orientation attributes', () => {
    const portrait: SocialMediaItem = { id: 'p1', src: 'blob:p1', alt: 'Portrait', aspectRatio: 0.65 }
    const { rerender } = render(<SocialMediaGrid items={[portrait]} />)
    expect(screen.getByTestId('social-media-grid')).toHaveAttribute('data-layout', 'single')
    expect(screen.getByTestId('social-image-preview')).toHaveAttribute('data-orientation', 'portrait')

    const square: SocialMediaItem = { id: 's1', src: 'blob:s1', alt: 'Square', aspectRatio: 1 }
    rerender(<SocialMediaGrid items={[square]} />)
    expect(screen.getByTestId('social-image-preview')).toHaveAttribute('data-orientation', 'square')

    const landscape: SocialMediaItem = { id: 'l1', src: 'blob:l1', alt: 'Landscape', aspectRatio: 1.78 }
    rerender(<SocialMediaGrid items={[landscape]} />)
    expect(screen.getByTestId('social-image-preview')).toHaveAttribute('data-orientation', 'landscape')
  })

  it('renders +N overflow badge for >4 images and supports Lightbox keyboard navigation & focus return', async () => {
    const user = userEvent.setup()
    const fiveItems: SocialMediaItem[] = Array.from({ length: 5 }, (_, i) => ({
      id: `img-${i}`,
      src: `blob:img-${i}`,
      alt: `Ảnh số ${i + 1}`,
      aspectRatio: 1.33
    }))

    render(<SocialMediaGrid items={fiveItems} />)
    expect(screen.getByTestId('social-media-grid')).toHaveAttribute('data-layout', 'fourPlus')
    expect(screen.getByTestId('social-media-overflow-badge')).toHaveTextContent('+1')

    const firstTrigger = screen.getByRole('button', { name: /Ảnh số 1/i })
    await user.click(firstTrigger)

    const dialog = screen.getByTestId('social-media-lightbox')
    expect(dialog).toBeInTheDocument()
    expect(screen.getByText('1 / 5')).toBeInTheDocument()

    await user.keyboard('{ArrowRight}')
    expect(screen.getByText('2 / 5')).toBeInTheDocument()

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByText('1 / 5')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => {
      expect(screen.queryByTestId('social-media-lightbox')).not.toBeInTheDocument()
    })
    expect(document.activeElement).toBe(firstTrigger)
  })

  it('creates local object URLs on selection, revokes on removal and unmount, and never fakes upload', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<SocialFeedSection expandedWide={false} userInitial="B" />)

    // Compact before media selection
    expect(screen.getByTestId('social-composer-card')).toHaveAttribute('data-has-media', '0')
    expect(screen.queryByTestId('composer-media-drawer')).not.toBeInTheDocument()

    const file1 = new File(['a'], 'morning.png', { type: 'image/png' })
    const file2 = new File(['b'], 'desk.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByTestId('social-media-file-input') as HTMLInputElement

    await user.upload(fileInput, [file1, file2])

    expect(createMock).toHaveBeenCalledTimes(2)
    expect(screen.getByTestId('social-composer-card')).toHaveAttribute('data-has-media', '1')
    expect(screen.getByTestId('composer-media-drawer')).toBeInTheDocument()

    // Submit with local media surfaces honest UNAVAILABLE notice (never fakes upload)
    await user.click(screen.getByRole('button', { name: 'Đăng bài chia sẻ' }))
    expect(screen.getByTestId('social-capability-status')).toHaveTextContent(/UNAVAILABLE:/)

    // Remove first image -> revokes first object URL
    await user.click(screen.getByRole('button', { name: /Xóa ảnh morning\.png/i }))
    expect(revokeMock).toHaveBeenCalledWith(createdUrls[0])

    // Unmount -> revokes remaining second object URL (zero memory leak)
    unmount()
    expect(revokeMock).toHaveBeenCalledWith(createdUrls[1])
  })
})
