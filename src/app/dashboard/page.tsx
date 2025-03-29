'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import DashboardLayout from '@/components/layout/dashboard-layout';
import { NormalizedRedditPost } from '@/lib/reddit/types';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, TrendingUp, Clock, Star, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Stats component with loading state
function StatsCard({ 
  title, 
  value, 
  description, 
  isLoading 
}: { 
  title: string; 
  value: string; 
  description: string;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h2 className="text-3xl font-bold">{value}</h2>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

// Feed component
function RedditFeed({ feedType }: { feedType: 'hot' | 'rising' | 'new' | 'top' }) {
  const [posts, setPosts] = useState<NormalizedRedditPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subreddit, setSubreddit] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const postsPerPage = 10;

  const fetchPosts = async (resetPosts = false) => {
    try {
      setIsLoading(true);
      const currentPage = resetPosts ? 1 : page;
      const skip = (currentPage - 1) * postsPerPage;
      
      const queryParams = new URLSearchParams({
        sort: feedType,
        limit: String(postsPerPage),
        skip: String(skip),
        ...(subreddit && { subreddit }),
      });

      const response = await fetch(`/api/reddit/posts?${queryParams}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch posts');
      }
      
      const newPosts = data.data || [];
      setPosts(prevPosts => resetPosts ? newPosts : [...prevPosts, ...newPosts]);
      setHasMore(newPosts.length === postsPerPage);
      if (resetPosts) {
        setPage(1);
      }
    } catch (error) {
      console.error(`Failed to fetch ${feedType} posts:`, error);
      setError(error instanceof Error ? error.message : 'Failed to load posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts(true);
  }, [feedType, subreddit]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchPosts();
  };

  const handleRefresh = () => {
    fetchPosts(true);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-red-500">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4 mb-4">
        <Input
          type="text"
          placeholder="Filter by subreddit..."
          value={subreddit}
          onChange={(e) => setSubreddit(e.target.value)}
          className="max-w-xs"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {posts.map((post) => (
        <Card key={post.id}>
          <CardContent className="p-6">
            <h3 className="font-semibold hover:text-blue-600 dark:hover:text-blue-400">
              <a href={post.url} target="_blank" rel="noopener noreferrer">
                {post.title}
              </a>
            </h3>
            {post.content && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {post.content}
              </p>
            )}
            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <span>r/{post.subreddit}</span>
              <span>{formatDistanceToNow(new Date(post.createdAt))} ago</span>
              <span>{post.score} points</span>
              <span>{post.commentCount} comments</span>
            </div>
          </CardContent>
        </Card>
      ))}

      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && hasMore && (
        <div className="flex justify-center mt-6">
          <Button onClick={handleLoadMore} variant="outline">
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}

function DashboardStats() {
  const [stats, setStats] = useState({
    totalPosts: '...',
    activeSubreddits: '...',
    totalComments: '...',
    engagementRate: '...',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/reddit/stats');
        const data = await response.json();
        
        if (response.ok) {
          setStats({
            totalPosts: data.totalPosts.toLocaleString(),
            activeSubreddits: data.activeSubreddits.toLocaleString(),
            totalComments: data.totalComments.toLocaleString(),
            engagementRate: `${data.engagementRate}%`,
          });
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Posts"
        value={stats.totalPosts}
        description="Posts tracked this week"
        isLoading={isLoading}
      />
      <StatsCard
        title="Active Subreddits"
        value={stats.activeSubreddits}
        description="Subreddits being monitored"
        isLoading={isLoading}
      />
      <StatsCard
        title="Total Comments"
        value={stats.totalComments}
        description="Comments analyzed"
        isLoading={isLoading}
      />
      <StatsCard
        title="Engagement Rate"
        value={stats.engagementRate}
        description="Average engagement per post"
        isLoading={isLoading}
      />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <DashboardStats />

        {/* Reddit Feeds */}
        <Card>
          <CardHeader>
            <CardTitle>Reddit Feeds</CardTitle>
            <CardDescription>
              Monitor different Reddit feeds in real-time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="hot" className="space-y-4">
              <TabsList>
                <TabsTrigger value="hot">
                  <Flame className="h-4 w-4 mr-2" />
                  Hot
                </TabsTrigger>
                <TabsTrigger value="rising">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Rising
                </TabsTrigger>
                <TabsTrigger value="new">
                  <Clock className="h-4 w-4 mr-2" />
                  New
                </TabsTrigger>
                <TabsTrigger value="top">
                  <Star className="h-4 w-4 mr-2" />
                  Top
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hot">
                <RedditFeed feedType="hot" />
              </TabsContent>
              <TabsContent value="rising">
                <RedditFeed feedType="rising" />
              </TabsContent>
              <TabsContent value="new">
                <RedditFeed feedType="new" />
              </TabsContent>
              <TabsContent value="top">
                <RedditFeed feedType="top" />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 