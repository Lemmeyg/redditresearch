import { createClient } from '@supabase/supabase-js'

// API Error Types
export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// API Response Types
export interface APIResponse<T> {
  data?: T
  error?: {
    message: string
    code: string
    status: number
  }
}

// Rate Limiting Types
export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

// API Client Configuration
export interface APIClientConfig {
  baseURL?: string
  rateLimit?: RateLimitConfig
  timeout?: number
}

// Default configuration
const DEFAULT_CONFIG: APIClientConfig = {
  timeout: 30000, // 30 seconds
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  }
}

export class APIClient {
  private config: APIClientConfig
  private requestCount: number = 0
  private lastReset: number = Date.now()

  constructor(config: Partial<APIClientConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  private async checkRateLimit() {
    const now = Date.now()
    const { maxRequests, windowMs } = this.config.rateLimit!

    if (now - this.lastReset > windowMs) {
      this.requestCount = 0
      this.lastReset = now
    }

    if (this.requestCount >= maxRequests) {
      throw new APIError(
        'Rate limit exceeded',
        429,
        'RATE_LIMIT_EXCEEDED'
      )
    }

    this.requestCount++
  }

  private async handleResponse<T>(response: Response): Promise<APIResponse<T>> {
    if (!response.ok) {
      throw new APIError(
        response.statusText,
        response.status,
        'API_ERROR'
      )
    }

    const data = await response.json()
    return { data }
  }

  public async request<T>(
    method: string,
    url: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    try {
      await this.checkRateLimit()

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      return await this.handleResponse<T>(response)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }

      throw new APIError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        500,
        'INTERNAL_ERROR'
      )
    }
  }

  public async get<T>(url: string, options?: RequestInit): Promise<APIResponse<T>> {
    return this.request<T>('GET', url, options)
  }

  public async post<T>(url: string, data?: any, options?: RequestInit): Promise<APIResponse<T>> {
    return this.request<T>('POST', url, {
      ...options,
      body: JSON.stringify(data),
    })
  }

  public async put<T>(url: string, data?: any, options?: RequestInit): Promise<APIResponse<T>> {
    return this.request<T>('PUT', url, {
      ...options,
      body: JSON.stringify(data),
    })
  }

  public async delete<T>(url: string, options?: RequestInit): Promise<APIResponse<T>> {
    return this.request<T>('DELETE', url, options)
  }
} 