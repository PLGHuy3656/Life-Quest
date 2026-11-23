export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif'
] as const

export const ALLOWED_IMAGE_ACCEPT = ALLOWED_IMAGE_MIME_TYPES.join(',')
export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024 // 8 MB
export const MAX_COMPOSER_IMAGES = 8

export type ImageOrientation = 'portrait' | 'landscape' | 'square'

export interface SocialMediaItem {
  id: string
  src: string
  alt: string
  /** Optional known intrinsic aspect ratio (width / height) */
  aspectRatio?: number
  /** True only for built-in static demonstration fixtures */
  isPreviewFixture?: boolean
  /** True for local URL.createObjectURL() items that must be revoked on cleanup */
  isObjectUrl?: boolean
  fileName?: string
  fileSize?: number
}

export interface FileValidationResult {
  valid: File[]
  errors: string[]
}

export function classifyAspectRatio(width: number, height: number): ImageOrientation {
  if (!width || !height) return 'landscape'
  const ratio = width / height
  if (ratio < 0.85) return 'portrait'
  if (ratio > 1.2) return 'landscape'
  return 'square'
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function validateImageFiles(
  incoming: FileList | File[],
  existingCount: number
): FileValidationResult {
  const files = Array.from(incoming)
  const valid: File[] = []
  const errors: string[] = []
  let slotsLeft = Math.max(0, MAX_COMPOSER_IMAGES - existingCount)

  for (const file of files) {
    const isAllowedType = (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)
    if (!isAllowedType) {
      errors.push(
        `"${file.name}" không phải định dạng ảnh hợp lệ (chỉ hỗ trợ JPG, PNG, WebP, GIF, AVIF).`
      )
      continue
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      errors.push(
        `"${file.name}" vượt quá giới hạn 8 MB (${formatFileSize(file.size)}).`
      )
      continue
    }

    if (slotsLeft <= 0) {
      errors.push(`Chỉ có thể chọn tối đa ${MAX_COMPOSER_IMAGES} ảnh cho mỗi bài viết.`)
      break
    }

    valid.push(file)
    slotsLeft -= 1
  }

  return { valid, errors }
}
