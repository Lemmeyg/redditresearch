import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Logger, LogLevel } from './lib/api/logger'

// Initialize logger
const logger = Logger.getInstance()
logger.setLogLevel(LogLevel.INFO)

// Rate limiting configuration
const RATE_LIMIT = {
  window: 60 * 1000, // 1 minute
  max: 100 // requests per window
}

// In-memory store for rate limiting
// Note: In production, use Redis or similar for distributed rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>()

export async function middleware(request: NextRequest) {
  // Only apply to API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next()
  }

  const ip = request.ip ?? 'anonymous'
  const now = Date.now()

  // Clean up expired entries
  for (const [key, value] of rateLimit.entries()) {
    if (now > value.resetTime) {
      rateLimit.delete(key)
    }
  }

  // Get or create rate limit entry
  let rateLimitEntry = rateLimit.get(ip)
  if (!rateLimitEntry || now > rateLimitEntry.resetTime) {
    rateLimitEntry = {
      count: 0,
      resetTime: now + RATE_LIMIT.window
    }
  }

  // Check rate limit
  if (rateLimitEntry.count >= RATE_LIMIT.max) {
    logger.warn(`Rate limit exceeded for IP: ${ip}`)
    return new NextResponse(JSON.stringify({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED'
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': RATE_LIMIT.max.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitEntry.resetTime.toString()
      }
    })
  }

  // Update rate limit counter
  rateLimitEntry.count++
  rateLimit.set(ip, rateLimitEntry)

  // Add rate limit headers
  const response = NextResponse.next()
  response.headers.set('X-RateLimit-Limit', RATE_LIMIT.max.toString())
  response.headers.set('X-RateLimit-Remaining', (RATE_LIMIT.max - rateLimitEntry.count).toString())
  response.headers.set('X-RateLimit-Reset', rateLimitEntry.resetTime.toString())

  return response
}

export const config = {
  matcher: '/api/:path*'
} 