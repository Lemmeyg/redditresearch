import { NextResponse } from 'next/server';
import { getRedditClient } from '@/lib/reddit/client';

export async function GET() {
  try {
    const reddit = await getRedditClient();
    
    // In a real application, these would be calculated from your database
    // For now, we'll return mock data
    const stats = {
      totalPosts: 2743,
      activeSubreddits: 15,
      totalComments: 14234,
      engagementRate: 24,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to fetch Reddit stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Reddit stats' },
      { status: 500 }
    );
  }
} 