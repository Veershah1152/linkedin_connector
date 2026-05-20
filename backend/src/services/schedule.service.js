const Queue = require('bull');
const { config } = require('../config/env');
const postService = require('./post.service');
const { supabaseAdmin } = require('../config/supabase');

// Initialize Bull Queue with Redis URL
const publishQueue = new Queue('publish-posts', config.redis.url);

/**
 * Process scheduled posts
 */
publishQueue.process(async (job, done) => {
  try {
    const { postId, userId } = job.data;
    console.log(`Processing scheduled post ${postId} for user ${userId}`);

    // Call the service to publish
    const result = await postService.publishToLinkedIn(postId, userId);
    
    // Create analytics record to start tracking
    await supabaseAdmin
      .from('analytics')
      .insert({
        post_id: postId,
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        engagement_rate: 0,
      });

    console.log(`Successfully published post ${postId}`);
    done(null, result);
  } catch (error) {
    console.error(`Error processing scheduled post ${job.data.postId}:`, error.message);
    // Let Bull handle the retry logic
    done(new Error(error.message));
  }
});

/**
 * Add a post to the scheduling queue
 * @param {string} postId - ID of the post
 * @param {string} userId - ID of the user
 * @param {Date|string} scheduledTime - Time to publish
 */
const schedulePost = async (postId, userId, scheduledTime) => {
  const delay = new Date(scheduledTime).getTime() - Date.now();
  
  if (delay < 0) {
    throw new Error('Scheduled time must be in the future');
  }

  const job = await publishQueue.add(
    { postId, userId },
    { 
      delay,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 60000 // 1 minute
      }
    }
  );

  return job;
};

/**
 * Cancel a scheduled post
 * @param {string} jobId - ID of the job from Bull
 */
const cancelScheduledPost = async (jobId) => {
  const job = await publishQueue.getJob(jobId);
  if (job) {
    await job.remove();
    return true;
  }
  return false;
};

module.exports = {
  publishQueue,
  schedulePost,
  cancelScheduledPost,
};
