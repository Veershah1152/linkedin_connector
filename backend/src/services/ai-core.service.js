const Groq = require('groq-sdk');
const config = require('../config/env');
const { AppError } = require('../middleware/error');

const getGroqClient = (env) => {
  const dynamicConfig = config.getConfig(env);
  return new Groq({
    apiKey: dynamicConfig.groq.apiKey || 'missing_api_key_set_in_env',
  });
};

/**
 * Standard utility to clean up Markdown code block wrapper annotations
 * and parse the resulting JSON string safely.
 * @param {string} text 
 * @returns {object}
 */
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
    console.error('[AI Core Service] Failed to parse JSON:', text, e);
    throw new AppError('Failed to parse AI response payload.', 500);
  }
};

/**
 * Optimize a single resume bullet point utilizing the STAR method.
 * @param {string} bulletText 
 * @param {string} targetRole 
 * @returns {Promise<string>}
 */
async function improveBulletPoint(bulletText, targetRole, env) {
  const systemPrompt = `You are a FAANG recruiter and professional resume writer.
Optimize the following work experience bullet point.

Instructions:
- Utilize the STAR method (Situation, Task, Action, Result).
- Ensure it contains a quantifiable achievement (percentage, dollars, headcount, or time saved).
- Start with a strong, active verb.
- Tailor it to be relevant to a "${targetRole}" position.
- Keep the result to 1 single bullet point starting with '•'.
- Respond strictly in JSON format: { "bullet": "optimized bullet point text" }`;

  const userPrompt = `Bullet point to optimize: "${bulletText}"`;

  try {
    const groq = getGroqClient(env);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const parsedData = cleanAndParseJSON(rawResponse);
    return parsedData.bullet || bulletText;
  } catch (error) {
    console.error('[AI Core Service] Bullet Point optimization failed:', error);
    throw new AppError('AI Bullet Point optimization failed. Please try again.', 500);
  }
}

/**
 * General-purpose professional text rewriter.
 * @param {string} text 
 * @param {string} tone 
 * @returns {Promise<string>}
 */
async function rewriteProfessionally(text, tone = 'executive', env) {
  const systemPrompt = `You are an elite corporate communications expert.
Rewrite the provided text block to sound highly professional, polished, and authoritative.
Tone required: "${tone}".

Instructions:
- Remove filler words, passive voice, and redundant phrases.
- Optimize vocabulary and sentence flow.
- Maintain the original facts and details completely. Do not add fictitious accomplishments.
- Respond strictly in JSON format: { "rewrittenText": "fully rewritten text content" }`;

  try {
    const groq = getGroqClient(env);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Text to rewrite:\n\n${text}` }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: 'json_object' }
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const parsedData = cleanAndParseJSON(rawResponse);
    return parsedData.rewrittenText || text;
  } catch (error) {
    console.error('[AI Core Service] Professional rewrite failed:', error);
    throw new AppError('AI Professional rewrite failed. Please try again.', 500);
  }
}

/**
 * Optimize a resume professional summary.
 * @param {string} summaryText 
 * @param {string} targetRole 
 * @returns {Promise<string>}
 */
async function improveSummary(summaryText, targetRole, env) {
  const systemPrompt = `You are an expert executive search recruiter.
Rewrite the provided resume professional summary to align with a "${targetRole}" role.

Instructions:
- Keep the summary to exactly 2 to 3 concise, high-impact sentences.
- Focus on years of experience, core technical specializations, and broad achievements.
- Do not use generic buzzwords or fluff. Ensure it sounds authoritative.
- Respond strictly in JSON format: { "summary": "improved summary text" }`;

  try {
    const groq = getGroqClient(env);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Current summary: "${summaryText}"` }
      ],
      temperature: 0.7,
      max_tokens: 400,
      response_format: { type: 'json_object' }
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const parsedData = cleanAndParseJSON(rawResponse);
    return parsedData.summary || summaryText;
  } catch (error) {
    console.error('[AI Core Service] Summary optimization failed:', error);
    throw new AppError('AI Summary optimization failed. Please try again.', 500);
  }
}

module.exports = {
  getGroqClient,
  cleanAndParseJSON,
  improveBulletPoint,
  rewriteProfessionally,
  improveSummary
};
