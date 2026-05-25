const { AppError } = require('../middleware/error');

/**
 * Fetch profile data from LinkedIn API.
 * LinkedIn's API only provides name/email/picture via OIDC.
 * r_fullprofile (education, positions, skills) requires LinkedIn Enterprise Partner access.
 * This service:
 *  1. Fetches real data available via OIDC (name, email, picture, headline)
 *  2. Returns a structured empty-field profile for the user to manually fill in
 *     via the resume editor — no fake mock data.
 */
const importLinkedInProfile = async (accessToken) => {
  let profile = null;

  // 1. Try OIDC userinfo endpoint (available to all apps)
  try {
    const userinfoRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (userinfoRes.ok) {
      profile = await userinfoRes.json();
    } else {
      console.warn('[LinkedIn Import] OIDC userinfo failed, status:', userinfoRes.status);
    }
  } catch (err) {
    console.warn('[LinkedIn Import] OIDC fetch error:', err.message);
  }

  // 2. Try LinkedIn v2 /me for headline (may work with basic scope)
  let headline = '';
  try {
    const meRes = await fetch('https://api.linkedin.com/v2/me?projection=(id,headline)', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (meRes.ok) {
      const meData = await meRes.json();
      headline = meData.headline?.localized?.en_US || '';
    }
  } catch (err) {
    // Silently ignore — not critical
  }

  const fullName = profile?.name || '';
  const email = profile?.email || '';
  const profilePicture = profile?.picture || null;
  const givenName = profile?.given_name || '';
  const familyName = profile?.family_name || '';

  // Build linkedin profile URL from name if available
  const linkedinSlug = fullName
    ? fullName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    : '';

  // Return real data we could get + empty arrays for the user to fill in the editor
  // This ensures no fake/mock data appears in the resume
  return {
    // ── REAL DATA FROM LINKEDIN ──
    fullName,
    email,
    profilePicture,
    givenName,
    familyName,
    headline: headline || profile?.headline || '',

    // ── METADATA ──
    importedAt: new Date().toISOString(),
    dataSource: 'linkedin_oidc',
    // Note to frontend: show "complete your profile" prompt for these empty sections
    needsManualCompletion: true,
    missingFields: ['experience', 'education', 'skills', 'certifications', 'projects', 'achievements'],

    // ── EMPTY SECTIONS (user fills in the editor) ──
    about: '',
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    achievements: [],
    socialLinks: {
      linkedin: linkedinSlug ? `https://www.linkedin.com/in/${linkedinSlug}` : '',
      github: '',
      portfolio: '',
    },
  };
};

module.exports = {
  importLinkedInProfile,
};
