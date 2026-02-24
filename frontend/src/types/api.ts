export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  detail?: string
  [field: string]: string | string[] | undefined
}

export interface TokenPair {
  access: string
  refresh: string
}
