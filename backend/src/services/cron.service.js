const { supabaseAdmin } = require('../config/supabase');
const postService = require('./post.service');

/**
 * Scheduled task that runs to process scheduled posts
 */
const runScheduledTasks = async () => {
  console.log('⏰ Checking for scheduled posts to publish...');
  try {
    const now = new Date().toISOString();
    
    // Fetch all scheduled posts that are due
    const { data: posts, error } = await supabaseAdmin
      .from('posts')
      .select('id, user_id, content')
      .eq('status', 'scheduled')
      .lte('scheduled_at', now);

    if (error) {
      console.error('Error fetching scheduled posts:', error);
      return;
    }

    if (posts && posts.length > 0) {
      console.log(`Found ${posts.length} posts due for publishing.`);
      
      for (const post of posts) {
        try {
          // Update status to publishing
          await supabaseAdmin
            .from('posts')
            .update({ status: 'publishing' })
            .eq('id', post.id);

          console.log(`Publishing post ${post.id}...`);
          await postService.publishToLinkedIn(post.id, post.user_id);
          console.log(`Successfully published scheduled post ${post.id}`);
        } catch (pubError) {
          console.error(`Failed to publish scheduled post ${post.id}:`, pubError.message);
          // Update status to failed
          await supabaseAdmin
            .from('posts')
            .update({ status: 'failed' })
            .eq('id', post.id);
        }
      }
    }
  } catch (err) {
    console.error('Unhandled error in scheduled posts cron:', err);
  }
};

module.exports = { runScheduledTasks };
