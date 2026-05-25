const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../config/env');
const { AppError } = require('../middleware/error');

const getGroqClient = (env) => {
  const dynamicConfig = config.getConfig(env);
  return new Groq({
    apiKey: dynamicConfig.groq.apiKey || 'missing_api_key_set_in_env',
  });
};

const getGeminiClient = (env) => {
  const dynamicConfig = config.getConfig(env);
  return new GoogleGenerativeAI(dynamicConfig.gemini.apiKey || 'missing_api_key_set_in_env');
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
    console.error('Failed to parse JSON in profile parsing:', text, e);
    throw new AppError('Failed to parse AI profile extraction response.', 500);
  }
};

/**
 * Extract raw text from a PDF Buffer
 * @param {Buffer} buffer 
 * @returns {Promise<string>}
 */
const extractTextFromPDF = async (buffer, env) => {
  try {
    const gemini = getGeminiClient(env);
    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent([
      {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: 'application/pdf',
        },
      },
      'Extract and return all text from this PDF document exactly as it is, without any commentary or markdown wrapper.',
    ]);
    return result.response.text() || '';
  } catch (err) {
    console.error('Gemini PDF extraction failed:', err);
    throw new AppError('Failed to parse PDF document. Please ensure it is a valid PDF.', 400);
  }
};

/**
 * Parse raw profile text using Groq AI
 * @param {string} rawText 
 * @returns {Promise<object>} Parsed resume details matching the schema
 */
const parseProfileWithAI = async (rawText, env) => {
  const systemPrompt = `You are an expert AI Resume Builder and Profile Parser.
Your task is to parse raw text extracted from a LinkedIn profile (which may be a PDF export or raw copied text) and construct a complete, professional, FlowCV-style resume.

Format your response strictly as a JSON object matching the requested schema.
Do not wrap your answer in any text other than the JSON object itself.

JSON Output Schema:
{
  "title": "A descriptive title for this resume draft, e.g. 'Senior Frontend Dev - LinkedIn Import'",
  "targetRole": "Extracted target job role based on headline or recent title (e.g. AI Engineer, Full Stack Developer)",
  "contactInfo": {
    "fullName": "Extracted full name",
    "email": "Extracted email if present, otherwise empty string",
    "phone": "Extracted phone number if present, otherwise empty string",
    "location": "City, Country or region if present, otherwise empty string"
  },
  "summary": "Professional executive summary (2-3 sentences) written using extracted headline and details.",
  "skills": ["Array", "of", "extracted", "technical", "and", "soft", "skills"],
  "workExperience": [
    {
      "companyName": "Company name",
      "jobTitle": "Job Title (e.g. Senior Software Engineer)",
      "startDate": "Start date (YYYY-MM or readable date)",
      "endDate": "End date or 'Present' if current",
      "current": true_or_false,
      "location": "Location (Remote/Hybrid/City)",
      "description": "Rich description bullet points using STAR method (Situation, Task, Action, Result) based on extracted achievements."
    }
  ],
  "education": [
    {
      "schoolName": "School / University name",
      "degree": "Degree (e.g. Bachelor of Science)",
      "fieldOfStudy": "Field of study (e.g. Computer Science)",
      "startDate": "Start date",
      "endDate": "End date",
      "grade": "GPA or Grade if present, otherwise empty"
    }
  ],
  "certifications": [
    {
      "title": "Certification name",
      "issuingOrganization": "Issuing organization",
      "issueDate": "Issue date (YYYY-MM)",
      "credentialId": "Credential ID if present",
      "credentialUrl": "Credential URL if present"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "role": "Role in project",
      "url": "Project URL if present",
      "description": "Details about what was built and technologies used."
    }
  ],
  "achievements": [
    "Specific extracted outstanding accomplishment 1",
    "Specific extracted outstanding accomplishment 2"
  ],
  "socialLinks": {
    "linkedin": "LinkedIn profile link",
    "github": "GitHub link if present",
    "portfolio": "Portfolio website if present"
  }
}

Important Instructions:
1. VOLUNTEERING: Volunteering history is critical. Extract any volunteering details and add them directly into the 'workExperience' array. Prefix the jobTitle with 'Volunteer - ' (e.g., 'Volunteer - Project Manager') and write a clear, descriptive volunteering detail in the description.
2. POSTS: Analyze any text indicating LinkedIn posts, articles, or comments. Convert these insights into relevant technical projects (added to 'projects') or accomplishments (added to 'achievements' or 'skills')!
3. CERTIFICATIONS: Extract every single certification listed and add it into the 'certifications' array.
4. METRICS: If the profile has numbers, percentages, or achievements, write them into the work experience descriptions using impactful action verbs.
5. If some sections are missing, return empty arrays/objects rather than making up fake details. Make the title descriptive and include the date.`;

  try {
    const groq = getGroqClient(env);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Raw Extracted LinkedIn Profile Text:\n\n${rawText}` }
      ],
      temperature: 0.3,
      max_tokens: 3000,
      response_format: { type: 'json_object' }
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const parsedData = cleanAndParseJSON(rawResponse);

    return parsedData;
  } catch (err) {
    console.error('Groq profile extraction failed:', err);
    throw new AppError('AI failed to parse and extract resume details. Please ensure your input is valid profile text.', 500);
  }
};

/**
 * Parse and merge LinkedIn profile text and previous CV text using Groq AI
 * @param {string} linkedinText 
 * @param {string} cvText 
 * @returns {Promise<object>} Parsed resume details matching the schema
 */
const mergeAndParseProfilesWithAI = async (linkedinText, cvText, env) => {
  const systemPrompt = `You are an expert AI Resume Builder and Profile Parser.
Your task is to merge, de-duplicate, and synthesize information from two separate profile inputs:
1. A LinkedIn profile (which may contain experiences, posts, volunteering, skills, etc.)
2. A previous CV / Resume (which contains professional history, structure, projects, and detailed bullet points)

Synthesize these documents into a single, comprehensive, highly professional, FlowCV-style resume.

Merging & Synthesis Guidelines:
1. DE-DUPLICATION: If a job role or school is present in both the LinkedIn profile and the CV, merge them into a single record. Select the richest descriptions, combine overlapping details, and form robust, professional bullet points using the STAR method (Situation, Task, Action, Result).
2. ENRICHMENT: Blend skills, achievements, projects, volunteering history, and certifications from BOTH sources to form the most complete representation of the candidate.
3. VOLUNTEERING: Volunteering history is critical. Extract any volunteering details and add them directly into the 'workExperience' array. Prefix the jobTitle with 'Volunteer - ' (e.g. 'Volunteer - React Developer') and write a clear, descriptive volunteering detail in the description.
4. POSTS: Convert any LinkedIn posts or achievements into technical 'projects' or detailed 'achievements' entries!
5. METRICS: Use metrics, numbers, and impact-driven phrasing where present in either document. Keep the descriptions engaging and ATS-compliant.
6. Do not manufacture or hallucinate any facts. If a section is completely missing from both inputs, return an empty array/object.

Format your response strictly as a JSON object matching the requested schema.
Do not wrap your answer in any text other than the JSON object itself.

JSON Output Schema:
{
  "title": "A descriptive title for this resume draft, e.g. 'Combined Senior Engineer Profile'",
  "targetRole": "Extracted target job role based on combined details (e.g. Full Stack Developer, Data Scientist)",
  "contactInfo": {
    "fullName": "Extracted full name",
    "email": "Extracted email if present, otherwise empty string",
    "phone": "Extracted phone number if present, otherwise empty string",
    "location": "City, Country or region if present, otherwise empty string"
  },
  "summary": "AI-optimized professional executive summary (2-3 sentences) summarizing their core expertise, referencing key details from both sources.",
  "skills": ["Array", "of", "extracted", "and", "de-duplicated", "technical", "and", "soft", "skills"],
  "workExperience": [
    {
      "companyName": "Company name",
      "jobTitle": "Job Title (e.g. Senior Software Engineer)",
      "startDate": "Start date",
      "endDate": "End date or 'Present'",
      "current": true_or_false,
      "location": "Location (Remote/Hybrid/City)",
      "description": "Rich merged bullet points written using action-oriented STAR sentences."
    }
  ],
  "education": [
    {
      "schoolName": "School / University name",
      "degree": "Degree (e.g. Bachelor of Science)",
      "fieldOfStudy": "Field of study",
      "startDate": "Start date",
      "endDate": "End date",
      "grade": "GPA or Grade if present, otherwise empty"
    }
  ],
  "certifications": [
    {
      "title": "Certification name",
      "issuingOrganization": "Issuing organization",
      "issueDate": "Issue date (YYYY-MM)",
      "credentialId": "Credential ID if present",
      "credentialUrl": "Credential URL if present"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "role": "Role in project",
      "url": "Project URL if present",
      "description": "Details about what was built and technologies used."
    }
  ],
  "achievements": [
    "Specific outstanding accomplishment 1",
    "Specific outstanding accomplishment 2"
  ],
  "socialLinks": {
    "linkedin": "LinkedIn profile link",
    "github": "GitHub link if present",
    "portfolio": "Portfolio website if present"
  }
}`;

  const userPrompt = `LinkedIn Profile Content:\n\n${linkedinText}\n\n=========================\n\nPrevious CV / Resume Content:\n\n${cvText}`;

  try {
    const groq = getGroqClient(env);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 3500,
      response_format: { type: 'json_object' }
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const parsedData = cleanAndParseJSON(rawResponse);

    return parsedData;
  } catch (err) {
    console.error('Groq profile synthesis failed:', err);
    throw new AppError('AI failed to merge and optimize your profiles. Please ensure your inputs are valid.', 500);
  }
};

module.exports = {
  extractTextFromPDF,
  parseProfileWithAI,
  mergeAndParseProfilesWithAI
};
