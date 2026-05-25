const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { supabaseAdmin } = require('./src/config/supabase');
const linkedinImportService = require('./src/services/linkedin-import.service');
const resumeService = require('./src/services/resume.service');
const atsService = require('./src/services/ats.service');
const certificationService = require('./src/services/certification.service');

async function testServices() {
  console.log('--- Career Automation Module Loading Check ---');
  try {
    console.log('[OK] LinkedIn Import Service loaded successfully');
    console.log('[OK] Resume Service loaded successfully');
    console.log('[OK] ATS Service loaded successfully');
    console.log('[OK] Certification Service loaded successfully');

    // Test database table connection - checking if we can perform a select query (which checks table existence)
    console.log('\n--- Checking Database Schema Integrity ---');

    const testUser = {
      linkedin_id: 'temp_import_123',
      email: 'import@example.com',
      full_name: 'Import Test User',
      linkedin_access_token: 'dummy',
      linkedin_token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
    };

    // 1. Create temporary user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (userError) {
      if (userError.code === '23505') {
        console.log('[OK] Test user already exists or constraint handled.');
      } else {
        throw new Error(`Failed to insert test user: ${userError.message}`);
      }
    }

    const targetUserId = user?.id || (await supabaseAdmin.from('users').select('id').eq('linkedin_id', 'temp_import_123').single()).data.id;

    // 2. Validate resumes table
    const { data: resumeCheck, error: resumeError } = await supabaseAdmin
      .from('resumes')
      .select('id')
      .eq('user_id', targetUserId)
      .limit(1);

    if (resumeError) {
      console.error('[ERROR] Resumes table check failed:', resumeError.message);
    } else {
      console.log('[OK] "resumes" table exists and query succeeded.');
    }

    // 3. Validate resume_versions table
    const { data: versionsCheck, error: versionsError } = await supabaseAdmin
      .from('resume_versions')
      .select('id')
      .limit(1);

    if (versionsError) {
      console.error('[ERROR] Resume Versions table check failed:', versionsError.message);
    } else {
      console.log('[OK] "resume_versions" table exists and query succeeded.');
    }

    // 4. Validate ats_analyses table
    const { data: atsCheck, error: atsError } = await supabaseAdmin
      .from('ats_analyses')
      .select('id')
      .limit(1);

    if (atsError) {
      console.error('[ERROR] ATS Analyses table check failed:', atsError.message);
    } else {
      console.log('[OK] "ats_analyses" table exists and query succeeded.');
    }

    // 5. Validate certifications_uploads table
    const { data: certCheck, error: certError } = await supabaseAdmin
      .from('certifications_uploads')
      .select('id')
      .limit(1);

    if (certError) {
      console.error('[ERROR] Certifications Uploads table check failed:', certError.message);
    } else {
      console.log('[OK] "certifications_uploads" table exists and query succeeded.');
    }

    // Cleanup test user
    await supabaseAdmin.from('users').delete().eq('id', targetUserId);
    console.log('[Cleaned] Temporary test data removed.');

  } catch (error) {
    console.error('[CRITICAL] Verification check failed:', error);
  }
}

testServices();
