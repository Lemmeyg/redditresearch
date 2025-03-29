import { NextRequest, NextResponse } from 'next/server'
import { RedditService } from '@/lib/reddit/service'
import { Logger } from '@/lib/api/logger'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getRedditClient } from '@/lib/reddit/client'
import { z } from 'zod'

const logger = Logger.getInstance()
const redditService = new RedditService()

const querySchema = z.object({
  sort: z.enum(['hot', 'new', 'top', 'rising']).default('hot'),
  limit: z.coerce.number().min(1).max(100).default(10),
  skip: z.coerce.number().min(0).default(0),
  subreddit: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const validatedParams = querySchema.parse({
      sort: searchParams.get('sort'),
      limit: searchParams.get('limit'),
      skip: searchParams.get('skip'),
      subreddit: searchParams.get('subreddit'),
    })

    const reddit = await getRedditClient()
    
    let posts
    if (validatedParams.subreddit) {
      // If subreddit is specified, fetch from that subreddit
      posts = await reddit.getSubredditPosts(
        validatedParams.subreddit,
        validatedParams.sort,
        validatedParams.limit,
        validatedParams.skip
      )
    } else {
      // Otherwise fetch from r/all
      posts = await reddit.getPosts(
        validatedParams.sort,
        validatedParams.limit,
        validatedParams.skip
      )
    }

    return NextResponse.json({
      data: posts,
      metadata: {
        limit: validatedParams.limit,
        skip: validatedParams.skip,
        sort: validatedParams.sort,
        subreddit: validatedParams.subreddit,
      }
    })
  } catch (error) {
    console.error('Failed to fetch Reddit posts:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch Reddit posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get session and require authentication for POST
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { postId, commentSort, commentLimit } = body

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      )
    }

    // Log post request
    logger.info('Reddit post fetch request', {
      user: session.user.email,
      postId,
      commentSort,
      commentLimit
    })

    const data = await redditService.fetchAndStorePostWithComments(
      postId,
      commentSort,
      commentLimit
    )

    return NextResponse.json({ data })
  } catch (error) {
    logger.error('Error in Reddit posts API route', { error })
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch Reddit post and comments',
        code: error instanceof Error ? error.name : 'UNKNOWN_ERROR'
      },
      { status: 500 }
    )
  }
} 