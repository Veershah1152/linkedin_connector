const { supabaseAdmin } = require('../config/supabase');
const { AppError } = require('../middleware/error');

/**
 * Create a new post (draft by default)
 */
const createPost = async (userId, postData) => {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .insert({
      user_id: userId,
      content: postData.content,
      caption: postData.caption || null,
      hashtags: postData.hashtags || [],
      status: postData.status || 'draft',
      ai_generated: postData.aiGenerated || false,
      ai_prompt: postData.aiPrompt || null,
      scheduled_at: postData.scheduledAt || null,
    })
    .select()
    .single();

  if (error) throw new AppError('Failed to create post', 500);
  return data;
};

/**
 * Get all posts for a user with optional filtering
 */
const getUserPosts = async (userId, filters = {}) => {
  const { status, page = 1, limit = 20 } = filters;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('posts')
    .select('*, post_images(*)', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) throw new AppError('Failed to fetch posts', 500);

  return {
    posts: data,
    total: count,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

/**
 * Get a single post by ID (with ownership check)
 */
const getPostById = async (postId, userId) => {
  const { data, error } = await supabaseAdmin
    .from('posts')
    .select('*, post_images(*)')
    .eq('id', postId)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new AppError('Post not found', 404);
  return data;
};

/**
 * Update a post
 */
const updatePost = async (postId, userId, updates) => {
  const mappedUpdates = {};
  if (updates.content !== undefined) mappedUpdates.content = updates.content;
  if (updates.caption !== undefined) mappedUpdates.caption = updates.caption;
  if (updates.hashtags !== undefined) mappedUpdates.hashtags = updates.hashtags;
  if (updates.status !== undefined) mappedUpdates.status = updates.status;
  if (updates.aiGenerated !== undefined) mappedUpdates.ai_generated = updates.aiGenerated;
  if (updates.aiPrompt !== undefined) mappedUpdates.ai_prompt = updates.aiPrompt;
  if (updates.scheduledAt !== undefined) mappedUpdates.scheduled_at = updates.scheduledAt;

  const { data, error } = await supabaseAdmin
    .from('posts')
    .update({
      ...mappedUpdates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', postId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new AppError('Failed to update post', 500);
  return data;
};

/**
 * Delete a post
 */
const deletePost = async (postId, userId) => {
  const { error } = await supabaseAdmin
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', userId);

  if (error) throw new AppError('Failed to delete post', 500);
  return { deleted: true };
};

/**
 * Upload multiple images for a post
 */
const uploadPostImages = async (postId, userId, files, keepImageIds = []) => {
  // Verify post ownership
  await getPostById(postId, userId);

  // Fetch all existing images/PDFs for this post
  const { data: existingImages } = await supabaseAdmin
    .from('post_images')
    .select('id, storage_path')
    .eq('post_id', postId);

  if (existingImages && existingImages.length > 0) {
    // Identify images to delete (those NOT in keepImageIds)
    const toDelete = existingImages.filter(img => !keepImageIds.includes(String(img.id)));
    const paths = toDelete.map(img => img.storage_path).filter(Boolean);
    
    if (paths.length > 0) {
      await supabaseAdmin.storage
        .from('post-images')
        .remove(paths);
    }
    
    const idsToDelete = toDelete.map(img => img.id);
    if (idsToDelete.length > 0) {
      await supabaseAdmin
        .from('post_images')
        .delete()
        .in('id', idsToDelete);
    }
  }

  const uploadedRecords = [];
  
  // Upload new files
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = `${userId}/${postId}/${Date.now()}-${i}-${file.originalname}`;
    const contentType = file.mimetype === 'application/pdf' ? 'image/png' : file.mimetype;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
      .from('post-images')
      .upload(fileName, file.buffer, {
        contentType: contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('[Supabase Upload Error]:', uploadError);
      throw new AppError('Failed to upload media file: ' + file.originalname, 500);
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('post-images')
      .getPublicUrl(fileName);

    // Save image record
    const { data: imageRecord, error: dbError } = await supabaseAdmin
      .from('post_images')
      .insert({
        post_id: postId,
        image_url: urlData.publicUrl,
        storage_path: fileName,
        alt_text: file.originalname,
        order: i,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Supabase DB Error]:', dbError);
      throw new AppError('Failed to save media record', 500);
    }
    uploadedRecords.push(imageRecord);
  }

  // Fetch and return the complete up-to-date post_images list ordered
  const { data: finalImages, error: finalError } = await supabaseAdmin
    .from('post_images')
    .select('*')
    .eq('post_id', postId)
    .order('order', { ascending: true });

  if (finalError) {
    console.error('[Supabase Fetch Error]:', finalError);
  }

  return finalImages || [];
};

/**
 * Publish a post to LinkedIn
 */
const publishToLinkedIn = async (postId, userId) => {
  const post = await getPostById(postId, userId);

  // Get user's LinkedIn access token
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('linkedin_id, linkedin_access_token, linkedin_token_expires_at')
    .eq('id', userId)
    .single();

  if (userError || !user) throw new AppError('User not found', 404);

  // Check token expiry
  if (new Date(user.linkedin_token_expires_at) < new Date()) {
    throw new AppError('LinkedIn token expired. Please reconnect your account.', 401);
  }

  let assetUrn = null;
  let isPdf = false;
  let title = '';
  let finalContent = post.content;
  let imagesToAttach = [];

  if (post.post_images && post.post_images.length > 0) {
    const media = post.post_images[0];
    title = media.alt_text || 'Document';
    isPdf = 
      title.toLowerCase().endsWith('.pdf') ||
      (media.image_url && media.image_url.toLowerCase().split('?')[0].endsWith('.pdf')) ||
      (media.storage_path && media.storage_path.toLowerCase().endsWith('.pdf'));

    try {
      if (isPdf) {
        // 1. Initialize Document Upload via rest/documents API
        console.log('Registering document upload via LinkedIn Documents API...');
        const initializeUrl = 'https://api.linkedin.com/rest/documents?action=initializeUpload';
        const initializeBody = {
          initializeUploadRequest: {
            owner: `urn:li:person:${user.linkedin_id}`
          }
        };

        const registerResponse = await fetch(initializeUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${user.linkedin_access_token}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
            'LinkedIn-Version': '202603'
          },
          body: JSON.stringify(initializeBody)
        });

        if (!registerResponse.ok) {
          throw new Error(`LinkedIn document register error: ${await registerResponse.text()}`);
        }

        const registerData = await registerResponse.json();
        const uploadUrl = registerData.value.uploadUrl;
        const uploadHeaders = {};
        assetUrn = registerData.value.document;

        // 2. Fetch file from Supabase and upload to LinkedIn
        console.log('Uploading PDF binary to LinkedIn...', uploadUrl);
        const fileRes = await fetch(media.image_url);
        if (!fileRes.ok) {
          throw new Error(`Failed to fetch media from Supabase URL: ${media.image_url}`);
        }
        const fileBuffer = await fileRes.arrayBuffer();

        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${user.linkedin_access_token}`,
            'Content-Type': 'application/pdf',
            ...uploadHeaders
          },
          body: fileBuffer
        });

        if (!uploadRes.ok) {
          throw new Error(`LinkedIn document upload failed: ${await uploadRes.text()}`);
        }
        console.log('Successfully uploaded PDF document natively:', assetUrn);
      } else {
        // Multiple Images!
        for (const img of post.post_images) {
          console.log(`Registering image upload for ${img.alt_text || 'Image'} via LinkedIn Assets API...`);
          const registerRequestBody = {
            registerUploadRequest: {
              recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
              owner: `urn:li:person:${user.linkedin_id}`,
              serviceRelationships: [
                {
                  relationshipType: 'OWNER',
                  identifier: 'urn:li:userGeneratedContent'
                }
              ]
            }
          };

          const registerResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${user.linkedin_access_token}`,
              'Content-Type': 'application/json',
              'X-Restli-Protocol-Version': '2.0.0',
            },
            body: JSON.stringify(registerRequestBody)
          });

          if (!registerResponse.ok) {
            console.error(`LinkedIn image register error: ${await registerResponse.text()}`);
            continue;
          }

          const registerData = await registerResponse.json();
          const uploadMechanism = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'];
          const uploadUrl = uploadMechanism.uploadUrl;
          const uploadHeaders = uploadMechanism.headers || {};
          const currentAssetUrn = registerData.value.asset;

          // Fetch file from Supabase and upload to LinkedIn
          console.log('Uploading image binary to LinkedIn...', img.image_url);
          const fileRes = await fetch(img.image_url);
          if (!fileRes.ok) {
            console.error(`Failed to fetch media from Supabase URL: ${img.image_url}`);
            continue;
          }
          const fileBuffer = await fileRes.arrayBuffer();

          const uploadRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${user.linkedin_access_token}`,
              ...uploadHeaders
            },
            body: fileBuffer
          });

          if (!uploadRes.ok) {
            const uploadResText = await uploadRes.text();
            console.warn('LinkedIn image PUT failed, attempting POST...', uploadResText);
            
            const uploadResPost = await fetch(uploadUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${user.linkedin_access_token}`,
                ...uploadHeaders
              },
              body: fileBuffer
            });
            
            if (!uploadResPost.ok) {
              console.error(`LinkedIn image POST failed: ${await uploadResPost.text()}`);
              continue;
            }
          }
          console.log('Successfully uploaded image natively:', currentAssetUrn);
          imagesToAttach.push({ id: currentAssetUrn, altText: img.alt_text || 'Image' });
        }
      }
    } catch (err) {
      console.error('Error during native LinkedIn media upload:', err);
      // Fallback for PDFs if native upload failed
      if (isPdf) {
        console.log('Falling back to PDF link append due to upload error');
        finalContent += `\n\n📄 View Document: ${media.image_url}`;
        assetUrn = null;
      }
    }
  }

  // Build LinkedIn post payload (using rest/posts)
  const postBody = {
    author: `urn:li:person:${user.linkedin_id}`,
    commentary: finalContent,
    visibility: 'PUBLIC',
    distribution: {
      feedDistribution: 'MAIN_FEED'
    },
    lifecycleState: 'PUBLISHED'
  };

  if (isPdf && assetUrn) {
    postBody.content = {
      media: {
        id: assetUrn
      }
    };
    postBody.content.media.title = title || 'Document';
  } else if (imagesToAttach.length === 1) {
    postBody.content = {
      media: {
        id: imagesToAttach[0].id
      }
    };
  } else if (imagesToAttach.length > 1) {
    postBody.content = {
      multiImage: {
        images: imagesToAttach
      }
    };
  }

  try {
    console.log('Publishing via rest/posts...');
    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${user.linkedin_access_token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
        'LinkedIn-Version': '202603'
      },
      body: JSON.stringify(postBody),
    });

    if (response.ok) {
      const createdPostId = response.headers.get('x-restli-id') || response.headers.get('x-linkedin-id') || 'published';
      console.log('Successfully published post via rest/posts. ID:', createdPostId);
      
      await updatePost(postId, userId, {
        status: 'published',
        linkedin_post_id: createdPostId,
        published_at: new Date().toISOString(),
      });
      return { linkedinPostId: createdPostId, status: 'published' };
    }

    const errorData = await response.text();
    console.error('LinkedIn publish error via rest/posts. Status:', response.status);
    console.error('Error body details:', errorData);
    console.error('Request payload sent:', JSON.stringify(postBody));
  } catch (publishErr) {
    console.error('Exception during rest/posts publish:', publishErr);
  }

  // Fallback to legacy ugcPosts API if rest/posts failed (or for safety)
  console.log('Attempting legacy ugcPosts fallback...');
  let mediaCategory = 'NONE';
  if (isPdf && assetUrn) {
    mediaCategory = 'NATIVE_DOCUMENT';
  } else if (imagesToAttach.length > 0) {
    mediaCategory = 'IMAGE';
  }

  const specificContent = {
    'com.linkedin.ugc.ShareContent': {
      shareCommentary: {
        text: finalContent,
      },
      shareMediaCategory: mediaCategory,
    },
  };

  if (isPdf && assetUrn) {
    specificContent['com.linkedin.ugc.ShareContent'].media = [
      {
        status: 'READY',
        description: { text: title },
        media: assetUrn,
        title: { text: title }
      }
    ];
  } else if (imagesToAttach.length > 0) {
    specificContent['com.linkedin.ugc.ShareContent'].media = imagesToAttach.map(img => ({
      status: 'READY',
      description: { text: img.altText },
      media: img.id,
      title: { text: img.altText }
    }));
  }

  const legacyPostBody = {
    author: `urn:li:person:${user.linkedin_id}`,
    lifecycleState: 'PUBLISHED',
    specificContent,
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const fallbackResponse = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${user.linkedin_access_token}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(legacyPostBody),
  });

  if (!fallbackResponse.ok) {
    const errorData = await fallbackResponse.text();
    console.error('LinkedIn publish error via ugcPosts fallback:', errorData);
    await updatePost(postId, userId, { status: 'failed' });
    throw new AppError('Failed to publish to LinkedIn', 500);
  }

  const result = await fallbackResponse.json();
  console.log('Successfully published via legacy ugcPosts. ID:', result.id);

  await updatePost(postId, userId, {
    status: 'published',
    linkedin_post_id: result.id,
    published_at: new Date().toISOString(),
  });

  return { linkedinPostId: result.id, status: 'published' };
};

module.exports = {
  createPost,
  getUserPosts,
  getPostById,
  updatePost,
  deletePost,
  uploadPostImages,
  publishToLinkedIn,
};
