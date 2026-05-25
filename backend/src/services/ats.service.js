const Groq = require('groq-sdk');
const config = require('../config/env');
const { supabaseAdmin } = require('../config/supabase');
const { AppError } = require('../middleware/error');
const resumeService = require('./resume.service');

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
    console.error('Failed to parse JSON in ATS analysis:', text, e);
    throw new AppError('Failed to parse ATS analysis response.', 500);
  }
};

/**
 * Perform ATS Analysis on a resume for a target job role
 */
const analyzeATS = async (userId, resumeId, targetRole, env) => {
  const resume = await resumeService.getResumeById(userId, resumeId);

  const systemPrompt = `You are a professional ATS (Applicant Tracking System) scanner and HR screener.
Analyze the provided resume against the target job role: "${targetRole}".

Format your response strictly as a JSON object. Do not include any extra text.

JSON Output Schema:
{
  "score": 85, // Integer between 0 and 100
  "keywordAnalysis": {
    "matched": ["list", "of", "matched", "keywords"],
    "missing": ["list", "of", "important", "missing", "keywords"],
    "density": [
      { "keyword": "React", "count": 5, "densityPercentage": 1.2 }
    ]
  },
  "weakSections": ["summary", "projects"], // array of sections needing work
  "relevanceAnalysis": "A detailed paragraph evaluating how closely aligned this resume is to the target role.",
  "formattingAnalysis": {
    "readability": "Good/Poor description",
    "bulletPoints": "Feedback on bullet points",
    "hasContactInfo": true
  },
  "suggestions": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2"
  ]
}

Ensure your evaluation is rigorous. An ATS score should reflect realistic standards (e.g. if the resume lacks skills or project depth for the target role, score it lower, and give suggestions on how to improve).`;

  const userPrompt = `Target Role: ${targetRole}
Resume Data:
Summary: ${resume.summary || 'None'}
Skills: ${JSON.stringify(resume.skills)}
Work Experience: ${JSON.stringify(resume.work_experience)}
Projects: ${JSON.stringify(resume.projects)}
Education: ${JSON.stringify(resume.education)}
Certifications: ${JSON.stringify(resume.certifications)}`;

  try {
    const groq = getGroqClient(env);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const parsedData = cleanAndParseJSON(rawResponse);

    // Save ATS analysis in the database
    const { data: analysis, error: insertError } = await supabaseAdmin
      .from('ats_analyses')
      .insert({
        resume_id: resumeId,
        target_role: targetRole,
        score: parsedData.score,
        keyword_analysis: parsedData.keywordAnalysis,
        weak_sections: parsedData.weakSections,
        relevance_analysis: parsedData.relevanceAnalysis,
        formatting_analysis: parsedData.formattingAnalysis,
        suggestions: parsedData.suggestions
      })
      .select()
      .single();

    if (insertError) {
      console.error('Save ATS Analysis error:', insertError);
      throw new AppError('Failed to save ATS analysis record', 500);
    }

    // Update the resume's general ATS score
    await supabaseAdmin
      .from('resumes')
      .update({ ats_score: parsedData.score })
      .eq('id', resumeId);

    return {
      analysis,
      tokensUsed: completion.usage?.total_tokens || 0
    };
  } catch (error) {
    if (error.isOperational) throw error;
    console.error('ATS Analysis failed:', error);
    throw new AppError('Failed to perform ATS analysis. Please try again.', 500);
  }
};

/**
 * Get all ATS analyses for a specific resume
 */
const getATSAnalyses = async (userId, resumeId) => {
  // Verify ownership
  await resumeService.getResumeById(userId, resumeId);

  const { data, error } = await supabaseAdmin
    .from('ats_analyses')
    .select('*')
    .eq('resume_id', resumeId)
    .order('created_at', { ascending: false });

  if (error) throw new AppError('Failed to fetch ATS analyses', 500);
  return data;
};

module.exports = {
  analyzeATS,
  getATSAnalyses,
  chatWithAI,
  atsTargetOptimize,
};

/**
 * AI Chat: Apply natural language instructions to modify a resume
 * e.g. "Make my summary more senior", "Add React to skills", "Rewrite TechCorp experience"
 */
async function chatWithAI(userId, resumeId, userMessage, chatHistory = [], env) {
  const resume = await resumeService.getResumeById(userId, resumeId);

  const systemPrompt = `You are an expert AI Resume Assistant. You have access to the user's current resume data.
The user will give you natural language instructions like "make my summary more senior", "add Python to my skills", "rewrite my experience at Company X to be more impactful", etc.

Your job is to:
1. Understand the instruction
2. Apply it to the resume data
3. Return BOTH a conversational reply AND the specific changes to apply to the resume

Always respond in this exact JSON format:
{
  "reply": "Your conversational response explaining what you changed and why.",
  "changes": {
    "summary": "Updated summary text if changed, or null if not changed",
    "skills": ["array", "of", "skills", "if", "changed"] or null,
    "work_experience": [{ same structure as current work_experience if changed }] or null,
    "education": [{ same structure as current education if changed }] or null,
    "projects": [{ same structure as current projects if changed }] or null,
    "achievements": ["array", "of", "strings"] or null,
    "contact_info": { object or null }
  }
}

Current Resume Data:
${JSON.stringify({
    summary: resume.summary,
    skills: resume.skills,
    work_experience: resume.work_experience,
    education: resume.education,
    projects: resume.projects,
    achievements: resume.achievements,
    certifications: resume.certifications,
    contact_info: resume.contact_info,
    target_role: resume.target_role
  }, null, 2)}

Rules:
- Only include fields in "changes" that you are actually modifying. Set others to null.
- Preserve the existing structure and IDs of array items (like work experience) when updating them.
- Be helpful, professional, and give clear reasoning in your reply.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: userMessage }
  ];

  try {
    const groq = getGroqClient(env);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      temperature: 0.7,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const parsed = cleanAndParseJSON(rawResponse);

    // Apply non-null changes to the resume
    const changesObj = parsed.changes || {};
    const updatePayload = {};
    if (changesObj.summary !== null && changesObj.summary !== undefined) updatePayload.summary = changesObj.summary;
    if (changesObj.skills !== null && changesObj.skills !== undefined) updatePayload.skills = changesObj.skills;
    if (changesObj.work_experience !== null && changesObj.work_experience !== undefined) updatePayload.workExperience = changesObj.work_experience;
    if (changesObj.education !== null && changesObj.education !== undefined) updatePayload.education = changesObj.education;
    if (changesObj.projects !== null && changesObj.projects !== undefined) updatePayload.projects = changesObj.projects;
    if (changesObj.achievements !== null && changesObj.achievements !== undefined) updatePayload.achievements = changesObj.achievements;
    if (changesObj.contact_info !== null && changesObj.contact_info !== undefined) updatePayload.contactInfo = changesObj.contact_info;

    let updatedResume = resume;
    if (Object.keys(updatePayload).length > 0) {
      updatedResume = await resumeService.updateResume(userId, resumeId, updatePayload);
    }

    return {
      reply: parsed.reply || 'Done! I have applied the changes to your resume.',
      changes: changesObj,
      resume: updatedResume,
      tokensUsed: completion.usage?.total_tokens || 0
    };
  } catch (error) {
    if (error.isOperational) throw error;
    console.error('AI Chat failed:', error);
    throw new AppError('AI chat failed. Please try again.', 500);
  }
}

/**
 * ATS Target Optimizer: Optimize resume to reach a specific ATS score target
 */
async function atsTargetOptimize(userId, resumeId, targetRole, targetScore, env) {
  const resume = await resumeService.getResumeById(userId, resumeId);

  const systemPrompt = `You are an elite ATS optimization specialist. Your goal is to rewrite a resume so it achieves approximately ${targetScore}% ATS compatibility score for the role: "${targetRole}".

Current estimated ATS score: ${resume.ats_score || 'unknown'}%
Target ATS score: ${targetScore}%

Respond ONLY with this JSON structure:
{
  "summary": "Fully rewritten summary optimized for ${targetScore}% ATS score",
  "skills": ["array", "of", "highly", "relevant", "skills", "for", "${targetRole}"],
  "workExperience": [
    {
      "id": "preserve original id",
      "companyName": "original",
      "jobTitle": "original or improved",
      "startDate": "original",
      "endDate": "original",
      "current": true/false,
      "location": "original",
      "description": "Rewritten with strong ATS keywords, STAR method, action verbs, and quantified outcomes"
    }
  ],
  "estimatedNewScore": ${targetScore},
  "keywordsAdded": ["list", "of", "keywords", "inserted"],
  "optimizationSummary": "Explain what specific changes were made and why they will improve the ATS score to ~${targetScore}%"
}

Strategy for achieving ${targetScore}% ATS score:
${targetScore >= 90 ? '- Use extremely precise technical keywords for the exact role\n- Every section should reference the target role directly\n- Maximum keyword density without appearing spammy' : ''}
${targetScore >= 75 && targetScore < 90 ? '- Include all major technical skills for the role\n- Rewrite experience descriptions with strong action verbs\n- Fill any missing key sections' : ''}
${targetScore >= 60 && targetScore < 75 ? '- Add missing must-have keywords\n- Improve summary clarity\n- Strengthen experience descriptions' : ''}
${targetScore < 60 ? '- Focus on basic keyword inclusion\n- Ensure all sections have relevant content\n- Fix major gaps' : ''}`;

  const userPrompt = `Optimize this resume for the role "${targetRole}" to achieve ~${targetScore}% ATS score:
Summary: ${resume.summary || 'None'}
Skills: ${JSON.stringify(resume.skills)}
Work Experience: ${JSON.stringify(resume.work_experience)}
Projects: ${JSON.stringify(resume.projects)}
Education: ${JSON.stringify(resume.education)}`;

  try {
    const groq = getGroqClient(env);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.5,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const parsed = cleanAndParseJSON(rawResponse);

    // Apply optimized content
    const updatedResume = await resumeService.updateResume(userId, resumeId, {
      summary: parsed.summary,
      skills: parsed.skills,
      workExperience: parsed.workExperience,
      targetRole: targetRole,
      atsScore: parsed.estimatedNewScore || targetScore,
      isOptimized: true
    });

    // Save ATS record
    await supabaseAdmin.from('ats_analyses').insert({
      resume_id: resumeId,
      target_role: targetRole,
      score: parsed.estimatedNewScore || targetScore,
      keyword_analysis: { matched: parsed.keywordsAdded || [], missing: [] },
      weak_sections: [],
      relevance_analysis: parsed.optimizationSummary || '',
      formatting_analysis: {},
      suggestions: []
    });

    return {
      resume: updatedResume,
      estimatedNewScore: parsed.estimatedNewScore || targetScore,
      keywordsAdded: parsed.keywordsAdded || [],
      optimizationSummary: parsed.optimizationSummary || '',
      tokensUsed: completion.usage?.total_tokens || 0
    };
  } catch (error) {
    if (error.isOperational) throw error;
    console.error('ATS Target Optimization failed:', error);
    throw new AppError('ATS Target Optimization failed. Please try again.', 500);
  }
}
