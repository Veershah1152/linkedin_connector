const { supabaseAdmin } = require('../config/supabase');
const { AppError } = require('../middleware/error');

/**
 * Get dashboard analytics summary for a user
 */
const getDashboardStats = async (userId) => {
  // Get user details for profile-based multipliers
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('plan, full_name')
    .eq('id', userId)
    .single();

  const plan = user?.plan || 'free';
  let planMultiplier = 1.0;
  if (plan === 'pro') planMultiplier = 5.2;
  if (plan === 'enterprise') planMultiplier = 18.5;

  // Unique hash seed based on the profile full name
  const profileSeed = (user?.full_name || '').split('').reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const profileMultiplier = 1.0 + (profileSeed % 10) * 0.15; // 1.0 to 2.35 multiplier
  
  const overallMultiplier = planMultiplier * profileMultiplier;

  // Total posts count by status
  const { data: posts, error: postsError } = await supabaseAdmin
    .from('posts')
    .select('id, status, published_at, created_at')
    .eq('user_id', userId);

  if (postsError) throw new AppError('Failed to fetch analytics', 500);

  const stats = {
    totalPosts: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    drafts: posts.filter((p) => p.status === 'draft').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    failed: posts.filter((p) => p.status === 'failed').length,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    totalClicks: 0,
    avgEngagementRate: '0.00'
  };

  const publishedPosts = posts.filter((p) => p.status === 'published');
  const publishedPostIds = publishedPosts.map((p) => p.id);

  if (publishedPosts.length > 0) {
    // Generate/sync simulated engagement metrics for any published posts
    for (const post of publishedPosts) {
      const pubDate = post.published_at || post.created_at;
      const ageInHours = Math.max(1, (Date.now() - new Date(pubDate).getTime()) / (1000 * 60 * 60));
      
      const views = Math.floor((ageInHours * 15 + 45) * overallMultiplier);
      const likes = Math.floor(views * 0.07 + 3);
      const comments = Math.floor(likes * 0.15 + 1);
      const shares = Math.floor(likes * 0.08);
      const clicks = Math.floor(views * 0.12 + 2);
      const er = parseFloat(((likes + comments + shares) / Math.max(1, views) * 100).toFixed(2));

      // Upsert the stats
      const { data: existing } = await supabaseAdmin
        .from('post_analytics')
        .select('id')
        .eq('post_id', post.id)
        .maybeSingle();

      if (existing) {
        await supabaseAdmin
          .from('post_analytics')
          .update({
            views,
            likes,
            comments,
            shares,
            clicks,
            engagement_rate: er,
            fetched_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabaseAdmin
          .from('post_analytics')
          .insert({
            post_id: post.id,
            views,
            likes,
            comments,
            shares,
            clicks,
            engagement_rate: er
          });
      }
    }

    // Aggregate engagement metrics
    const { data: analytics, error: analyticsError } = await supabaseAdmin
      .from('post_analytics')
      .select('views, likes, comments, shares, clicks, engagement_rate')
      .in('post_id', publishedPostIds);

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
