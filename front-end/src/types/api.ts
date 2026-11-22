export interface ApiSuccessEnvelope<T> {
  success: true
  data: T
}

export interface ApiErrorDetail {
  code: string
  message: string
}

export interface ApiErrorEnvelope {
  success: false
  error: ApiErrorDetail
}

export type DataSourceMode = 'LIVE' | 'MOCK' | 'UNAVAILABLE'

export interface RepositoryResult<T> {
  data: T
  source: DataSourceMode
  note?: string
}

export class ApiClientError extends Error {
  public readonly status: number
  public readonly code: string
  public readonly isNetworkError: boolean

  constructor(options: {
    status: number
    code: string
    message: string
    isNetworkError?: boolean
  }) {
    super(options.message)
    this.name = 'ApiClientError'
    this.status = options.status
    this.code = options.code
    this.isNetworkError = Boolean(options.isNetworkError)
  }
}
