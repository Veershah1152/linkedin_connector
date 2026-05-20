const Groq = require('groq-sdk');
const config = require('../config/env');
const { supabaseAdmin } = require('../config/supabase');
const { AppError } = require('../middleware/error');

// Initialize Groq client
const groq = new Groq({
  apiKey: config.groq.apiKey || process.env.GROQ_API_KEY || 'missing_api_key_set_in_env',
});

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
    console.error('Failed to parse JSON:', text, e);
    return {
      options: [
        { content: text }
      ]
    };
  }
};

const STYLE_GUIDELINE = `
Style Guidelines & Examples:
Example 1 (Competition/Hackathon win):
"Excited to share a proud achievement!

Our team clinched the 1st place 🥇 in the FE Mathematics Quiz Competition 2024–2025, organized by the Department of First Year Engineering at Pimpri Chinchwad Education Trust'S. Pimpri Chinchwad College Of Engineering (PCCOER), Pune.

This intellectually stimulating event tested not only our knowledge of mathematics 📚 but also our teamwork, problem-solving abilities, and time management skills ⏱️. From solving complex equations to working together under pressure, every moment was a great learning experience!

Throughout the competition, we collaborated, stayed focused, and supported each other to overcome challenging rounds and make it to the top. I'm incredibly grateful to my teammates for their energy and effort, and to our faculty and organizers for giving us such a wonderful platform to grow and excel 💡.

Looking forward to participating in more such enriching experiences in the future!

#PCCOER #MathQuiz #FirstPlace #Teamwork #ProblemSolving #Mathematics"

Example 2 (Course/Certificate completion):
"Excited to Share My Latest Achievement!

I’m thrilled to announce that I have successfully completed the "Hack Servers and Install a Backdoor" course on Udemy and earned my course completion certificate!

Through this course, I gained valuable insights into network security, including:
🔹 Identifying open ports and vulnerabilities
🔹 Understanding password attacks and brute force methods
🔹 Setting up and detecting backdoors in systems

This course has deepened my understanding of ethical hacking and cybersecurity threats, further fueling my passion for cybersecurity. Looking forward to applying these learnings in real-world scenarios and continuing my journey in cybersecurity!

A big thank you to Udemy and the instructor for this insightful course.

#Cybersecurity #EthicalHacking #Learning #Udemy #CyberSec #Networking #SecurityThreats"

Example 3 (Certificate / Soft Skills):
"🌟 Certificate of Achievement: Communication Skills 🌟

I'm excited to share that I've successfully completed the "Communication Skills" course offered by TCS iON, Tata Consultancy Services.

This comprehensive course covered key areas, including:
• The Importance of Communication
• The Process of Communication
• Overcoming Barriers to Communication
• Non-Verbal and Verbal Communication
• Strategies for Effective Communication

Looking forward to applying these skills in future collaborations and projects!

#TCS #CommunicationSkills #ProfessionalGrowth #Learning"
`;

/**
 * Generate a LinkedIn post using Groq AI
 */
const generatePost = async (userId, options) => {
  const {
    prompt,
    tone = 'professional',
    length = 'medium',
    industry = '',
    includeHashtags = true,
    includeEmojis = true,
  } = options;

  const lengthGuide = {
    short: '50-100 words',
    medium: '150-250 words',
    long: '300-500 words',
  };

  const systemPrompt = `You are a professional LinkedIn content strategist and copywriter.
Generate 3 distinct, high-quality LinkedIn post options based on the user's prompt.

Format your output strictly as a JSON object with this structure:
{
  "options": [
    {
      "content": "Option 1 text content"
    },
    {
      "content": "Option 2 text content"
    },
    {
      "content": "Option 3 text content"
    }
  ]
}

Rules for each option:
- CONTENT ACCURACY: The post must be strictly based on the facts, details, and context provided in the user's prompt. Do NOT make up unrelated stories.
- STYLE-ONLY REFERENCE: The examples in this prompt are strictly for structure, spacing, and formatting. Do NOT copy any details or topics from the examples (such as PCCOER, mathematics, PCCOER Math Quiz, ethical hacking, communication skills, PCCOER).
- Perspective: ALWAYS write in the FIRST-PERSON perspective ("I", "my", "me", "we", "our"). The author is posting about their own work or achievement.
- NO THIRD-PERSON: NEVER refer to the author (even if the prompt mentions "Veer Shah" or another name) in the third person. Do not write "Congratulations to Veer Shah" or "Veer's story". Instead, write "I am excited to share..." or "I completed...".
- Tone: ${tone}
- Length: ${lengthGuide[length] || lengthGuide.medium}
- Industry context: ${industry || 'general professional'}
- ${includeEmojis ? 'Include relevant emojis naturally' : 'Do NOT include emojis'}
- ${includeHashtags ? 'Include 3-5 relevant hashtags at the end' : 'Do NOT include hashtags'}
- Match the visual/textual style and structure shown in the examples below (spaced out paragraphs, bullet points, enthusiastic hooks, and relevant hashtags).

${STYLE_GUIDELINE}

Return ONLY the JSON object. Do not include any extra text outside the JSON object.`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const parsedData = cleanAndParseJSON(rawResponse);
    const tokensUsed = completion.usage?.total_tokens || 0;

    // Save generation history (saving option 1 as default history)
    const firstOptionContent = parsedData.options?.[0]?.content || '';
    await supabaseAdmin.from('ai_generations').insert({
      user_id: userId,
      prompt,
      generated_content: firstOptionContent,
      model: 'llama-3.3-70b-versatile',
      tokens_used: tokensUsed,
    });

    return {
      options: parsedData.options || [],
      tokensUsed,
    };
  } catch (error) {
    console.error('Groq AI error:', error);
    throw new AppError('Failed to generate post content. Please try again.', 500);
  }
};

/**
 * Analyze an image or PDF and generate a LinkedIn post
 */
const analyzeImage = async (userId, file, options) => {
  const {
    tone = 'professional',
    length = 'medium',
    includeHashtags = true,
    includeEmojis = true,
    additionalPrompt = '',
  } = options;

  const lengthGuide = {
    short: '50-100 words',
    medium: '150-250 words',
    long: '300-500 words',
  };

  const isPdf = file.mimetype === 'application/pdf';

  const systemPrompt = `You are a professional LinkedIn content strategist and copywriter.
Analyze the provided ${isPdf ? 'document text' : 'image'} and generate 3 distinct, high-quality LinkedIn post options about it.

Format your output strictly as a JSON object with this structure:
{
  "options": [
    {
      "content": "Option 1 text content"
    },
    {
      "content": "Option 2 text content"
    },
    {
      "content": "Option 3 text content"
    }
  ]
}

Rules for each option:
- CONTENT ACCURACY: The post must be strictly based on the facts, details, and context extracted from the provided document text or image. Do NOT write generic or unrelated text. If the document is a certificate or course or event participation, write about exactly that.
- STYLE-ONLY REFERENCE: The examples in this prompt are strictly for structure, spacing, and formatting. Do NOT copy any details or topics from the examples (such as PCCOER, mathematics, PCCOER Math Quiz, ethical hacking, communication skills, PCCOER).
- Perspective: ALWAYS write in the FIRST-PERSON perspective ("I", "my", "me", "we", "our"). The author is posting about their own document/image/achievement.
- NO THIRD-PERSON: NEVER refer to the user in the third person. If a certificate or document contains a name like "Veer Shah", write the post as if Veer Shah himself is posting it (e.g., "I am thrilled to have completed..." instead of "Shining a spotlight on Veer Shah" or "Congratulating Veer Shah").
- Tone: ${tone}
- Length: ${lengthGuide[length] || lengthGuide.medium}
- ${includeEmojis ? 'Include relevant emojis naturally' : 'Do NOT include emojis'}
- ${includeHashtags ? 'Include 3-5 relevant hashtags at the end' : 'Do NOT include hashtags'}
- Start with a hook that relates to the content
- Match the visual/textual style and structure shown in the examples below (spaced out paragraphs, bullet points, enthusiastic hooks, and relevant hashtags).

${STYLE_GUIDELINE}

Return ONLY the JSON object. Do not include any extra text outside the JSON object.`;

  try {
    let completion;
    let usedModel;
    let pdfFallbackUsed = false;

    let extractedText = '';

    if (isPdf) {
      // ── PDF via Local Extraction (pdf-parse) ───────────────────────────────
      const pdfParse = require('pdf-parse');
      const pdfData = await pdfParse(file.buffer);
      extractedText = (pdfData.text || '').substring(0, 15000); // Allow more text
      
      // If it's a scanned PDF, pdf-parse will return empty or very little text.
      // Fallback to OCR.Space for scanned PDFs.
      if (extractedText.trim().length < 50) {
        console.log('[AI] Scanned PDF detected. Falling back to OCR.Space...');
        pdfFallbackUsed = true;
        const formData = new FormData();
        formData.append('base64Image', `data:application/pdf;base64,${file.buffer.toString('base64')}`);
        formData.append('apikey', 'helloworld'); // Free fallback key
        formData.append('language', 'eng');

        const ocrRes = await fetch('https://api.ocr.space/parse/image', {
          method: 'POST',
          body: formData
        });
        const ocrData = await ocrRes.json();
        if (ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
          extractedText = ocrData.ParsedResults.map(r => r.ParsedText).join('\n').substring(0, 15000);
        }
      }

      if (!extractedText.trim()) {
        throw new AppError('Could not extract text from this PDF via text extraction or OCR.', 422);
      }
      console.log('[AI] PDF extraction length:', extractedText.length, 'chars');

    } else {
      // ── Image via Local Tesseract OCR ──────────────────────────────────────
      console.log('[AI] Running local Tesseract OCR on image...');
      const Tesseract = require('tesseract.js');
      const { data: { text } } = await Tesseract.recognize(file.buffer, 'eng');
      extractedText = text.substring(0, 15000);
      
      if (!extractedText.trim()) {
        throw new AppError('Could not read any text from this image. Please upload an image with clearer text.', 422);
      }
      console.log('[AI] Tesseract OCR text length:', extractedText.length, 'chars');
    }

    const userPrompt = additionalPrompt
      ? `Please write a LinkedIn post based on the following extracted document/image content. Additional context from the user: ${additionalPrompt}\n\nExtracted Content:\n${extractedText}`
      : `Please write a LinkedIn post based on the following extracted document/image content.\n\nExtracted Content:\n${extractedText}`;

    usedModel = 'llama-3.3-70b-versatile';
    completion = await groq.chat.completions.create({
      model: usedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
      response_format: { type: 'json_object' },
    });

    const rawResponse = completion.choices[0]?.message?.content || '';
    const parsedData = cleanAndParseJSON(rawResponse);
    const tokensUsed = completion.usage?.total_tokens || 0;

    const firstOptionContent = parsedData.options?.[0]?.content || '';
    await supabaseAdmin.from('ai_generations').insert({
      user_id: userId,
      prompt: (isPdf ? 'PDF Analysis: ' : 'Image Analysis: ') + (additionalPrompt || 'Default prompt'),
      generated_content: firstOptionContent,
      model: usedModel,
      tokens_used: tokensUsed,
    });

    return {
      options: parsedData.options || [],
      tokensUsed,
      pdfFallbackUsed,
    };
  } catch (error) {
    // AppErrors from geminiGenerateWithFallback or elsewhere — rethrow as-is
    if (error.isOperational) throw error;
    console.error('AI Vision/PDF error:', error);
    const errorMessage = error?.error?.error?.message || error.message || 'Unknown error occurred';
    throw new AppError(`Failed to analyze file: ${errorMessage}`, 500);
  }
};

/**
 * Get AI generation history for a user
 */
const getGenerationHistory = async (userId, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('ai_generations')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new AppError('Failed to fetch generation history', 500);

  return {
    generations: data,
    total: count,
    page,
    totalPages: Math.ceil((count || 0) / limit),
  };
};

module.exports = { generatePost, analyzeImage, getGenerationHistory };
