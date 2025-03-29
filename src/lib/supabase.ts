import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Database utility functions
export const db = {
  // Subreddit operations
  async getSubreddit(id: string) {
    const { data, error } = await supabase
      .from('subreddits')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Post operations
  async getPost(id: string) {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  // Comment operations
  async getComments(postId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('post_id', postId);
    
    if (error) throw error;
    return data;
  },

  // Analytics operations
  async getAnalytics(subredditId: string, startDate: Date, endDate: Date) {
    const { data, error } = await supabase
      .from('analytics_results')
      .select('*')
      .eq('subreddit_id', subredditId)
      .gte('period_start', startDate.toISOString())
      .lte('period_end', endDate.toISOString());
    
    if (error) throw error;
    return data;
  },

  // Search history operations
  async getUserSearchHistory(userId: string) {
    const { data, error } = await supabase
      .from('user_search_history')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  // Error logging
  async logError(error: Omit<ErrorLog, 'id' | 'created_at'>) {
    const { data, error: dbError } = await supabase
      .from('error_logs')
      .insert([error])
      .select()
      .single();
    
    if (dbError) throw dbError;
    return data;
  }
}; 