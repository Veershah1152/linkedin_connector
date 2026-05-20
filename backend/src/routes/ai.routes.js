const express = require('express');
const { z } = require('zod');
const multer = require('multer');
const aiService = require('../services/ai.service');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');

const router = express.Router();

// Multer config for image/PDF uploads (10MB max, images + PDF)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'), false);
    }
  },
});

// Validation schema
const generateSchema = z.object({
  prompt: z.string().min(5, 'Prompt must be at least 5 characters').max(1000),
  tone: z.enum(['professional', 'casual', 'inspirational', 'educational', 'humorous']).optional(),
  length: z.enum(['short', 'medium', 'long']).optional(),
  industry: z.string().max(100).optional(),
  includeHashtags: z.boolean().optional(),
  includeEmojis: z.boolean().optional(),
});

// All AI routes require authentication
router.use(authenticate);

/**
 * POST /api/ai/generate
 * Generate a LinkedIn post using Grok AI
 */
router.post('/generate', validate(generateSchema), async (req, res, next) => {
  try {
    const result = await aiService.generatePost(req.user.userId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/analyze-image
 * Analyze an image and generate a LinkedIn post using Grok AI
 */
router.post('/analyze-image', upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }
    
    // Parse options from multipart form data
    const options = {
      tone: req.body.tone || 'professional',
      length: req.body.length || 'medium',
      includeHashtags: req.body.includeHashtags !== 'false',
      includeEmojis: req.body.includeEmojis !== 'false',
      additionalPrompt: req.body.additionalPrompt || '',
    };

    const result = await aiService.analyzeImage(req.user.userId, req.file, options);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/history
 * Get AI generation history
 */
router.get('/history', async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await aiService.getGenerationHistory(
      req.user.userId,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
