const { supabaseAdmin } = require('../config/supabase');
const { AppError } = require('../middleware/error');

/**
 * Get dashboard analytics summary for a user
 */
const getDashboardStats = async (userId) => {
  // Total posts count by status
  const { data: posts, error: postsError } = await supabaseAdmin
    .from('posts')
    .select('status')
    .eq('user_id', userId);

  if (postsError) throw new AppError('Failed to fetch analytics', 500);

  const stats = {
    totalPosts: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    drafts: posts.filter((p) => p.status === 'draft').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    failed: posts.filter((p) => p.status === 'failed').length,
  };

  // Aggregate engagement metrics
  const { data: analytics, error: analyticsError } = await supabaseAdmin
    .from('post_analytics')
    .select('views, likes, comments, shares, clicks')
    .in(
      'post_id',
      posts.filter((p) => p.status === 'published').map((p) => p.id) || ['none']
    );

  if (!analyticsError && analytics) {
    stats.totalViews = analytics.reduce((sum, a) => sum + (a.views || 0), 0);
    stats.totalLikes = analytics.reduce((sum, a) => sum + (a.likes || 0), 0);
    stats.totalComments = analytics.reduce((sum, a) => sum + (a.comments || 0), 0);
    stats.totalShares = analytics.reduce((sum, a) => sum + (a.shares || 0), 0);
    stats.totalClicks = analytics.reduce((sum, a) => sum + (a.clicks || 0), 0);
    stats.avgEngagementRate =
      analytics.length > 0
        ? (
            analytics.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) /
            analytics.length
          ).toFixed(2)
        : '0.00';
  }

  return stats;
};

/**
 * Get analytics for a specific post
 */
const getPostAnalytics = async (postId, userId) => {
  // Verify ownership
  const { data: post, error: postError } = await supabaseAdmin
    .from('posts')
    .select('id')
    .eq('id', postId)
    .eq('user_id', userId)
    .single();

  if (postError || !post) throw new AppError('Post not found', 404);

  const { data, error } = await supabaseAdmin
    .from('post_analytics')
    .select('*')
    .eq('post_id', postId)
    .order('fetched_at', { ascending: false });

  if (error) throw new AppError('Failed to fetch post analytics', 500);
  return data;
};

/**
 * Get engagement trends over time
 */
const getEngagementTrends = async (userId, days = 30) => {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('published_at, post_analytics(views, likes, comments, shares)')
    .eq('user_id', userId)
    .eq('status', 'published')
    .gte('published_at', since.toISOString())
    .order('published_at', { ascending: true });

  if (error) throw new AppError('Failed to fetch trends', 500);
  return data;
};

module.exports = { getDashboardStats, getPostAnalytics, getEngagementTrends };
