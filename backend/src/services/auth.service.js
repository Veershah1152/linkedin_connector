const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { supabaseAdmin } = require('../config/supabase');
const { AppError } = require('../middleware/error');

/**
 * Generate LinkedIn OAuth authorization URL
 */
const getLinkedInAuthUrl = () => {
  // Added 'w_member_social' back so that the app can actually publish posts.
  // Note: The LinkedIn Developer App MUST have the "Share on LinkedIn" product enabled.
  const scopes = ['openid', 'profile', 'email', 'w_member_social'];
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: config.linkedin.clientId,
    redirect_uri: config.linkedin.redirectUri,
    scope: scopes.join(' '),
    state: generateState(),
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
};

/**
 * Exchange authorization code for LinkedIn access token
 */
const exchangeCodeForToken = async (code) => {
  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.linkedin.redirectUri,
      client_id: config.linkedin.clientId,
      client_secret: config.linkedin.clientSecret,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new AppError(`LinkedIn token exchange failed: ${error}`, 401);
  }

  return response.json();
};

/**
 * Fetch LinkedIn user profile using access token
 */
const getLinkedInProfile = async (accessToken) => {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new AppError('Failed to fetch LinkedIn profile', 401);
  }

  return response.json();
};

/**
 * Find or create user in Supabase from LinkedIn profile
 */
const findOrCreateUser = async (profile, linkedinTokenData) => {
  // Check if user already exists
  const { data: existingUser } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('linkedin_id', profile.sub)
    .single();

  const expiresAt = new Date(
    Date.now() + linkedinTokenData.expires_in * 1000
  ).toISOString();

  if (existingUser) {
    // Update tokens and profile info
    const { data: updated, error } = await supabaseAdmin
      .from('users')
      .update({
        email: profile.email,
        full_name: profile.name,
        profile_image_url: profile.picture || null,
        linkedin_access_token: linkedinTokenData.access_token,
        linkedin_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingUser.id)
      .select()
      .single();

    if (error) throw new AppError('Failed to update user', 500);
    return updated;
  }

  // Create new user
  const { data: newUser, error } = await supabaseAdmin
    .from('users')
    .insert({
      linkedin_id: profile.sub,
      email: profile.email,
      full_name: profile.name,
      profile_image_url: profile.picture || null,
      headline: null,
      linkedin_access_token: linkedinTokenData.access_token,
      linkedin_token_expires_at: expiresAt,
      plan: 'free',
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase insert error:", error);
    throw new AppError('Failed to create user', 500);
  }
  return newUser;
};

/**
 * Generate JWT tokens for authenticated user
 */
const generateTokens = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    plan: user.plan,
  };

  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });

  const refreshToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

/**
 * Refresh access token using refresh token
 */
const refreshAccessToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.secret);
    const payload = {
      userId: decoded.userId,
      email: decoded.email,
      plan: decoded.plan,
    };

    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    return { accessToken };
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
};

/**
 * Generate random state for OAuth CSRF protection
 */
const generateState = () => {
  return require('crypto').randomBytes(16).toString('hex');
};

module.exports = {
  getLinkedInAuthUrl,
  exchangeCodeForToken,
  getLinkedInProfile,
  findOrCreateUser,
  generateTokens,
  refreshAccessToken,
};
