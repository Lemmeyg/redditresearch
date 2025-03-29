export interface Subreddit {
  id: string;
  name: string;
  display_name: string;
  description: string;
  subscribers: number;
  created_utc: number;
  updated_at: Date;
}

export interface Post {
  id: string;
  subreddit_id: string;
  title: string;
  author: string;
  selftext: string;
  score: number;
  upvote_ratio: number;
  num_comments: number;
  created_utc: number;
  url: string;
  permalink: string;
  is_self: boolean;
  is_nsfw: boolean;
  updated_at: Date;
}

export interface Comment {
  id: string;
  post_id: string;
  author: string;
  body: string;
  score: number;
  created_utc: number;
  updated_at: Date;
}

export interface AnalyticsResult {
  id: string;
  subreddit_id: string;
  metric_type: 'user_growth' | 'comment_growth' | 'engagement_rate';
  value: number;
  period_start: Date;
  period_end: Date;
  created_at: Date;
}

export interface UserSearchHistory {
  id: string;
  user_id: string;
  query: string;
  timestamp: Date;
  result_count: number;
}

export interface ErrorLog {
  id: string;
  severity: 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';
  source: string;
  message: string;
  stack_trace?: string;
  user_id?: string;
  created_at: Date;
} 