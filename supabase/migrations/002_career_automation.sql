-- ============================================
-- LinkedIn Resume & Career Automation Schema
-- Database Schema (Supabase / PostgreSQL)
-- ============================================

-- Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure the updated_at trigger function exists (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- RESUMES TABLE
-- ============================================
CREATE TABLE resumes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  target_role VARCHAR(255),
  template_id VARCHAR(50) DEFAULT 'default',
  contact_info JSONB DEFAULT '{}'::jsonb,
  summary TEXT,
  skills TEXT[] DEFAULT '{}',
  projects JSONB DEFAULT '[]'::jsonb,
  work_experience JSONB DEFAULT '[]'::jsonb,
  education JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  achievements TEXT[] DEFAULT '{}',
  social_links JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  is_optimized BOOLEAN DEFAULT FALSE,
  ats_score INTEGER,
  version INTEGER DEFAULT 1,
  raw_linkedin_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- RESUME VERSIONS TABLE
-- ============================================
CREATE TABLE resume_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  content JSONB NOT NULL,
  ats_score INTEGER,
  target_role VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ATS ANALYSES TABLE
-- ============================================
CREATE TABLE ats_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  target_role VARCHAR(255) NOT NULL,
  score INTEGER NOT NULL,
  keyword_analysis JSONB DEFAULT '{}'::jsonb,
  weak_sections TEXT[] DEFAULT '{}',
  relevance_analysis TEXT,
  formatting_analysis JSONB DEFAULT '{}'::jsonb,
  suggestions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CERTIFICATIONS UPLOADS TABLE
-- ============================================
CREATE TABLE certifications_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255) NOT NULL,
  issue_date DATE,
  credential_id VARCHAR(255),
  credential_url TEXT,
  file_url TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'failed')),
  publish_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_target_role ON resumes(target_role);
CREATE INDEX idx_resume_versions_resume_id ON resume_versions(resume_id);
CREATE INDEX idx_ats_analyses_resume_id ON ats_analyses(resume_id);
CREATE INDEX idx_certifications_uploads_user_id ON certifications_uploads(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE resume_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ats_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications_uploads ENABLE ROW LEVEL SECURITY;

-- Resumes policies
CREATE POLICY "Users can CRUD own resumes" ON resumes
  FOR ALL USING (auth.uid() = user_id);

-- Resume versions policies
CREATE POLICY "Users can view own resume versions" ON resume_versions
  FOR SELECT USING (
    resume_id IN (SELECT id FROM resumes WHERE user_id = auth.uid())
  );
CREATE POLICY "Users can insert own resume versions" ON resume_versions
  FOR INSERT WITH CHECK (
    resume_id IN (SELECT id FROM resumes WHERE user_id = auth.uid())
  );

-- ATS analyses policies
CREATE POLICY "Users can CRUD own ATS analyses" ON ats_analyses
  FOR ALL USING (
    resume_id IN (SELECT id FROM resumes WHERE user_id = auth.uid())
  );

-- Certifications policies
CREATE POLICY "Users can CRUD own certifications uploads" ON certifications_uploads
  FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER tr_resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER tr_certifications_uploads_updated_at
  BEFORE UPDATE ON certifications_uploads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
