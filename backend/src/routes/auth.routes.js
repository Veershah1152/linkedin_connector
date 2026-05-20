const express = require('express');
const authService = require('../services/auth.service');
const { authenticate } = require('../middleware/auth');
const config = require('../config/env');

const router = express.Router();

/**
 * GET /api/auth/linkedin
 * Redirect to LinkedIn OAuth authorization page
 */
router.get('/linkedin', (req, res) => {
  const authUrl = authService.getLinkedInAuthUrl();
  res.json({ success: true, data: { url: authUrl } });
});

/**
 * GET /api/auth/linkedin/callback
 * Handle LinkedIn OAuth callback
 */
router.get('/linkedin/callback', async (req, res, next) => {
  try {
    const { code, error: oauthError } = req.query;

    if (oauthError) {
      return res.redirect(
        `${config.clientUrl}/login?error=${encodeURIComponent(oauthError)}`
      );
    }

    if (!code) {
      return res.redirect(`${config.clientUrl}/login?error=no_code`);
    }

    // Exchange code for token
    const tokenData = await authService.exchangeCodeForToken(code);

    // Get LinkedIn profile
    const profile = await authService.getLinkedInProfile(tokenData.access_token);

    // Find or create user
    const user = await authService.findOrCreateUser(profile, tokenData);

    // Generate JWT tokens
    const tokens = authService.generateTokens(user);

    // Set cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Redirect to frontend dashboard
    res.redirect(`${config.clientUrl}/dashboard?auth=success`);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token required',
      });
    }

    const { accessToken } = authService.refreshAccessToken(refreshToken);

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { accessToken } });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const { supabaseAdmin } = require('../config/supabase');
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, linkedin_id, email, full_name, profile_image_url, headline, plan, created_at')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Clear auth cookies
 */
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
