const express = require('express');
const multer = require('multer');
const { z } = require('zod');
const postService = require('../services/post.service');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Multer config for media uploads (10MB max, images and PDFs)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'), false);
    }
  },
});

// Validation schemas
const createPostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(3000),
  caption: z.string().max(500).optional(),
  hashtags: z.array(z.string()).max(30).optional(),
  status: z.enum(['draft', 'scheduled']).optional(),
  aiGenerated: z.boolean().optional(),
  aiPrompt: z.string().optional(),
  scheduledAt: z.string().datetime().optional().nullable(),
});

const updatePostSchema = z.object({
  content: z.string().min(1).max(3000).optional(),
  caption: z.string().max(500).optional(),
  hashtags: z.array(z.string()).max(30).optional(),
  status: z.enum(['draft', 'scheduled', 'published', 'failed']).optional(),
  scheduledAt: z.union([z.string().datetime(), z.null()]).optional(),
  aiGenerated: z.boolean().optional(),
  aiPrompt: z.string().optional(),
});

// All post routes require authentication
router.use(authenticate);

/**
 * POST /api/posts
 * Create a new post
 */
router.post('/', validate(createPostSchema), async (req, res, next) => {
  try {
    const post = await postService.createPost(req.user.userId, req.body);
    res.status(201).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/posts
 * Get all posts for the authenticated user
 */
router.get('/', async (req, res, next) => {
  try {
    const { status, page, limit } = req.query;
    const result = await postService.getUserPosts(req.user.userId, {
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/posts/:id
 * Get a single post
 */
router.get('/:id', async (req, res, next) => {
  try {
    const post = await postService.getPostById(req.params.id, req.user.userId);
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/posts/:id
 * Update a post
 */
router.patch('/:id', validate(updatePostSchema), async (req, res, next) => {
  try {
    const post = await postService.updatePost(req.params.id, req.user.userId, req.body);
    res.json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/posts/:id
 * Delete a post
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await postService.deletePost(req.params.id, req.user.userId);
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/posts/:id/images
 * Upload an image for a post
 */
router.post('/:id/images', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    const image = await postService.uploadPostImage(req.params.id, req.user.userId, req.file);
    res.status(201).json({ success: true, data: image });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/posts/:id/publish
 * Publish a post to LinkedIn
 */
router.post('/:id/publish', async (req, res, next) => {
  try {
    const result = await postService.publishToLinkedIn(req.params.id, req.user.userId);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
