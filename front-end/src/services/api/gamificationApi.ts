import { apiRequest } from './httpClient'

export type CoinTransactionType = 'EARNED' | 'SPENT' | 'REFUNDED'

export interface CoinTransactionRecord {
  id: string
  amount: number
  type: CoinTransactionType
  reason: string
  refType?: string | null
  refId?: string | null
  createdAt: string
}

export interface CoinTransactionsResponse {
  items?: CoinTransactionRecord[]
  transactions?: CoinTransactionRecord[]
  total?: number
}

/**
 * Read-only client for GET /api/v1/gamification/me/coin-transactions.
 * Never fabricates transactions; callers handle unavailable/error states explicitly.
 */
export const gamificationApi = {
  getCoinTransactions: (params?: { type?: CoinTransactionType; limit?: number }) =>
    apiRequest<CoinTransactionRecord[] | CoinTransactionsResponse>('/gamification/me/coin-transactions', {
      method: 'GET',
      query: {
        ...(params?.type ? { type: params.type } : {}),
        ...(params?.limit ? { limit: params.limit } : {}),
      },
    }),
}
