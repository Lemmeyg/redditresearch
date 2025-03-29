'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Search, Filter, SortDesc, Clock } from 'lucide-react'
import { NormalizedRedditPost } from '@/lib/reddit/types'
import { formatDistanceToNow } from 'date-fns'

interface SearchFilters {
  sortBy: 'hot' | 'new' | 'top'
  timeRange: 'hour' | 'day' | 'week' | 'month' | 'year' | 'all'
  limit: number
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [posts, setPosts] = useState<NormalizedRedditPost[]>([])
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<SearchFilters>({
    sortBy: 'hot',
    timeRange: 'day',
    limit: 25
  })
  const [showFilters, setShowFilters] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Please enter a subreddit name')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const queryParams = new URLSearchParams({
        subreddit: searchQuery,
        sort: filters.sortBy,
        t: filters.timeRange,
        limit: filters.limit.toString()
      })

      const response = await fetch(`/api/reddit/posts?${queryParams}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch posts')
      }

      setPosts(data.data || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Search Header */}
        <Card>
          <CardHeader>
            <CardTitle>Search Reddit</CardTitle>
            <CardDescription>
              Search for posts across any subreddit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search Input */}
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Enter a subreddit name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="w-24"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
              </div>

              {/* Filters */}
              {showFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort By</label>
                    <Select
                      value={filters.sortBy}
                      onValueChange={(value: 'hot' | 'new' | 'top') =>
                        setFilters({ ...filters, sortBy: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hot">Hot</SelectItem>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="top">Top</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Time Range</label>
                    <Select
                      value={filters.timeRange}
                      onValueChange={(value: SearchFilters['timeRange']) =>
                        setFilters({ ...filters, timeRange: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hour">Past Hour</SelectItem>
                        <SelectItem value="day">Past 24 Hours</SelectItem>
                        <SelectItem value="week">Past Week</SelectItem>
                        <SelectItem value="month">Past Month</SelectItem>
                        <SelectItem value="year">Past Year</SelectItem>
                        <SelectItem value="all">All Time</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Results</label>
                    <Select
                      value={filters.limit.toString()}
                      onValueChange={(value) =>
                        setFilters({ ...filters, limit: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 posts</SelectItem>
                        <SelectItem value="25">25 posts</SelectItem>
                        <SelectItem value="50">50 posts</SelectItem>
                        <SelectItem value="100">100 posts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="text-red-500 text-sm mt-2">{error}</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {posts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Search Results</span>
                <span className="text-sm font-normal text-gray-500">
                  {posts.length} posts found
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <h4 className="text-base font-medium text-gray-900 dark:text-white">
                          <a
                            href={post.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:underline"
                          >
                            {post.title}
                          </a>
                        </h4>
                        {post.content && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                            {post.content}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDistanceToNow(new Date(post.createdAt))} ago
                          </span>
                          <span>Posted by u/{post.author}</span>
                          <span>{post.score} points</span>
                          <span>{post.commentCount} comments</span>
                          <span>{(post.upvoteRatio * 100).toFixed(0)}% upvoted</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* No Results State */}
        {searchQuery && !isLoading && posts.length === 0 && (
          <Card>
            <CardContent className="text-center py-6">
              <p className="text-gray-500 dark:text-gray-400">
                No posts found for r/{searchQuery}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
} 