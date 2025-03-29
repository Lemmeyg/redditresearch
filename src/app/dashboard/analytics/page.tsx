'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { NormalizedRedditPost } from '@/lib/reddit/types'

interface PostStats {
  totalPosts: number
  averageScore: number
  averageComments: number
  averageUpvoteRatio: number
  topSubreddits: { name: string; count: number }[]
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
        {title}
      </dt>
      <dd className="mt-1 text-3xl font-semibold text-gray-900 dark:text-white">
        {value}
      </dd>
    </div>
  )
}

function calculateStats(posts: NormalizedRedditPost[]): PostStats {
  const stats: PostStats = {
    totalPosts: posts.length,
    averageScore: 0,
    averageComments: 0,
    averageUpvoteRatio: 0,
    topSubreddits: []
  }

  if (posts.length === 0) return stats

  // Calculate averages
  const totals = posts.reduce(
    (acc, post) => ({
      score: acc.score + post.score,
      comments: acc.comments + post.commentCount,
      upvoteRatio: acc.upvoteRatio + post.upvoteRatio
    }),
    { score: 0, comments: 0, upvoteRatio: 0 }
  )

  stats.averageScore = Math.round(totals.score / posts.length)
  stats.averageComments = Math.round(totals.comments / posts.length)
  stats.averageUpvoteRatio = Number(
    (totals.upvoteRatio / posts.length).toFixed(2)
  )

  // Calculate top subreddits
  const subredditCounts = posts.reduce((acc, post) => {
    acc[post.subreddit] = (acc[post.subreddit] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  stats.topSubreddits = Object.entries(subredditCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return stats
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<PostStats>({
    totalPosts: 0,
    averageScore: 0,
    averageComments: 0,
    averageUpvoteRatio: 0,
    topSubreddits: []
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/reddit/posts')
        const data = await response.json()
        const calculatedStats = calculateStats(data.data || [])
        setStats(calculatedStats)
      } catch (error) {
        console.error('Failed to fetch analytics data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"
              />
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Posts" value={stats.totalPosts} />
          <StatCard title="Average Score" value={stats.averageScore} />
          <StatCard title="Average Comments" value={stats.averageComments} />
          <StatCard
            title="Average Upvote Ratio"
            value={`${(stats.averageUpvoteRatio * 100).toFixed(1)}%`}
          />
        </div>

        {/* Top Subreddits */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Top Subreddits
          </h3>
          <div className="space-y-4">
            {stats.topSubreddits.map((subreddit) => (
              <div
                key={subreddit.name}
                className="flex items-center justify-between"
              >
                <span className="text-gray-600 dark:text-gray-400">
                  r/{subreddit.name}
                </span>
                <span className="text-gray-900 dark:text-white font-medium">
                  {subreddit.count} posts
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
} 