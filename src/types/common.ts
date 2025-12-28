export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, unknown>
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface DatabaseRow {
  id: string
  created_at: string
  updated_at?: string
}

export interface SupabaseResponse<T> {
  data: T | null
  error: { message: string } | null
  count?: number | null
}

export type AsyncResult<T> = Promise<ApiResponse<T>>
