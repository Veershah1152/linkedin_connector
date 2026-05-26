const express = require('express');
const { z } = require('zod');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { supabaseAdmin } = require('../config/supabase');
const linkedinImportService = require('../services/linkedin-import.service');
const resumeService = require('../services/resume.service');
const atsService = require('../services/ats.service');
const certificationService = require('../services/certification.service');
const profileParserService = require('../services/profile-parser.service');
const aiCoreService = require('../services/ai-core.service');

const router = express.Router();

// Multer config for certification uploads (10MB max, images + PDF)
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

// Zod schemas for input validation
const createResumeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  targetRole: z.string().max(255).optional(),
  templateId: z.string().max(50).optional(),
  contactInfo: z.record(z.any()).optional(),
  summary: z.string().optional(),
  skills: z.array(z.string()).optional(),
  projects: z.array(z.record(z.any())).optional(),
  workExperience: z.array(z.record(z.any())).optional(),
  education: z.array(z.record(z.any())).optional(),
  certifications: z.array(z.record(z.any())).optional(),
  achievements: z.array(z.string()).optional(),
  socialLinks: z.record(z.any()).optional(),
});

const updateResumeSchema = createResumeSchema.partial();

const optimizeSchema = z.object({
  targetRole: z.string().min(2, 'Target role is required').max(255),
});

const atsSchema = z.object({
  targetRole: z.string().min(2, 'Target role is required').max(255),
});

const rollbackSchema = z.object({
  version: z.number().int().positive('Version must be a positive integer'),
});

const improveBulletSchema = z.object({
  bulletText: z.string().min(3, 'Bullet point must be at least 3 characters').max(1000),
  targetRole: z.string().min(2, 'Target role is required').max(255),
});

const rewriteTextSchema = z.object({
  text: z.string().min(3, 'Text must be at least 3 characters').max(3000),
  tone: z.string().max(100).optional(),
});

const improveSummarySchema = z.object({
  summaryText: z.string().min(5, 'Summary must be at least 5 characters').max(3000),
  targetRole: z.string().min(2, 'Target role is required').max(255),
});

// Require JWT authentication for all career automation endpoints
router.use(authenticate);

// ============================================
// LINKEDIN IMPORT
// ============================================

/**
 * GET /api/career/import
 * Fetch and import user's LinkedIn profile data
 */
router.get('/import', async (req, res, next) => {
  try {
    // 1. Fetch user's Access Token from DB
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('linkedin_access_token, linkedin_token_expires_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !user?.linkedin_access_token) {
      return res.status(400).json({
        success: false,
        error: 'LinkedIn account not connected. Please log in with LinkedIn.'
      });
    }

    // Check token expiry
    if (new Date(user.linkedin_token_expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'LinkedIn authorization expired. Please log in again.'
      });
    }

    // 2. Fetch profile details
    const profileData = await linkedinImportService.importLinkedInProfile(user.linkedin_access_token);
    
    res.json({
      success: true,
      data: profileData
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// RESUME CRUD & ACTIONS
// ============================================

/**
 * GET /api/career/resumes
 * Retrieve user's resume list
 */
router.get('/resumes', async (req, res, next) => {
  try {
    const resumes = await resumeService.getResumes(req.user.userId);
    res.json({ success: true, data: resumes });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/career/resumes
 * Create a new resume draft
 */
router.post('/resumes', validate(createResumeSchema), async (req, res, next) => {
  try {
    const resume = await resumeService.createResume(req.user.userId, req.body);
    res.status(201).json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
});

const parseUpload = upload.fields([
  { name: 'linkedinFile', maxCount: 1 },
  { name: 'cvFile', maxCount: 1 }
]);

/**
 * POST /api/career/resumes/parse-profile
 * Parse a user's LinkedIn profile PDF and/or previous CV PDF to generate/merge resumes
 */
router.post('/resumes/parse-profile', parseUpload, async (req, res, next) => {
  try {
    let linkedinText = '';
    let cvText = '';

    // 1. Extract LinkedIn text if file uploaded
    if (req.files && req.files['linkedinFile']) {
      linkedinText = await profileParserService.extractTextFromPDF(req.files['linkedinFile'][0].buffer);
    } else if (req.body.linkedinText) {
      // Fallback to pasted LinkedIn text
      linkedinText = req.body.linkedinText;
    }

    // 2. Extract CV text if file uploaded
    if (req.files && req.files['cvFile']) {
      cvText = await profileParserService.extractTextFromPDF(req.files['cvFile'][0].buffer);
    } else if (req.body.cvText) {
      // Fallback to pasted CV text
      cvText = req.body.cvText;
    }

    // If neither is present, return 400 Bad Request
    if (!linkedinText.trim() && !cvText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Please upload at least one LinkedIn PDF or Previous CV PDF, or paste text details.'
      });
    }

    let parsedData;

    // 3. Process according to what was uploaded
    if (linkedinText.trim() && cvText.trim()) {
      // Both present -> Synthesis Merge!
      parsedData = await profileParserService.mergeAndParseProfilesWithAI(linkedinText, cvText);
      parsedData.rawLinkedinData = {
        parsedAt: new Date().toISOString(),
        sourceType: 'unified_synthesis_merge',
        hasLinkedIn: true,
        hasCV: true
      };
    } else if (linkedinText.trim()) {
      // Only LinkedIn present -> Standard parser
      parsedData = await profileParserService.parseProfileWithAI(linkedinText);
      parsedData.rawLinkedinData = {
        parsedAt: new Date().toISOString(),
        sourceType: 'linkedin_only',
        hasLinkedIn: true,
        hasCV: false
      };
    } else {
      // Only CV present -> Parse CV as standard resume
      parsedData = await profileParserService.parseProfileWithAI(cvText);
      parsedData.rawLinkedinData = {
        parsedAt: new Date().toISOString(),
        sourceType: 'cv_only',
        hasLinkedIn: false,
        hasCV: true
      };
    }

    // 4. Save and create resume in DB
    const resume = await resumeService.createResume(req.user.userId, parsedData);

    res.status(201).json({
      success: true,
      message: 'Successfully synchronized profile sources and generated professional resume draft.',
      data: resume
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/career/resumes/:id
 * Get single resume details
 */
router.get('/resumes/:id', async (req, res, next) => {
  try {
    const resume = await resumeService.getResumeById(req.user.userId, req.params.id);
    res.json({ success: true, data: resume });
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/career/resumes/:id
 * Update resume details (increments version, triggers snapshot)
 */
router.patch('/resumes/:id', validate(updateResumeSchema), async (req, res, next) => {
  try {
    const updated = await resumeService.updateResume(req.user.userId, req.params.id, req.body);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/career/resumes/:id
 * Delete resume
 */
router.delete('/resumes/:id', async (req, res, next) => {
  try {
    const result = await resumeService.deleteResume(req.user.userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ============================================
// VERSION CONTROL
// ============================================

/**
 * GET /api/career/resumes/:id/versions
 * List all saved versions of a resume
 */
router.get('/resumes/:id/versions', async (req, res, next) => {
  try {
    const versions = await resumeService.getResumeVersions(req.user.userId, req.params.id);
    res.json({ success: true, data: versions });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/career/resumes/:id/rollback
 * Roll back resume state to a previous version number
 */
router.post('/resumes/:id/rollback', validate(rollbackSchema), async (req, res, next) => {
  try {
    const rolledBack = await resumeService.rollbackToVersion(
      req.user.userId,
      req.params.id,
      req.body.version
    );
    res.json({ success: true, data: rolledBack });
  } catch (error) {
    next(error);
  }
});

// ============================================
// AI OPTIMIZATION & ATS ANALYSIS
// ============================================

/**
 * POST /api/career/resumes/:id/optimize
 * Optimize resume details for a target job role using Grok AI
 */
router.post('/resumes/:id/optimize', validate(optimizeSchema), async (req, res, next) => {
  try {
    const result = await resumeService.optimizeResume(
      req.user.userId,
      req.params.id,
      req.body.targetRole
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/career/resumes/:id/ats
 * Perform ATS Analysis of a resume against a target role
 */
router.post('/resumes/:id/ats', validate(atsSchema), async (req, res, next) => {
  try {
    const result = await atsService.analyzeATS(
      req.user.userId,
      req.params.id,
      req.body.targetRole
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/career/resumes/:id/ats/history
 * List ATS analysis history for a resume
 */
router.get('/resumes/:id/ats/history', async (req, res, next) => {
  try {
    const reports = await atsService.getATSAnalyses(req.user.userId, req.params.id);
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/career/resumes/:id/chat
 * Chat with AI to make changes to resume via natural language
 */
router.post('/resumes/:id/chat', async (req, res, next) => {
  try {
    const { message, chatHistory = [] } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message is required.' });
    }
    const result = await atsService.chatWithAI(
      req.user.userId,
      req.params.id,
      message.trim(),
      chatHistory
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/career/resumes/:id/ats-optimize
 * Optimize resume to achieve a specific ATS score target
 */
router.post('/resumes/:id/ats-optimize', async (req, res, next) => {
  try {
    const { targetRole, targetScore } = req.body;
    if (!targetRole) return res.status(400).json({ success: false, error: 'targetRole is required.' });
    const score = parseInt(targetScore);
    if (isNaN(score) || score < 1 || score > 100) {
      return res.status(400).json({ success: false, error: 'targetScore must be 1–100.' });
    }
    const result = await atsService.atsTargetOptimize(
      req.user.userId,
      req.params.id,
      targetRole,
      score
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/career/ai/improve-bullet
 * AI Bullet optimization
 */
router.post('/ai/improve-bullet', validate(improveBulletSchema), async (req, res, next) => {
  try {
    const { bulletText, targetRole } = req.body;
    const optimized = await aiCoreService.improveBulletPoint(bulletText, targetRole);
    res.json({ success: true, data: { bullet: optimized } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/career/ai/rewrite
 * General AI Professional rewriting
 */
router.post('/ai/rewrite', validate(rewriteTextSchema), async (req, res, next) => {
  try {
    const { text, tone } = req.body;
    const optimized = await aiCoreService.rewriteProfessionally(text, tone);
    res.json({ success: true, data: { rewrittenText: optimized } });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/career/ai/improve-summary
 * AI Resume summary optimization
 */
router.post('/ai/improve-summary', validate(improveSummarySchema), async (req, res, next) => {
  try {
    const { summaryText, targetRole } = req.body;
    const optimized = await aiCoreService.improveSummary(summaryText, targetRole);
    res.json({ success: true, data: { summary: optimized } });
  } catch (error) {
    next(error);
  }
});

// ============================================
// CERTIFICATIONS & LINKEDIN PUBLISHING
// ============================================

/**
 * GET /api/career/certifications
 * List all uploaded certifications
 */
router.get('/certifications', async (req, res, next) => {
  try {
    const certs = await certificationService.getCertifications(req.user.userId);
    res.json({ success: true, data: certs });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/career/certifications
 * Upload certification file and record metadata details
 */
router.post('/certifications', upload.single('file'), async (req, res, next) => {
  try {
    const details = {
      title: req.body.title,
      issuingOrganization: req.body.issuingOrganization,
      issueDate: req.body.issueDate,
      credentialId: req.body.credentialId,
      credentialUrl: req.body.credentialUrl,
    };

    if (!details.title || !details.issuingOrganization) {
      return res.status(400).json({
        success: false,
        error: 'Title and Issuing Organization are required.'
      });
    }

    const result = await certificationService.uploadCertification(
      req.user.userId,
      req.file,
      details
    );

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/career/certifications/:id/publish
 * Trigger LinkedIn certification publishing workflow or URL link generator
 */
router.post('/certifications/:id/publish', async (req, res, next) => {
  try {
    const result = await certificationService.publishCertificationToLinkedIn(
      req.user.userId,
      req.params.id
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/career/certifications/:id
 * Delete a certification from user's vault
 */
router.delete('/certifications/:id', async (req, res, next) => {
  try {
    const result = await certificationService.deleteCertification(
      req.user.userId,
      req.params.id
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
