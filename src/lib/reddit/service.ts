import { createClient } from '@supabase/supabase-js'
import { RedditAPIClient } from './client'
import { Logger } from '../api/logger'
import {
  NormalizedRedditPost,
  NormalizedRedditComment,
  NormalizedSubreddit
} from './types'

const logger = Logger.getInstance()
const redditClient = new RedditAPIClient()

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export class RedditService {
  // Post-related methods
  public async fetchAndStoreSubredditPosts(
    subreddit: string,
    sort: 'hot' | 'new' | 'top' = 'hot',
    limit: number = 25
  ): Promise<NormalizedRedditPost[]> {
    try {
      // Fetch posts from Reddit
      const posts = await redditClient.getSubredditPosts(subreddit, sort, limit)

      // Store posts in database
      const { data, error } = await supabase
        .from('reddit_posts')
        .upsert(
          posts.map(post => ({
            ...post,
            metadata: JSON.stringify(post.metadata)
          })),
          { onConflict: 'id' }
        )

      if (error) {
        logger.error('Failed to store posts in database', { error })
        throw error
      }

      return posts
    } catch (error) {
      logger.error('Failed to fetch and store subreddit posts', { subreddit, error })
      throw error
    }
  }

  public async fetchAndStorePostWithComments(
    postId: string,
    commentSort: 'confidence' | 'top' | 'new' | 'controversial' = 'confidence',
    commentLimit: number = 100
  ): Promise<{
    post: NormalizedRedditPost
    comments: NormalizedRedditComment[]
  }> {
    try {
      // Fetch post and comments concurrently
      const [post, comments] = await Promise.all([
        redditClient.getPost(postId),
        redditClient.getPostComments(postId, commentSort, commentLimit)
      ])

      // Store post and comments in database
      await Promise.all([
        supabase
          .from('reddit_posts')
          .upsert({
            ...post,
            metadata: JSON.stringify(post.metadata)
          }, { onConflict: 'id' }),
        supabase
          .from('reddit_comments')
          .upsert(
            comments.map(comment => ({
              ...comment,
              metadata: JSON.stringify(comment.metadata)
            })),
            { onConflict: 'id' }
          )
      ])

      return { post, comments }
    } catch (error) {
      logger.error('Failed to fetch and store post with comments', { postId, error })
      throw error
    }
  }

  // Subreddit-related methods
  public async searchAndStoreSubreddits(query: string): Promise<NormalizedSubreddit[]> {
    try {
      // Search for subreddits
      const subreddits = await redditClient.searchSubreddits(query)

      // Store subreddits in database
      const { error } = await supabase
        .from('subreddits')
        .upsert(
          subreddits.map(subreddit => ({
            ...subreddit,
            metadata: JSON.stringify(subreddit.metadata)
          })),
          { onConflict: 'id' }
        )

      if (error) {
        logger.error('Failed to store subreddits in database', { error })
        throw error
      }

      return subreddits
    } catch (error) {
      logger.error('Failed to search and store subreddits', { query, error })
      throw error
    }
  }

  // Database query methods
  public async getStoredPosts(
    subreddit?: string,
    limit: number = 25,
    offset: number = 0
  ): Promise<NormalizedRedditPost[]> {
    try {
      let query = supabase
        .from('reddit_posts')
        .select('*')
        .order('createdAt', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1)

      if (subreddit) {
        query = query.eq('subreddit', subreddit)
      }

      const { data, error } = await query

      if (error) throw error

      return data.map(post => ({
        ...post,
        metadata: JSON.parse(post.metadata)
      }))
    } catch (error) {
      logger.error('Failed to get stored posts', { subreddit, error })
      throw error
    }
  }

  public async getStoredComments(
    postId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<NormalizedRedditComment[]> {
    try {
      const { data, error } = await supabase
        .from('reddit_comments')
        .select('*')
        .eq('postId', postId)
        .order('score', { ascending: false })
        .limit(limit)
        .range(offset, offset + limit - 1)

      if (error) throw error

      return data.map(comment => ({
        ...comment,
        metadata: JSON.parse(comment.metadata)
      }))
    } catch (error) {
      logger.error('Failed to get stored comments', { postId, error })
      throw error
    }
  }
} 