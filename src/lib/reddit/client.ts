import { api } from '../api'
import { APIError } from '../api/core'
import { Logger } from '../api/logger'
import {
  RedditPost,
  RedditComment,
  RedditSubreddit,
  NormalizedRedditPost,
  NormalizedRedditComment,
  NormalizedSubreddit,
} from './types'

const logger = Logger.getInstance()

export class RedditAPIClient {
  private readonly baseUrl = 'https://www.reddit.com'
  private readonly apiVersion = 'v1'

  constructor() {}

  private getApiUrl(endpoint: string): string {
    return `${this.baseUrl}/api/${this.apiVersion}/${endpoint}`
  }

  private normalizePost(post: any): NormalizedRedditPost {
    const data = post.data || post
    return {
      id: data.id,
      title: data.title,
      content: data.selftext,
      author: data.author,
      subreddit: data.subreddit,
      score: data.score,
      upvoteRatio: data.upvote_ratio,
      createdAt: new Date(data.created_utc * 1000),
      commentCount: data.num_comments,
      url: data.url,
      isOriginalContent: data.is_self,
      isVideo: data.is_video,
      isStickied: data.stickied,
      metadata: {
        permalink: data.permalink,
        // Add any additional metadata here
      }
    }
  }

  private normalizeComment(comment: any): NormalizedRedditComment {
    const data = comment.data || comment
    return {
      id: data.id,
      content: data.body,
      author: data.author,
      score: data.score,
      createdAt: new Date(data.created_utc * 1000),
      postId: data.link_id?.replace('t3_', ''),
      parentCommentId: data.parent_id?.replace('t1_', ''),
      depth: data.depth,
      metadata: {
        permalink: data.permalink,
        // Add any additional metadata here
      }
    }
  }

  private normalizeSubreddit(subreddit: any): NormalizedSubreddit {
    const data = subreddit.data || subreddit
    return {
      id: data.id,
      name: data.display_name,
      title: data.title,
      description: data.description,
      subscriberCount: data.subscribers,
      createdAt: new Date(data.created_utc * 1000),
      isNsfw: data.over18,
      publicDescription: data.public_description,
      metadata: {
        // Add any additional metadata here
      }
    }
  }

  public async getSubredditPosts(
    subreddit: string,
    sort: 'hot' | 'new' | 'top' = 'hot',
    limit: number = 25
  ): Promise<NormalizedRedditPost[]> {
    try {
      const response = await api.get<any>(`${this.baseUrl}/r/${subreddit}/${sort}.json?limit=${limit}`)
      
      if (!response.data?.data?.children) {
        throw new APIError('Invalid response from Reddit API', 500, 'REDDIT_API_ERROR')
      }

      return response.data.data.children.map((post: any) => this.normalizePost(post))
    } catch (error) {
      logger.error('Failed to fetch subreddit posts', { subreddit, error })
      throw error
    }
  }

  public async getPost(postId: string): Promise<NormalizedRedditPost> {
    try {
      const response = await api.get<any>(`${this.baseUrl}/comments/${postId}.json`)
      
      if (!response.data?.[0]?.data?.children?.[0]) {
        throw new APIError('Post not found', 404, 'POST_NOT_FOUND')
      }

      return this.normalizePost(response.data[0].data.children[0])
    } catch (error) {
      logger.error('Failed to fetch post', { postId, error })
      throw error
    }
  }

  public async getPostComments(
    postId: string,
    sort: 'confidence' | 'top' | 'new' | 'controversial' = 'confidence',
    limit: number = 100
  ): Promise<NormalizedRedditComment[]> {
    try {
      const response = await api.get<any>(
        `${this.baseUrl}/comments/${postId}.json?sort=${sort}&limit=${limit}`
      )
      
      if (!response.data?.[1]?.data?.children) {
        throw new APIError('Comments not found', 404, 'COMMENTS_NOT_FOUND')
      }

      return response.data[1].data.children
        .filter((comment: any) => comment.kind === 't1')
        .map((comment: any) => this.normalizeComment(comment))
    } catch (error) {
      logger.error('Failed to fetch post comments', { postId, error })
      throw error
    }
  }

  public async searchSubreddits(query: string): Promise<NormalizedSubreddit[]> {
    try {
      const response = await api.get<any>(
        `${this.baseUrl}/subreddits/search.json?q=${encodeURIComponent(query)}&limit=25`
      )
      
      if (!response.data?.data?.children) {
        throw new APIError('Invalid response from Reddit API', 500, 'REDDIT_API_ERROR')
      }

      return response.data.data.children.map((subreddit: any) => this.normalizeSubreddit(subreddit))
    } catch (error) {
      logger.error('Failed to search subreddits', { query, error })
      throw error
    }
  }
} 