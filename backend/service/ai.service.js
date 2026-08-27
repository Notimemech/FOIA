const { GoogleGenAI } = require('@google/genai');
const rubricService = require('./rubric.service');
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// ─────────────────────────────────────────────
// Mock data (dùng khi không có GEMINI_API_KEY)
// ─────────────────────────────────────────────
const mockGrade = () => ({
    overall_band: 8.0,
    sub_scores: { TR: 8.0, CC: 8.0, LR: 8.0, GRA: 8.0 },
    feedback: {
        'Task Response': {
            'Addressing the Prompt': { score: 8.0, comment: 'The essay fully addresses both views and gives a clear opinion.' },
            'Position (Clarity & Consistency of Opinion)': { score: 8.0, comment: 'The position is clear and maintained consistently throughout.' },
            'Development & Support': { score: 7.5, comment: 'Main ideas are well-extended and supported with relevant examples.' },
            'Relevance': { score: 8.0, comment: 'All content is relevant with no filler material.' },
        },
        'Coherence & Cohesion': {
            'Overall Coherence (Logical Flow & Clarity)': { score: 8.0, comment: 'The message is clear and easy to follow.' },
            'Cohesive Devices (Linking Words & References)': { score: 7.5, comment: 'A good range of cohesive devices is used appropriately.' },
            'Paragraphing (Structure & Organization)': { score: 8.0, comment: 'Paragraphing is used effectively with one clear idea per paragraph.' },
            'Progression (Logical Sequencing of Ideas)': { score: 8.0, comment: 'Ideas progress logically from introduction to conclusion.' },
        },
        'Lexical Resource': {
            'Vocabulary Range': { score: 7.5, comment: 'Vocabulary is sufficient and appropriate for the task.' },
            'Flexibility & Precision': { score: 7.5, comment: 'Ideas are successfully paraphrased with some precision.' },
            'Idiomatic & Less Common Usage': { score: 7.0, comment: 'Some less common items are used, though not consistently.' },
            'Word Choice & Collocation': { score: 8.0, comment: 'Word choice is accurate and natural throughout.' },
            'Spelling & Word Formation': { score: 8.0, comment: 'No spelling or word formation errors detected.' },
        },
        'Grammatical Range & Accuracy': {
            'Sentence Structure Variety': { score: 7.5, comment: 'A variety of complex structures is used effectively.' },
            'Complex Sentence Usage': { score: 7.5, comment: 'Complex sentences are used with good accuracy.' },
            'Grammar Accuracy': { score: 8.0, comment: 'Grammar is well-controlled with frequent error-free sentences.' },
            'Punctuation Accuracy': { score: 8.0, comment: 'Punctuation is accurate and supports clarity.' },
        },
        improvements: [
            { title: 'Vocabulary Upgrade', content: "Use 'autonomous vehicles' instead of 'driverless cars' for a more academic tone." },
            { title: 'Sentence Variety', content: 'Vary sentence openings further to demonstrate grammatical range.' },
        ],
        sample_rewrite: '(Mock) This is a Band 8.0 rewritten version of the essay...',
    },
});

// ─────────────────────────────────────────────
// Helper: gọi Gemini với JSON mode
// ─────────────────────────────────────────────
// Model priority list — tries each in order until one works
const MODELS = [
    'gemini-3.6-flash',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-1.5-flash',
];

const callGemini = async (prompt) => {
    let lastError;
    for (const model of MODELS) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: prompt,
                config: { responseMimeType: 'application/json' },
            });
            console.log(`[AI] Used model: ${model}`);
            return JSON.parse(response.text);
        } catch (e) {
            const isNotFound = e.message?.includes('404') || e.message?.includes('NOT_FOUND') || e.message?.includes('no longer available');
            const isQuota   = e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED');
            if (isNotFound) {
                console.warn(`[AI] Model ${model} not available, trying next...`);
                lastError = e;
                continue;
            }
            if (isQuota) {
                console.warn(`[AI] Model ${model} quota exceeded, trying next...`);
                lastError = e;
                continue;
            }
            throw e; // other errors — don't retry
        }
    }
    throw lastError || new Error('All models failed');
};

// ─────────────────────────────────────────────
// Call 1: Chỉ chấm điểm tiêu chí — JSON nhỏ, tập trung
// ─────────────────────────────────────────────
const buildGradingPrompt = (skill, taskPrompt, userInput) => {
    // Prepend official rubric context if available
    const contextBlock = rubricService.buildContextBlock(skill);

    return `${contextBlock}\
You are a certified IELTS Writing examiner. Your ONLY task right now is to score the candidate's essay across four criteria and their sub-criteria.

TASK PROMPT: ${taskPrompt}

CANDIDATE ESSAY:
${userInput}

Return ONLY the following JSON — nothing else, no markdown:
{
  "overall_band": 7.0,
  "sub_scores": { "TR": 7.0, "CC": 7.0, "LR": 7.0, "GRA": 7.0 },
  "feedback": {
    "Task Response": {
      "Addressing the Prompt":                        { "score": 7.0, "comment": "<specific comment quoting the essay>" },
      "Position (Clarity & Consistency of Opinion)":  { "score": 7.0, "comment": "<specific comment>" },
      "Development & Support":                        { "score": 7.0, "comment": "<specific comment>" },
      "Relevance":                                    { "score": 7.0, "comment": "<specific comment>" }
    },
    "Coherence & Cohesion": {
      "Overall Coherence (Logical Flow & Clarity)":   { "score": 7.0, "comment": "<specific comment>" },
      "Cohesive Devices (Linking Words & References)":{ "score": 7.0, "comment": "<specific comment>" },
      "Paragraphing (Structure & Organization)":      { "score": 7.0, "comment": "<specific comment>" },
      "Progression (Logical Sequencing of Ideas)":    { "score": 7.0, "comment": "<specific comment>" }
    },
    "Lexical Resource": {
      "Vocabulary Range":              { "score": 7.0, "comment": "<specific comment>" },
      "Flexibility & Precision":       { "score": 7.0, "comment": "<specific comment>" },
      "Idiomatic & Less Common Usage": { "score": 7.0, "comment": "<specific comment>" },
      "Word Choice & Collocation":     { "score": 7.0, "comment": "<specific comment>" },
      "Spelling & Word Formation":     { "score": 7.0, "comment": "<specific comment>" }
    },
    "Grammatical Range & Accuracy": {
      "Sentence Structure Variety": { "score": 7.0, "comment": "<specific comment>" },
      "Complex Sentence Usage":     { "score": 7.0, "comment": "<specific comment>" },
      "Grammar Accuracy":           { "score": 7.0, "comment": "<specific comment>" },
      "Punctuation Accuracy":       { "score": 7.0, "comment": "<specific comment>" }
    }
  }
}

STRICT RULES:
- overall_band = average of TR, CC, LR, GRA rounded to nearest 0.5
- Every score must be a number (not a string) between 4.0 and 9.0 in 0.5 steps
- Every comment must quote or reference specific phrases from the candidate's essay
- Do NOT include "improvements" or "sample_rewrite" in this response
- Do NOT use markdown inside JSON string values`;
};


// ─────────────────────────────────────────────
// Call 2: Chỉ lấy improvements + sample_rewrite
// ─────────────────────────────────────────────
const buildImprovementsPrompt = (skill, taskPrompt, userInput, overallBand) => {
    const contextBlock = rubricService.buildContextBlock(skill);

    return `${contextBlock}\
You are an IELTS writing coach. The candidate's essay scored Band ${overallBand}.

TASK PROMPT: ${taskPrompt}

CANDIDATE ESSAY:
${userInput}

Return ONLY the following JSON — nothing else, no markdown:
{
  "improvements": [
    { "title": "Short title (max 5 words)", "content": "Specific, actionable suggestion quoting actual phrases from the essay." },
    { "title": "...", "content": "..." },
    { "title": "...", "content": "..." }
  ],
  "sample_rewrite": "A complete rewritten version of the essay targeting one band higher. Preserve the candidate's original ideas and argument structure."
}

STRICT RULES:
- improvements must be an ARRAY of 3 to 5 objects, each with "title" (string) and "content" (string)
- Each improvement must address a DIFFERENT aspect: vocabulary, grammar, coherence, task response, or style
- sample_rewrite must be a complete essay (not bullet points, not instructions)
- Do NOT use markdown inside JSON string values`;
};


// ─────────────────────────────────────────────
// Validate grading response có đủ criteria không
// ─────────────────────────────────────────────
const REQUIRED_CRITERIA = [
    'Task Response',
    'Coherence & Cohesion',
    'Lexical Resource',
    'Grammatical Range & Accuracy',
];

const isValidGradingResult = (result) => {
    if (!result || !result.feedback) {
        console.warn('[AI Validate] No feedback field in result');
        return false;
    }
    const feedbackKeys = Object.keys(result.feedback);
    console.log('[AI Validate] feedback keys:', feedbackKeys);

    return REQUIRED_CRITERIA.every((cat) => {
        const catData = result.feedback[cat];
        if (!catData || typeof catData !== 'object') {
            console.warn(`[AI Validate] Missing or invalid category: "${cat}"`);
            return false;
        }
        // Chấp nhận cả number VÀ string score (Gemini đôi khi trả "7.0" thay vì 7.0)
        const hasValidSub = Object.values(catData).some((v) => {
            if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
            const score = v.score ?? v.Score ?? v.band;
            return score !== undefined && !isNaN(Number(score));
        });
        if (!hasValidSub) console.warn(`[AI Validate] Category "${cat}" has no valid sub-scores`);
        return hasValidSub;
    });
};

// Normalize scores: đảm bảo mọi score là number
const normalizeGradingResult = (result) => {
    if (!result?.feedback) return result;
    for (const cat of REQUIRED_CRITERIA) {
        const catData = result.feedback[cat];
        if (!catData) continue;
        for (const [key, val] of Object.entries(catData)) {
            if (val && typeof val === 'object' && !Array.isArray(val)) {
                if (val.score !== undefined) val.score = Number(val.score);
            }
        }
    }
    if (result.overall_band !== undefined) result.overall_band = Number(result.overall_band);
    if (result.sub_scores) {
        for (const k of Object.keys(result.sub_scores)) {
            result.sub_scores[k] = Number(result.sub_scores[k]);
        }
    }
    return result;
};


// ─────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────
exports.gradeAndCrossCheck = async (skill, taskPrompt, userInput, audioPath) => {
    if (!ai) {
        console.log('No GEMINI_API_KEY — returning mock data.');
        await new Promise((r) => setTimeout(r, 2000));
        return mockGrade();
    }

    try {
        console.log(`[AI] Grading ${skill}...`);

        // ── Call 1 & 2 chạy song song ──
        const [gradingResult, improvementsResult] = await Promise.all([
            (async () => {
                let result = null;
                // Thử tối đa 2 lần nếu criteria bị thiếu
                for (let attempt = 1; attempt <= 2; attempt++) {
                    console.log(`[AI] Grading attempt ${attempt}...`);
                    try {
                        const raw = await callGemini(buildGradingPrompt(skill, taskPrompt, userInput));
                        console.log('[AI] Raw grading keys:', Object.keys(raw ?? {}));
                        console.log('[AI] Raw feedback keys:', Object.keys(raw?.feedback ?? {}));
                        if (isValidGradingResult(raw)) {
                            result = normalizeGradingResult(raw);
                            console.log('[AI] Grading valid ✓, criteria found:', REQUIRED_CRITERIA.filter(c => result.feedback[c]));
                            break;
                        }
                        console.warn(`[AI] Attempt ${attempt}: validation failed, feedback keys:`, Object.keys(raw?.feedback ?? {}));
                    } catch (e) {
                        console.error(`[AI] Grading attempt ${attempt} failed:`, e.message);
                    }
                }
                return result;
            })(),
            (async () => {
                try {
                    // Dùng band 7.0 tạm vì chưa có kết quả grading
                    return await callGemini(buildImprovementsPrompt(skill, taskPrompt, userInput, 7.0));
                } catch (e) {
                    console.error('[AI] Improvements call failed:', e.message);
                    return null;
                }
            })(),
        ]);

        // Nếu grading thất bại sau 2 lần → dùng mock
        if (!gradingResult) {
            console.warn('[AI] Grading failed after retries, using mock.');
            return mockGrade();
        }

        // Merge: gắn improvements + sample_rewrite vào feedback
        gradingResult.feedback.improvements = improvementsResult?.improvements ?? [
            { title: 'See detailed feedback', content: 'Improvements could not be generated this time.' },
        ];
        gradingResult.feedback.sample_rewrite = improvementsResult?.sample_rewrite ?? '';

        console.log('[AI] Final result keys:', Object.keys(gradingResult.feedback));
        return gradingResult;

    } catch (error) {
        console.error('[AI] Service Error:', error);
        return mockGrade();
    }
};
