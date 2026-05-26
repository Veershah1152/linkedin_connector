const Groq = require('groq-sdk');
const config = require('../config/env');
const { supabaseAdmin } = require('../config/supabase');
const { AppError } = require('../middleware/error');

const getGroqClient = (env) => {
  const dynamicConfig = config.getConfig(env);
  return new Groq({
    apiKey: dynamicConfig.groq.apiKey || 'missing_api_key_set_in_env',
  });
};

// Helper to clean up Markdown-wrapped JSON response from Groq
const cleanAndParseJSON = (text) => {
  try {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    } else if (clean.startsWith('```')) {
      clean = clean.substring(3);
    }
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length - 3);
    }
    return JSON.parse(clean.trim());
  } catch (e) {
    console.error('Failed to parse JSON in resume optimization:', text, e);
    throw new AppError('Failed to parse AI optimization response.', 500);
  }
};

/**
 * Get all resumes for a user
 */
const getResumes = async (userId) => {
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw new AppError('Failed to fetch resumes', 500);
  return data;
};

/**
 * Get a specific resume by ID
 */
const getResumeById = async (userId, resumeId) => {
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .select('*')
    .eq('user_id', userId)
    .eq('id', resumeId)
    .single();

  if (error || !data) throw new AppError('Resume not found', 404);
  return data;
};

/**
 * Create a new resume
 */
const createResume = async (userId, resumeData) => {
  const { data, error } = await supabaseAdmin
    .from('resumes')
    .insert({
      user_id: userId,
      title: resumeData.title || 'My Resume',
      target_role: resumeData.targetRole || null,
      template_id: resumeData.templateId || 'default',
      contact_info: resumeData.contactInfo || {},
      summary: resumeData.summary || null,
      skills: resumeData.skills || [],
      projects: resumeData.projects || [],
      work_experience: resumeData.workExperience || [],
      education: resumeData.education || [],
      certifications: resumeData.certifications || [],
      achievements: resumeData.achievements || [],
      social_links: resumeData.socialLinks || {},
      status: 'draft',
      is_optimized: false,
      ats_score: null,
      version: 1,
      raw_linkedin_data: resumeData.rawLinkedinData || {}
    })
    .select()
    .single();

  if (error) {
    console.error('Create resume error:', error);
    throw new AppError('Failed to create resume', 500);
  }

  // Create initial version snapshot
  await supabaseAdmin.from('resume_versions').insert({
    resume_id: data.id,
    version: 1,
    content: data,
    ats_score: null,
    target_role: data.target_role
  });

  return data;
};

/**
 * Update an existing resume and create a version snapshot
 */
const updateResume = async (userId, resumeId, updateData) => {
  // 1. Fetch current resume to get version and verify ownership
  const currentResume = await getResumeById(userId, resumeId);
  const nextVersion = (currentResume.version || 1) + 1;

  // 2. Perform update
  const { data: updated, error } = await supabaseAdmin
    .from('resumes')
    .update({
      title: updateData.title !== undefined ? updateData.title : currentResume.title,
      target_role: updateData.targetRole !== undefined ? updateData.targetRole : currentResume.target_role,
      template_id: updateData.templateId !== undefined ? updateData.templateId : currentResume.template_id,
      contact_info: updateData.contactInfo !== undefined ? updateData.contactInfo : currentResume.contact_info,
      summary: updateData.summary !== undefined ? updateData.summary : currentResume.summary,
      skills: updateData.skills !== undefined ? updateData.skills : currentResume.skills,
      projects: updateData.projects !== undefined ? updateData.projects : currentResume.projects,
      work_experience: updateData.workExperience !== undefined ? updateData.workExperience : currentResume.work_experience,
      education: updateData.education !== undefined ? updateData.education : currentResume.education,
      certifications: updateData.certifications !== undefined ? updateData.certifications : currentResume.certifications,
      achievements: updateData.achievements !== undefined ? updateData.achievements : currentResume.achievements,
      social_links: updateData.socialLinks !== undefined ? updateData.socialLinks : currentResume.social_links,
      status: updateData.status !== undefined ? updateData.status : currentResume.status,
      is_optimized: updateData.isOptimized !== undefined ? updateData.isOptimized : currentResume.is_optimized,
      ats_score: updateData.atsScore !== undefined ? updateData.atsScore : currentResume.ats_score,
      version: nextVersion,
      updated_at: new Date().toISOString()
    })
    .eq('id', resumeId)
    .select()
    .single();

  if (error) {
    console.error('Update resume error:', error);
    throw new AppError('Failed to update resume', 500);
  }

  // 3. Save new version snapshot
  await supabaseAdmin.from('resume_versions').insert({
    resume_id: resumeId,
    version: nextVersion,
    content: updated,
    ats_score: updated.ats_score,
    target_role: updated.target_role
  });

  return updated;
};

/**
 * Delete a resume
 */
const deleteResume = async (userId, resumeId) => {
  const currentResume = await getResumeById(userId, resumeId);

  const { error } = await supabaseAdmin
    .from('resumes')
    .delete()
    .eq('id', resumeId);

  if (error) throw new AppError('Failed to delete resume', 500);
  return { id: resumeId, success: true };
};

/**
 * List all version history for a resume
 */
const getResumeVersions = async (userId, resumeId) => {
  // Verify ownership
  await getResumeById(userId, resumeId);

  const { data, error } = await supabaseAdmin
    .from('resume_versions')
    .select('*')
    .eq('resume_id', resumeId)
    .order('version', { ascending: false });

  if (error) throw new AppError('Failed to fetch resume versions', 500);
  return data;
};

/**
 * Rollback/Restore a resume to a specific version
 */
const rollbackToVersion = async (userId, resumeId, versionNumber) => {
  // Verify ownership
  await getResumeById(userId, resumeId);

  // Fetch version content
  const { data: versionData, error: versionError } = await supabaseAdmin
    .from('resume_versions')
    .select('*')
    .eq('resume_id', resumeId)
    .eq('version', versionNumber)
    .single();

  if (versionError || !versionData) {
    throw new AppError(`Version ${versionNumber} not found`, 404);
  }

  const content = versionData.content;

  // Perform update back to version values
  const { data: updated, error: updateError } = await supabaseAdmin
    .from('resumes')
    .update({
      title: content.title,
      target_role: content.target_role,
      template_id: content.template_id,
      contact_info: content.contact_info,
      summary: content.summary,
      skills: content.skills,
      projects: content.projects,
      work_experience: content.work_experience,
      education: content.education,
      certifications: content.certifications,
      achievements: content.achievements,
      social_links: content.social_links,
      status: content.status,
      is_optimized: content.is_optimized,
      ats_score: content.ats_score,
      version: versionNumber // keep or progress version number? Standard is progress but here we reset/rollback.
    })
    .eq('id', resumeId)
    .select()
    .single();

  if (updateError) throw new AppError('Failed to roll back resume', 500);

  // Create a new version snapshot reflecting this rollback
  const nextVer = (content.version || 1) + 1;
  await supabaseAdmin
    .from('resumes')
    .update({ version: nextVer })
    .eq('id', resumeId);

  await supabaseAdmin.from('resume_versions').insert({
    resume_id: resumeId,
    version: nextVer,
    content: { ...updated, version: nextVer },
    ats_score: updated.ats_score,
    target_role: updated.target_role
  });

  return { ...updated, version: nextVer };
};

/**
 * Optimize a resume for a target job role using Grok AI
 */
const optimizeResume = async (userId, resumeId, targetRole, env) => {
  const resume = await getResumeById(userId, resumeId);

  const systemPrompt = `You are a world-class Executive Resume Writer and FAANG technical recruiter.
Your task is to optimize the user's resume for their target job role: "${targetRole}".

Format your response strictly as a JSON object containing the optimized parts.
Do not wrap your answer in any text other than the JSON object itself.

JSON Output Schema:
{
  "summary": "An elite, highly professional 2-3 sentence executive summary that positions the user as a top-tier candidate for the target role.",
  "skills": ["Array", "of", "optimized", "skills", "including", "suggested", "ATS", "keywords"],
  "workExperience": [
    {
      "id": "original_id",
      "companyName": "original_company",
      "jobTitle": "optimized_or_original_job_title",
      "startDate": "original_start",
      "endDate": "original_end",
      "current": true_or_false,
      "location": "original_location",
      "description": "• Spearheaded highly professional, quantifiable achievements.\\n• Formatted exactly with markdown bullets (•).\\n• Use elite action verbs and STAR method."
    }
  ],
  "suggestedImprovements": [
    "Text suggestion 1 on gaps or structural enhancements",
    "Text suggestion 2 on what certifications or achievements to add"
  ],
  "missingSkills": [
    "Recommended skill 1 to learn/add",
    "Recommended skill 2 to learn/add"
  ]
}

Instructions for Optimization:
1. SUMMARY: Write an executive-tier, highly professional summary without fluff. Focus on impact and senior-level phrasing.
2. SKILLS: Preserve existing skills but append highly relevant technical/soft skills that ATS systems demand for a "${targetRole}".
3. WORK EXPERIENCE: Keep original metadata (company, dates). Re-write the description. YOU MUST use bullet points starting with the '•' character. Each bullet MUST be punchy, quantifiable, and use the STAR method. Avoid generic phrasing.
4. Keep the original ID values for work experience items so the frontend matches correctly.
5. Make sure the tone is strictly professional, precise, and authoritative.`;

  const userPrompt = `Target Role: ${targetRole}
Current Resume Content:
Summary: ${resume.summary || 'None'}
Skills: ${JSON.stringify(resume.skills)}
Work Experience: ${JSON.stringify(resume.work_experience)}
Projects: ${JSON.stringify(resume.projects)}`;

  try {
    const groq = getGroqClient(env);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: 'json_object' }
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const parsedData = cleanAndParseJSON(rawResponse);

    // Update the resume with the optimized contents
    const updated = await updateResume(userId, resumeId, {
      targetRole: targetRole,
      summary: parsedData.summary,
      skills: parsedData.skills,
      workExperience: parsedData.workExperience,
      isOptimized: true
    });

    return {
      resume: updated,
      suggestedImprovements: parsedData.suggestedImprovements || [],
      missingSkills: parsedData.missingSkills || [],
      tokensUsed: completion.usage?.total_tokens || 0
    };
  } catch (error) {
    console.error('Grok Resume Optimization failed:', error);
    throw new AppError('AI Resume Optimization failed. Please try again.', 500);
  }
};

module.exports = {
  getResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume,
  getResumeVersions,
  rollbackToVersion,
  optimizeResume
};
