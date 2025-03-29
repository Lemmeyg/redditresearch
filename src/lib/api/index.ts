import { APIClient, APIClientConfig } from './core'
import { Logger } from './logger'

// Initialize logger
const logger = Logger.getInstance()

// Create API client instance with logging
class LoggedAPIClient extends APIClient {
  constructor(config: Partial<APIClientConfig> = {}) {
    super(config)
  }

  public async request<T>(
    method: string,
    url: string,
    options: RequestInit = {}
  ) {
    logger.info(`API Request: ${method} ${url}`, { options })
    
    try {
      const response = await super.request<T>(method, url, options)
      logger.debug(`API Response: ${method} ${url}`, { response })
      return response
    } catch (error) {
      logger.error(`API Error: ${method} ${url}`, { error })
      throw error
    }
  }
}

// Create and export API instance
export const api = new LoggedAPIClient({
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000 // 1 minute
  }
})

// Export types
export * from './core'
export * from './logger' 