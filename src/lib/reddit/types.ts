// Reddit API Response Types
export interface RedditPost {
  id: string
  title: string
  selftext: string
  author: string
  subreddit: string
  score: number
  upvote_ratio: number
  created_utc: number
  num_comments: number
  permalink: string
  url: string
  is_self: boolean
  is_video: boolean
  stickied: boolean
}

export interface RedditComment {
  id: string
  body: string
  author: string
  score: number
  created_utc: number
  permalink: string
  depth: number
  parent_id: string
}

export interface RedditSubreddit {
  id: string
  display_name: string
  title: string
  description: string
  subscribers: number
  created_utc: number
  over18: boolean
  public_description: string
}

// Normalized Types (for database storage)
export interface NormalizedRedditPost {
  id: string
  title: string
  content: string
  author: string
  subreddit: string
  score: number
  upvoteRatio: number
  createdAt: Date
  commentCount: number
  url: string
  isOriginalContent: boolean
  isVideo: boolean
  isStickied: boolean
  metadata: Record<string, any>
}

export interface NormalizedRedditComment {
  id: string
  content: string
  author: string
  score: number
  createdAt: Date
  postId: string
  parentCommentId?: string
  depth: number
  metadata: Record<string, any>
}

export interface NormalizedSubreddit {
  id: string
  name: string
  title: string
  description: string
  subscriberCount: number
  createdAt: Date
  isNsfw: boolean
  publicDescription: string
  metadata: Record<string, any>
}

// API Error Types
export interface RedditAPIError {
  message: string
  error: number
  code: string
} 