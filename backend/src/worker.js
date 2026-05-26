const { Hono } = require('hono');
const { cors } = require('hono/cors');
const { getCookie, setCookie, deleteCookie } = require('hono/cookie');
const jwt = require('jsonwebtoken');

const { initWorkerEnv, supabaseAdmin } = require('./config/supabase');
const config = require('./config/env');

const authService = require('./services/auth.service');
const postService = require('./services/post.service');
const aiService = require('./services/ai.service');
const analyticsService = require('./services/analytics.service');
const resumeService = require('./services/resume.service');
const certificationService = require('./services/certification.service');
const profileParserService = require('./services/profile-parser.service');
const aiCoreService = require('./services/ai-core.service');
const atsService = require('./services/ats.service');
const { runScheduledTasks } = require('./services/cron.service');

const app = new Hono();

// Global Middleware
app.use('*', async (c, next) => {
  // Initialize worker env for Supabase client proxy and dynamic configs
  initWorkerEnv(c.env);
  await next();
});

app.use('*', cors({
  origin: (origin, c) => {
    const dynamicConfig = config.getConfig(c.env);
    const clientUrl = dynamicConfig.clientUrl || 'http://localhost:3000';
    if (!origin) return clientUrl;
    
    // Check if origin is a local network IP address (e.g., http://192.168.1.15:3000)
    const isLocalIp = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+)(:\d+)?$/.test(origin);
    
    if (origin === clientUrl || 
        origin === 'http://localhost:3000' || 
        origin === 'https://linkedin-connector-frontend.pages.dev' ||
        origin.endsWith('.linkedin-connector-frontend.pages.dev') ||
        origin === 'https://linkmanager.dpdns.org' ||
        origin.endsWith('.dpdns.org') ||
        isLocalIp) {
      return origin;
    }
    return clientUrl;
  },
  credentials: true,
  allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Authentication Middleware
const authenticate = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const cookieToken = getCookie(c, 'accessToken');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : cookieToken;

  if (!token) {
    return c.json({ success: false, error: 'Authentication required. Please log in.' }, 401);
  }

  try {
    const decoded = jwt.verify(token, config.getConfig(c.env).jwt.secret);
    c.set('user', decoded);
    await next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return c.json({ success: false, error: 'Token expired. Please refresh your session.' }, 401);
    }
    return c.json({ success: false, error: 'Invalid authentication token.' }, 401);
  }
};

// Adapt Web File for Multer-based service compatibility
const adaptFileForService = async (fileObj) => {
  if (!fileObj || typeof fileObj === 'string' || !fileObj.name) return null;
  const arrayBuffer = await fileObj.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    originalname: fileObj.name,
    mimetype: fileObj.type,
    size: fileObj.size
  };
};

// --- AUTH ROUTER ---
app.get('/api/auth/linkedin', (c) => {
  const authUrl = authService.getLinkedInAuthUrl();
  return c.json({ success: true, data: { url: authUrl } });
});

app.get('/api/auth/linkedin/callback', async (c) => {
  const code = c.req.query('code');
  const oauthError = c.req.query('error');
  const dynamicConfig = config.getConfig(c.env);

  if (oauthError) {
    return c.redirect(`${dynamicConfig.clientUrl}/login?error=${encodeURIComponent(oauthError)}`);
  }
  if (!code) {
    return c.redirect(`${dynamicConfig.clientUrl}/login?error=no_code`);
  }

  try {
    const tokenData = await authService.exchangeCodeForToken(code);
    const profile = await authService.getLinkedInProfile(tokenData.access_token);
    const user = await authService.findOrCreateUser(profile, tokenData);
    const tokens = authService.generateTokens(user);

    setCookie(c, 'accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    setCookie(c, 'refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
    });

    return c.redirect(`${dynamicConfig.clientUrl}/dashboard?auth=success&accessToken=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`);
  } catch (error) {
    return c.redirect(`${dynamicConfig.clientUrl}/login?error=${encodeURIComponent(error.message)}`);
  }
});

app.post('/api/auth/refresh', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const refreshToken = getCookie(c, 'refreshToken') || body.refreshToken;
    const dynamicConfig = config.getConfig(c.env);

    if (!refreshToken) {
      return c.json({ success: false, error: 'Refresh token required' }, 401);
    }

    const { accessToken } = authService.refreshAccessToken(refreshToken);

    setCookie(c, 'accessToken', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return c.json({ success: true, data: { accessToken } });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 401);
  }
});

app.get('/api/auth/me', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, linkedin_id, email, full_name, profile_image_url, headline, plan, created_at')
      .eq('id', userContext.userId)
      .single();

    if (error || !user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({ success: true, data: user });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/auth/logout', (c) => {
  deleteCookie(c, 'accessToken', { path: '/', secure: true, sameSite: 'none' });
  deleteCookie(c, 'refreshToken', { path: '/', secure: true, sameSite: 'none' });
  return c.json({ success: true, message: 'Logged out successfully' });
});


// --- POSTS ROUTER ---
app.post('/api/posts', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const body = await c.req.json();
    const result = await postService.createPost(userContext.userId, body);
    return c.json({ success: true, data: result }, 201);
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/posts', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const page = parseInt(c.req.query('page')) || 1;
    const limit = parseInt(c.req.query('limit')) || 20;
    const status = c.req.query('status');
    const result = await postService.getUserPosts(userContext.userId, { page, limit, status });
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/posts/:id', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const result = await postService.getPostById(id, userContext.userId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 404);
  }
});

app.patch('/api/posts/:id', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await postService.updatePost(id, userContext.userId, body);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.delete('/api/posts/:id', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const result = await postService.deletePost(id, userContext.userId);
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/posts/:id/publish', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const result = await postService.publishToLinkedIn(id, userContext.userId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/posts/:id/images', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const formData = await c.req.formData();

    // Frontend sends multiple files under 'images' (plural)
    const imageFiles = formData.getAll('images');
    
    // keepImageIds is sent as a JSON string: JSON.stringify([...])
    const keepImageIdsRaw = formData.get('keepImageIds');
    let keepImageIds = [];
    try {
      keepImageIds = keepImageIdsRaw ? JSON.parse(keepImageIdsRaw) : [];
    } catch {
      keepImageIds = [];
    }
    
    const adaptedFiles = [];
    for (const f of imageFiles) {
      const adapted = await adaptFileForService(f);
      if (adapted) adaptedFiles.push(adapted);
    }
    
    const result = await postService.uploadPostImages(id, userContext.userId, adaptedFiles, keepImageIds);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});


// --- AI ROUTER ---
app.post('/api/ai/generate', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const body = await c.req.json();
    const result = await aiService.generatePost(userContext.userId, body, c.env);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/ai/analyze-image', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const formData = await c.req.formData();
    const file = formData.get('image');
    
    const adaptedFile = await adaptFileForService(file);
    if (!adaptedFile) {
      return c.json({ success: false, error: 'No image/PDF file provided' }, 400);
    }

    const options = {
      tone: formData.get('tone') || 'professional',
      length: formData.get('length') || 'medium',
      includeHashtags: formData.get('includeHashtags') !== 'false',
      includeEmojis: formData.get('includeEmojis') !== 'false',
      additionalPrompt: formData.get('additionalPrompt') || '',
    };

    const result = await aiService.analyzeImage(userContext.userId, adaptedFile, options, c.env);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/ai/history', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const page = parseInt(c.req.query('page')) || 1;
    const limit = parseInt(c.req.query('limit')) || 20;
    const result = await aiService.getGenerationHistory(userContext.userId, page, limit);
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});


// --- ANALYTICS ROUTER ---
app.get('/api/analytics/dashboard', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const result = await analyticsService.getDashboardStats(userContext.userId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/analytics/posts/:id', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const result = await analyticsService.getPostAnalytics(id, userContext.userId);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/analytics/trends', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const days = parseInt(c.req.query('days')) || 30;
    const result = await analyticsService.getEngagementTrends(userContext.userId, days);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});


// --- CAREER SUITE ROUTER ---
app.post('/api/career/resumes/parse-profile', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const formData = await c.req.formData();
    const linkedinFile = formData.get('linkedinFile');
    const cvFile = formData.get('cvFile');
    
    const adaptedLinkedin = await adaptFileForService(linkedinFile);
    const adaptedCv = await adaptFileForService(cvFile);

    let linkedinText = formData.get('linkedinText') || '';
    let cvText = formData.get('cvText') || '';

    if (adaptedLinkedin) {
      linkedinText = await profileParserService.extractTextFromPDF(adaptedLinkedin.buffer, c.env);
    }
    if (adaptedCv) {
      cvText = await profileParserService.extractTextFromPDF(adaptedCv.buffer, c.env);
    }

    if (!linkedinText.trim() && !cvText.trim()) {
      return c.json({
        success: false,
        error: 'Please upload at least one LinkedIn PDF or Previous CV PDF, or paste text details.'
      }, 400);
    }

    let parsedData;
    if (linkedinText.trim() && cvText.trim()) {
      parsedData = await profileParserService.mergeAndParseProfilesWithAI(linkedinText, cvText, c.env);
      parsedData.rawLinkedinData = {
        parsedAt: new Date().toISOString(),
        sourceType: 'unified_synthesis_merge',
        hasLinkedIn: true,
        hasCV: true
      };
    } else if (linkedinText.trim()) {
      parsedData = await profileParserService.parseProfileWithAI(linkedinText, c.env);
      parsedData.rawLinkedinData = {
        parsedAt: new Date().toISOString(),
        sourceType: 'linkedin_only',
        hasLinkedIn: true,
        hasCV: false
      };
    } else {
      parsedData = await profileParserService.parseProfileWithAI(cvText, c.env);
      parsedData.rawLinkedinData = {
        parsedAt: new Date().toISOString(),
        sourceType: 'cv_only',
        hasLinkedIn: false,
        hasCV: true
      };
    }

    const resume = await resumeService.createResume(userContext.userId, parsedData);
    return c.json({
      success: true,
      message: 'Successfully synchronized profile sources and generated professional resume draft.',
      data: resume
    }, 201);
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/career/resumes', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const resumes = await resumeService.getResumes(userContext.userId);
    return c.json({ success: true, data: resumes });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/career/resumes', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const body = await c.req.json();
    const resume = await resumeService.createResume(userContext.userId, body);
    return c.json({ success: true, data: resume }, 201);
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/career/resumes/:id', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const resume = await resumeService.getResumeById(userContext.userId, id);
    return c.json({ success: true, data: resume });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 404);
  }
});

app.patch('/api/career/resumes/:id', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const resume = await resumeService.updateResume(userContext.userId, id, body);
    return c.json({ success: true, data: resume });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.delete('/api/career/resumes/:id', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const result = await resumeService.deleteResume(userContext.userId, id);
    return c.json({ success: true, ...result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/career/resumes/:id/versions', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const versions = await resumeService.getResumeVersions(userContext.userId, id);
    return c.json({ success: true, data: versions });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/career/resumes/:id/rollback', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const rolledBack = await resumeService.rollbackToVersion(userContext.userId, id, body.version);
    return c.json({ success: true, data: rolledBack });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/career/resumes/:id/optimize', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const optimized = await resumeService.optimizeResume(userContext.userId, id, body.targetRole, c.env);
    return c.json({ success: true, data: optimized });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/career/resumes/:id/ats', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const analysis = await atsService.analyzeATS(userContext.userId, id, body.targetRole, c.env);
    return c.json({ success: true, data: analysis });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/career/resumes/:id/ats/history', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const history = await atsService.getATSAnalyses(userContext.userId, id);
    return c.json({ success: true, data: history });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.get('/api/career/certifications', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const certs = await certificationService.getCertifications(userContext.userId);
    return c.json({ success: true, data: certs });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/career/certifications', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const formData = await c.req.formData();
    const file = formData.get('file');
    
    const adaptedFile = await adaptFileForService(file);
    const details = {
      title: formData.get('title'),
      issuingOrganization: formData.get('issuingOrganization'),
      issueDate: formData.get('issueDate') || null,
      credentialId: formData.get('credentialId') || null,
      credentialUrl: formData.get('credentialUrl') || null,
    };

    const result = await certificationService.uploadCertification(
      userContext.userId,
      adaptedFile,
      details
    );
    return c.json({ success: true, data: result.certification, sharingUrl: result.sharingUrl }, 201);
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/career/certifications/:id/publish', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const result = await certificationService.publishCertificationToLinkedIn(userContext.userId, id);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.delete('/api/career/certifications/:id', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const result = await certificationService.deleteCertification(userContext.userId, id);
    return c.json(result);
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/career/resumes/:id/chat', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await atsService.chatWithAI(userContext.userId, id, body.message, body.chatHistory || [], c.env);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/career/resumes/:id/ats-optimize', authenticate, async (c) => {
  try {
    const userContext = c.get('user');
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = await atsService.atsTargetOptimize(userContext.userId, id, body.targetRole, body.targetScore || 85, c.env);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/career/ai/improve-bullet', authenticate, async (c) => {
  try {
    const body = await c.req.json();
    const optimized = await aiCoreService.improveBulletPoint(body.bulletText, body.targetRole, c.env);
    return c.json({ success: true, data: { bullet: optimized } });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/career/ai/rewrite', authenticate, async (c) => {
  try {
    const body = await c.req.json();
    const rewritten = await aiCoreService.rewriteProfessionally(body.text, body.tone || 'executive', c.env);
    return c.json({ success: true, data: { rewrittenText: rewritten } });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

app.post('/api/career/ai/improve-summary', authenticate, async (c) => {
  try {
    const body = await c.req.json();
    const optimized = await aiCoreService.improveSummary(body.summaryText, body.targetRole, c.env);
    return c.json({ success: true, data: { summary: optimized } });
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500);
  }
});

// Fallback health check
app.get('/api/health', (c) => {
  const dynamicConfig = config.getConfig(c.env);
  return c.json({
    success: true,
    data: {
      status: 'healthy',
      environment: dynamicConfig.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

app.all('*', (c) => c.json({ success: false, error: 'Endpoint not found' }, 404));

// Export Workers standard handlers
export default {
  fetch: app.fetch,
  async scheduled(event, env, ctx) {
    // Initialize the Supabase proxy client environment
    initWorkerEnv(env);
    // Run the cron job checks
    ctx.waitUntil(runScheduledTasks());
  }
};
