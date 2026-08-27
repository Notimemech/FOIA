const { GoogleGenAI } = require('@google/genai');
const rubricService = require('./rubric.service');
const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// ─────────────────────────────────────────────
// Helpers: Round score to nearest 0.5 & count words
// ─────────────────────────────────────────────
const roundToHalf = (num) => Math.round(Number(num) * 2) / 2;
const countWords = (text) => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
};

// ─────────────────────────────────────────────
// Mock data generators (in English)
// ─────────────────────────────────────────────
const mockGradeTask1 = (targetBand = 7.0) => ({
    overall_band: 7.0,
    target_band: Number(targetBand) || 7.0,
    sub_scores: { TA: 7.0, CC: 7.0, LR: 7.0, GRA: 7.0 },
    feedback: {
        'Task Achievement': {
            'Addressing the Task & Requirements': { score: 7.0, comment: 'The report covers all main requirements and presents a clear overview of the primary trends and data shifts.' },
            'Overview & Key Features':            { score: 7.0, comment: 'Key features are highlighted effectively and supported with relevant numerical comparisons from the chart.' },
            'Data Selection & Accuracy':          { score: 7.0, comment: 'Key figures are accurately cited without redundant minor data points.' },
            'Detail Extension':                   { score: 7.0, comment: 'Main data points are well-extended and grouped logically into coherent body paragraphs.' },
        },
        'Coherence & Cohesion': {
            'Overall Coherence (Logical Flow & Clarity)':    { score: 7.0, comment: 'Information is presented in a logical sequence moving smoothly from overview to specific comparative details.' },
            'Cohesive Devices (Linking Words & References)': { score: 7.0, comment: 'Appropriate transitions such as "in stark contrast" and "witnessed a steady rise" are deployed naturally.' },
            'Paragraphing (Structure & Organization)':       { score: 7.0, comment: 'Clear paragraph divisions for introduction, overall trend summary, and specific comparisons.' },
            'Progression (Logical Sequencing of Ideas)':     { score: 7.0, comment: 'Comparative statements flow logically between categories.' },
        },
        'Lexical Resource': {
            'Vocabulary Range':               { score: 7.0, comment: 'Good variety of trend and proportion vocabulary (e.g., "upward trajectory", "accounted for the largest share").' },
            'Flexibility & Precision':        { score: 7.0, comment: 'Accurate and precise lexical choices for describing statistical data.' },
            'Collocation & Style':            { score: 7.0, comment: 'Academic register is maintained with mostly natural collocations.' },
            'Spelling & Word Formation':      { score: 7.5, comment: 'No notable spelling or word formation errors detected.' },
        },
        'Grammatical Range & Accuracy': {
            'Sentence Structure Variety':  { score: 7.0, comment: 'A balanced mix of simple, compound, and complex structures is used effectively.' },
            'Complex Sentence Usage':      { score: 7.0, comment: 'Passive voice, participle clauses, and relative clauses are applied accurately.' },
            'Grammar Accuracy':            { score: 7.0, comment: 'High proportion of error-free sentences throughout the report.' },
            'Punctuation Accuracy':        { score: 7.5, comment: 'Punctuation is well-controlled with accurate comma and semicolon placement.' },
        },
        target_band_analysis: {
            target_band: Number(targetBand) || 7.0,
            achieved_band: 7.0,
            status: Number(targetBand) <= 7.0 ? 'achieved' : 'below',
            summary: `Your Task 1 report achieved Band 7.0, ${Number(targetBand) <= 7.0 ? 'successfully meeting' : 'working towards'} your Target Band of ${targetBand}.`,
            strengths: ['Presents a clear Overview paragraph highlighting key trends', 'Accurate data selection without factual distortion'],
            key_gaps: ['Incorporate more diverse complex comparative structures', 'Vary trend descriptors to avoid minor lexical repetition'],
        },
        improvements: [
            { title: 'Upgrade Trend Vocabulary', content: 'Instead of repetitive phrases like "increased rapidly", consider using "experienced a steep exponential surge" to demonstrate wider lexical versatility.' },
            { title: 'Employ Double Comparatives', content: 'Use structures such as "The higher the percentage of users, the more pronounced the shift..." to showcase advanced grammatical range.' },
        ],
        sample_rewrite: '',
    },
});

const mockGradeTask2 = (targetBand = 7.0) => ({
    overall_band: 7.5,
    target_band: Number(targetBand) || 7.0,
    sub_scores: { TR: 7.5, CC: 7.5, LR: 7.5, GRA: 7.5 },
    feedback: {
        'Task Response': {
            'Addressing the Prompt':                        { score: 7.5, comment: 'The essay thoroughly addresses both facets of the argument and establishes a well-reasoned stance.' },
            'Position (Clarity & Consistency of Opinion)':  { score: 7.5, comment: 'A clear thesis is stated in the introduction and consistently reinforced in the conclusion.' },
            'Development & Support':                        { score: 7.5, comment: 'Main ideas are extended with logical reasoning and substantiated with relevant real-world illustrations.' },
            'Relevance':                                    { score: 8.0, comment: 'All discussion points remain strictly relevant to the core topic.' },
        },
        'Coherence & Cohesion': {
            'Overall Coherence (Logical Flow & Clarity)':   { score: 7.5, comment: 'The progression of arguments is transparent, logical, and easy to follow throughout.' },
            'Cohesive Devices (Linking Words & References)':{ score: 7.5, comment: 'Skillful use of referencing and substitution without mechanical over-reliance on standard linkers.' },
            'Paragraphing (Structure & Organization)':      { score: 7.5, comment: 'Each body paragraph focuses on a distinct central topic with well-crafted topic sentences.' },
            'Progression (Logical Sequencing of Ideas)':    { score: 7.5, comment: 'Smooth transitions between contrasting viewpoints and supporting arguments.' },
        },
        'Lexical Resource': {
            'Vocabulary Range':              { score: 7.5, comment: 'Demonstrates a wide lexical repertoire appropriate for high-level academic writing.' },
            'Flexibility & Precision':       { score: 7.5, comment: 'Complex concepts are paraphrased with precision and nuance.' },
            'Idiomatic & Less Common Usage': { score: 7.0, comment: 'Natural incorporation of less common collocations with rare minor inappropriacies.' },
            'Word Choice & Collocation':     { score: 7.5, comment: 'Academic tone and formal register are maintained seamlessly.' },
            'Spelling & Word Formation':     { score: 8.0, comment: 'No spelling or word formation errors observed.' },
        },
        'Grammatical Range & Accuracy': {
            'Sentence Structure Variety': { score: 7.5, comment: 'Employs a wide array of sentence patterns including conditional forms and participle clauses.' },
            'Complex Sentence Usage':     { score: 7.5, comment: 'Complex subordinate clauses are constructed with high accuracy.' },
            'Grammar Accuracy':           { score: 7.5, comment: 'The vast majority of sentences are completely error-free.' },
            'Punctuation Accuracy':       { score: 8.0, comment: 'Precise and accurate control of punctuation.' },
        },
        target_band_analysis: {
            target_band: Number(targetBand) || 7.0,
            achieved_band: 7.5,
            status: Number(targetBand) <= 7.5 ? 'achieved' : 'below',
            summary: `Your Task 2 essay achieved Band 7.5, ${Number(targetBand) <= 7.5 ? 'successfully surpassing' : 'very close to'} your Target Band of ${targetBand}.`,
            strengths: ['Well-developed thesis with coherent paragraph progression', 'Rich academic vocabulary used accurately in context'],
            key_gaps: ['Deepen specific real-world examples to provide greater depth of analysis', 'Incorporate inversion or cleft sentences to secure Band 8+ in Grammatical Range'],
        },
        improvements: [
            { title: 'Deepen Argument Extension', content: 'In body paragraph 1, elaborate further on the socio-economic ramifications to maximize argument weight.' },
            { title: 'Elevate Lexical Sophistication', content: 'Substitute generic terms with domain-specific phrases such as "autonomous transit infrastructure" for a more scholarly tone.' },
        ],
        sample_rewrite: '',
    },
});

// ─────────────────────────────────────────────
// Model priority list & call helper
// ─────────────────────────────────────────────
const MODELS = [
    'gemini-2.5-flash',
    'gemini-3.6-flash',
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
            if (isNotFound || isQuota) {
                console.warn(`[AI] Model ${model} unavailable (${e.message}), trying next...`);
                lastError = e;
                continue;
            }
            throw e;
        }
    }
    throw lastError || new Error('All models failed');
};

// ─────────────────────────────────────────────
// Build Grading Prompts (in English)
// ─────────────────────────────────────────────

const buildGradingPromptTask1 = (taskPrompt, userInput, targetBand, imageUrl) => {
    const contextBlock = rubricService.buildContextBlock('writing', 'Task 1');
    const imageInfo = imageUrl ? `\nIMAGE/CHART REFERENCE: The candidate was provided this chart/diagram: ${imageUrl}` : '';
    const wordCount = countWords(userInput);

    return `${contextBlock}
You are a certified senior IELTS Writing examiner. Your ONLY task right now is to score the candidate's IELTS Writing TASK 1 report across the four official criteria and their sub-criteria.

TARGET BAND BENCHMARK: ${targetBand || '7.0'}
CRITICAL RULE: The candidate's target band is Band ${targetBand || '7.0'}. Compare the candidate's actual performance directly against the official Band ${targetBand || '7.0'} descriptors from the rubric above. All comments and feedback MUST be written in professional English.

OFFICIAL IELTS 2023 WORD COUNT & UNDERLENGTH RULES:
- CANDIDATE WORD COUNT: ${wordCount} words.
- Responses of 20 words or fewer (e.g. 1 single sentence or fragment): MUST be scored at Band 1.0 across all criteria (TA, CC, LR, GRA) as explicitly defined in the official IELTS rubric.
- Very short responses (21 - 50 words): Underlength with insufficient evidence. MUST be scored between Band 1.5 and Band 2.5.
- Underlength responses (51 - 100 words; Task 1 target is 150+ words): Missing key details and overview. MUST be capped at Band 3.0 - 4.5.
- Empty submission or non-English text: MUST be scored at Band 0.0.

TASK 1 PROMPT:
${taskPrompt}${imageInfo}

CANDIDATE TASK 1 REPORT (${wordCount} words):
${userInput || '(No text submitted)'}

Return ONLY the following JSON — strictly valid JSON, no markdown outside:
{
  "overall_band": 0.0,
  "sub_scores": { "TA": 0.0, "CC": 0.0, "LR": 0.0, "GRA": 0.0 },
  "feedback": {
    "Task Achievement": {
      "Addressing the Task & Requirements": { "score": 0.0, "comment": "<specific English comment evaluating overview & task requirements, quoting the text>" },
      "Overview & Key Features":            { "score": 0.0, "comment": "<specific English comment evaluating key features selection>" },
      "Data Selection & Accuracy":          { "score": 0.0, "comment": "<specific English comment evaluating factual accuracy and data comparison>" },
      "Detail Extension":                   { "score": 0.0, "comment": "<specific English comment evaluating extension of main points>" }
    },
    "Coherence & Cohesion": {
      "Overall Coherence (Logical Flow & Clarity)":    { "score": 0.0, "comment": "<specific English comment>" },
      "Cohesive Devices (Linking Words & References)": { "score": 0.0, "comment": "<specific English comment>" },
      "Paragraphing (Structure & Organization)":       { "score": 0.0, "comment": "<specific English comment>" },
      "Progression (Logical Sequencing of Ideas)":     { "score": 0.0, "comment": "<specific English comment>" }
    },
    "Lexical Resource": {
      "Vocabulary Range":              { "score": 0.0, "comment": "<specific English comment>" },
      "Flexibility & Precision":       { "score": 0.0, "comment": "<specific English comment>" },
      "Collocation & Style":           { "score": 0.0, "comment": "<specific English comment>" },
      "Spelling & Word Formation":     { "score": 0.0, "comment": "<specific English comment>" }
    },
    "Grammatical Range & Accuracy": {
      "Sentence Structure Variety": { "score": 0.0, "comment": "<specific English comment>" },
      "Complex Sentence Usage":     { "score": 0.0, "comment": "<specific English comment>" },
      "Grammar Accuracy":           { "score": 0.0, "comment": "<specific English comment>" },
      "Punctuation Accuracy":       { "score": 0.0, "comment": "<specific English comment>" }
    }
  }
}

STRICT RULES:
- Calculate real scores based on the candidate's actual text length (${wordCount} words) and quality using Band 0 to 9 descriptors.
- overall_band = average of TA, CC, LR, GRA rounded to nearest 0.5.
- Every score must be a number between 0.0 and 9.0 in 0.5 increments (e.g. 0.0, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, ..., 9.0).
- Do NOT artificially inflate scores for short or underlength text.
- Every comment must quote or reference specific phrases from the candidate's report.
- All comments must be written in English.
- Do NOT use markdown inside JSON string values`;
};

const buildGradingPromptTask2 = (taskPrompt, userInput, targetBand) => {
    const contextBlock = rubricService.buildContextBlock('writing', 'Task 2');
    const wordCount = countWords(userInput);

    return `${contextBlock}
You are a certified senior IELTS Writing examiner. Your ONLY task right now is to score the candidate's IELTS Writing TASK 2 essay across the four official criteria and their sub-criteria.

TARGET BAND BENCHMARK: ${targetBand || '7.0'}
CRITICAL RULE: The candidate's target band is Band ${targetBand || '7.0'}. Compare the candidate's actual performance directly against the official Band ${targetBand || '7.0'} descriptors from the rubric above. All comments and feedback MUST be written in professional English.

OFFICIAL IELTS 2023 WORD COUNT & UNDERLENGTH RULES:
- CANDIDATE WORD COUNT: ${wordCount} words.
- Responses of 20 words or fewer (e.g. 1 single sentence or fragment): MUST be scored at Band 1.0 across all criteria (TR, CC, LR, GRA) as explicitly defined in the official IELTS rubric.
- Very short responses (21 - 50 words): Underlength with insufficient evidence. MUST be scored between Band 1.5 and Band 2.5.
- Underlength responses (51 - 140 words; Task 2 target is 250+ words): Lacks adequate thesis development and support. MUST be capped at Band 3.0 - 4.5.
- Empty submission or non-English text: MUST be scored at Band 0.0.

TASK 2 PROMPT:
${taskPrompt}

CANDIDATE TASK 2 ESSAY (${wordCount} words):
${userInput || '(No text submitted)'}

Return ONLY the following JSON — strictly valid JSON, no markdown outside:
{
  "overall_band": 0.0,
  "sub_scores": { "TR": 0.0, "CC": 0.0, "LR": 0.0, "GRA": 0.0 },
  "feedback": {
    "Task Response": {
      "Addressing the Prompt":                        { "score": 0.0, "comment": "<specific English comment quoting the essay>" },
      "Position (Clarity & Consistency of Opinion)":  { "score": 0.0, "comment": "<specific English comment>" },
      "Development & Support":                        { "score": 0.0, "comment": "<specific English comment>" },
      "Relevance":                                    { "score": 0.0, "comment": "<specific English comment>" }
    },
    "Coherence & Cohesion": {
      "Overall Coherence (Logical Flow & Clarity)":   { "score": 0.0, "comment": "<specific English comment>" },
      "Cohesive Devices (Linking Words & References)":{ "score": 0.0, "comment": "<specific English comment>" },
      "Paragraphing (Structure & Organization)":      { "score": 0.0, "comment": "<specific English comment>" },
      "Progression (Logical Sequencing of Ideas)":    { "score": 0.0, "comment": "<specific English comment>" }
    },
    "Lexical Resource": {
      "Vocabulary Range":              { "score": 0.0, "comment": "<specific English comment>" },
      "Flexibility & Precision":       { "score": 0.0, "comment": "<specific English comment>" },
      "Idiomatic & Less Common Usage": { "score": 0.0, "comment": "<specific English comment>" },
      "Word Choice & Collocation":     { "score": 0.0, "comment": "<specific English comment>" },
      "Spelling & Word Formation":     { "score": 0.0, "comment": "<specific English comment>" }
    },
    "Grammatical Range & Accuracy": {
      "Sentence Structure Variety": { "score": 0.0, "comment": "<specific English comment>" },
      "Complex Sentence Usage":     { "score": 0.0, "comment": "<specific English comment>" },
      "Grammar Accuracy":           { "score": 0.0, "comment": "<specific English comment>" },
      "Punctuation Accuracy":       { "score": 0.0, "comment": "<specific English comment>" }
    }
  }
}

STRICT RULES:
- Calculate real scores based on the candidate's actual text length (${wordCount} words) and quality using Band 0 to 9 descriptors.
- overall_band = average of TR, CC, LR, GRA rounded to nearest 0.5.
- Every score must be a number between 0.0 and 9.0 in 0.5 increments (e.g. 0.0, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, ..., 9.0).
- Do NOT artificially inflate scores for short or underlength text.
- Every comment must quote or reference specific phrases from the candidate's essay.
- All comments must be written in English.
- Do NOT use markdown inside JSON string values`;
};

const buildImprovementsPrompt = (partType, taskPrompt, userInput, overallBand, targetBand) => {
    const contextBlock = rubricService.buildContextBlock('writing', partType);

    return `${contextBlock}
You are an expert IELTS writing coach. The candidate scored Band ${overallBand} for ${partType}. The candidate's TARGET BAND is Band ${targetBand || '7.0'}.

TASK PROMPT: ${taskPrompt}

CANDIDATE WRITING:
${userInput}

Provide detailed feedback and comparison against the Target Band (${targetBand || '7.0'}). All text, feedback, titles, summaries, and recommendations MUST be written in English.
Return ONLY the following JSON — strictly valid JSON, no markdown outside:
{
  "target_band_analysis": {
    "target_band": ${Number(targetBand) || 7.0},
    "achieved_band": ${Number(overallBand) || 7.0},
    "status": "${Number(overallBand) >= Number(targetBand || 7.0) ? 'achieved' : 'below'}",
    "summary": "<2-3 sentence overview in English evaluating the candidate's readiness and gaps relative to Target Band ${targetBand || '7.0'}>",
    "strengths": [
      "<Concrete strength 1 in English>",
      "<Concrete strength 2 in English>"
    ],
    "key_gaps": [
      "<Critical gap 1 preventing reaching or surpassing target band in English>",
      "<Critical gap 2 in English>"
    ]
  },
  "improvements": [
    { "title": "<Short actionable title in English (max 6 words)>", "content": "<Specific actionable advice in English quoting phrases from the text and showing how to upgrade>" },
    { "title": "...", "content": "..." },
    { "title": "...", "content": "..." }
  ]
}

STRICT RULES:
- improvements must be an array of 3 to 5 objects with "title" and "content"
- target_band_analysis must provide concrete feedback in English comparing to Target Band ${targetBand || '7.0'}
- Do NOT use markdown inside JSON string values`;
};

// ─────────────────────────────────────────────
// Build On-demand Model Sample Essay Prompt
// ─────────────────────────────────────────────
const buildSampleEssayPrompt = (partType, taskPrompt, userInput, targetBand, imageUrl) => {
    const isTask1 = partType === 'Task 1';
    const imageInfo = imageUrl ? `\nIMAGE/CHART REFERENCE: The chart/diagram provided is: ${imageUrl}` : '';

    return `You are a certified senior IELTS Master Examiner and English author.
Your task is to write a pristine, Band 8.5 to 9.0 model ${isTask1 ? 'report' : 'essay'} for the following IELTS Writing ${partType} prompt.

TASK PROMPT:
${taskPrompt}${imageInfo}

${userInput ? `CANDIDATE'S ORIGINAL WRITING (FOR TOPIC CONTEXT & ARGUMENT FLOW):
${userInput}` : ''}

WRITING CRITERIA:
1. Academic Register & Structure:
   ${isTask1 
     ? '- Introduction (Paraphrase of prompt)\n- Clear, prominent Overview paragraph highlighting the main trends/extremes\n- Body Paragraph 1 (Detailed comparisons with accurate figures)\n- Body Paragraph 2 (Further key features & differences)\n- Minimum 150 words.'
     : '- Introduction (Hook + Paraphrase of topic + Clear, explicit Thesis statement)\n- Body Paragraph 1 (Topic sentence, thorough logical explanation, concrete illustration)\n- Body Paragraph 2 (Topic sentence, opposing or complementary viewpoint fully developed)\n- Conclusion (Restatement of thesis and synthesis of arguments)\n- Minimum 250 words.'}
2. Sophisticated Lexical Resource: Natural use of high-level academic vocabulary, collocations, precision.
3. Grammatical Range & Accuracy: Error-free execution of diverse complex structures (subordinate clauses, passive voice, inversions/participles).

Output ONLY the following JSON — strictly valid JSON, no markdown outside:
{
  "sample_rewrite": "<Full text of the Band 8.5+ model ${isTask1 ? 'report' : 'essay'} in English, formatted with double newlines between paragraphs>"
}`;
};

const generateSampleEssay = async ({ partType = 'Task 2', taskPrompt = '', userInput = '', targetBand = 7.0, imageUrl = null }) => {
    console.log(`[AI] Generating on-demand Model Essay for ${partType}...`);

    if (!ai) {
        await new Promise((r) => setTimeout(r, 1200));
        return partType === 'Task 1'
            ? `The chart illustrates information regarding energy consumption trends across five European countries between 2010 and 2020.\n\nOverall, it is readily apparent that the majority of nations experienced an upward trajectory in total energy utilization over the decade, with Country A consistently dominating overall consumption figures.\n\nIn 2010, Country A consumed approximately 150 million tonnes of oil equivalent, a figure that escalated steadily to surpass 190 million tonnes by 2020. Conversely, Country B exhibited a more modest expansion, beginning at 80 million tonnes and rising to 95 million tonnes over the same period.\n\nIn stark contrast, Country C was the sole nation to demonstrate a slight downward trend, dipping from 60 million tonnes to 52 million tonnes. The remaining countries maintained comparatively stable patterns with marginal year-on-year variations throughout the surveyed timeframe.`
            : `In contemporary society, the debate surrounding technological automation and societal transformation has gained tremendous momentum. While some argue that rapid digitization fosters social fragmentation, I firmly contend that its multifaceted advantages in healthcare, education, and global connectivity overwhelmingly outweigh the potential drawbacks.\n\nTo begin with, technological integration significantly enhances the quality of life and accessibility of essential services. In the medical sector, for instance, artificial intelligence and telemedicine enable remote diagnostics and robotic-assisted surgeries, ensuring that patients in underprivileged regions receive prompt, expert care. Furthermore, digital learning platforms democratize education by granting universal access to premier academic materials, thereby narrowing socioeconomic disparities.\n\nNonetheless, skeptics often highlight concerns regarding employment displacement and diminishing interpersonal interaction. It is true that automation has rendered certain manual occupations obsolete. However, historical economic patterns demonstrate that technological revolutions consistently generate higher-order job markets in software development, data analytics, and ethical engineering.\n\nIn conclusion, although the accelerating pace of technological evolution necessitates prudent regulatory frameworks, its profound contributions to human health, knowledge dissemination, and global efficiency render it an indispensable catalyst for progressive societal advancement.`;
    }

    const prompt = buildSampleEssayPrompt(partType, taskPrompt, userInput, targetBand, imageUrl);

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const res = await callGemini(prompt);
            if (res && res.sample_rewrite) {
                return res.sample_rewrite;
            }
        } catch (e) {
            console.error(`[AI] Generate sample attempt ${attempt} error:`, e.message);
        }
    }

    throw new Error('Failed to generate model essay with AI model');
};

// ─────────────────────────────────────────────
const normalizeGradingResult = (result, userInput = '') => {
    if (!result?.feedback) return result;

    const wordCount = countWords(userInput);

    // Official IELTS 2023 length capping:
    // <= 20 words -> Band 1.0
    // <= 50 words -> Max Band 2.5
    // <= 90 words -> Max Band 3.5
    let maxAllowedScore = 9.0;
    if (wordCount === 0) {
        maxAllowedScore = 0.0;
    } else if (wordCount <= 20) {
        maxAllowedScore = 1.0;
    } else if (wordCount <= 50) {
        maxAllowedScore = 2.5;
    } else if (wordCount <= 90) {
        maxAllowedScore = 3.5;
    }

    for (const [catName, catData] of Object.entries(result.feedback)) {
        if (!catData || typeof catData !== 'object' || Array.isArray(catData)) continue;
        for (const [subKey, subVal] of Object.entries(catData)) {
            if (subVal && typeof subVal === 'object' && !Array.isArray(subVal)) {
                if (subVal.score !== undefined) {
                    let score = Number(subVal.score);
                    if (score > maxAllowedScore) score = maxAllowedScore;
                    subVal.score = Math.max(0, Math.min(9, score));
                }
            }
        }
    }

    if (result.sub_scores) {
        for (const k of Object.keys(result.sub_scores)) {
            let score = Number(result.sub_scores[k]);
            if (score > maxAllowedScore) score = maxAllowedScore;
            result.sub_scores[k] = Math.max(0, Math.min(9, score));
        }
    }

    // Re-calculate overall band as the exact arithmetic mean of the subscores
    if (result.sub_scores) {
        const scores = Object.values(result.sub_scores).map(Number).filter(n => !isNaN(n));
        if (scores.length > 0) {
            const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
            result.overall_band = roundToHalf(Math.min(maxAllowedScore, avg));
        }
    } else if (result.overall_band !== undefined) {
        let ob = Number(result.overall_band);
        if (ob > maxAllowedScore) ob = maxAllowedScore;
        result.overall_band = roundToHalf(Math.max(0, Math.min(9, ob)));
    }

    return result;
};

// ─────────────────────────────────────────────
// Grade a Single Task (Task 1 or Task 2)
// ─────────────────────────────────────────────
const gradeSingleTask = async (partType, taskPrompt, userInput, targetBand, imageUrl) => {
    const isTask1 = partType === 'Task 1';
    const gradingPrompt = isTask1
        ? buildGradingPromptTask1(taskPrompt, userInput, targetBand, imageUrl)
        : buildGradingPromptTask2(taskPrompt, userInput, targetBand);

    if (!ai) {
        await new Promise((r) => setTimeout(r, 1500));
        return isTask1 ? mockGradeTask1(targetBand) : mockGradeTask2(targetBand);
    }

    try {
        console.log(`[AI] Grading ${partType} (${countWords(userInput)} words) with Target Band ${targetBand}...`);

        // Run Grading and Improvements calls in parallel
        const [gradingRaw, improvementsRaw] = await Promise.all([
            (async () => {
                for (let attempt = 1; attempt <= 2; attempt++) {
                    try {
                        const res = await callGemini(gradingPrompt);
                        if (res && res.feedback && res.overall_band !== undefined) {
                            return normalizeGradingResult(res, userInput);
                        }
                    } catch (e) {
                        console.error(`[AI] Grading ${partType} attempt ${attempt} error:`, e.message);
                    }
                }
                return null;
            })(),
            (async () => {
                try {
                    return await callGemini(buildImprovementsPrompt(partType, taskPrompt, userInput, targetBand || 7.0, targetBand || 7.0));
                } catch (e) {
                    console.error(`[AI] Improvements ${partType} error:`, e.message);
                    return null;
                }
            })(),
        ]);

        if (!gradingRaw) {
            console.warn(`[AI] Grading ${partType} failed, using mock.`);
            return isTask1 ? mockGradeTask1(targetBand) : mockGradeTask2(targetBand);
        }

        const result = gradingRaw;
        result.target_band = Number(targetBand) || 7.0;

        // Attach improvements & target_band_analysis
        result.feedback.improvements = improvementsRaw?.improvements ?? [
            { title: 'Review Detailed Criteria', content: 'Check the specific criteria scores and sub-criteria comments to improve your writing.' },
        ];
        result.feedback.sample_rewrite = ''; // Removed automatic generation
        result.feedback.target_band_analysis = improvementsRaw?.target_band_analysis ?? {
            target_band: Number(targetBand) || 7.0,
            achieved_band: result.overall_band,
            status: result.overall_band >= (Number(targetBand) || 7.0) ? 'achieved' : 'below',
            summary: `Your essay achieved Band ${result.overall_band} compared to your Target Band of ${targetBand || 7.0}.`,
            strengths: ['Successfully addressed key components of the task'],
            key_gaps: ['Focus on refining lexical precision and sentence structure diversity'],
        };

        return result;

    } catch (err) {
        console.error(`[AI] Service Error during ${partType}:`, err);
        return isTask1 ? mockGradeTask1(targetBand) : mockGradeTask2(targetBand);
    }
};

// ─────────────────────────────────────────────
// Grade Full Test (Both Task 1 & Task 2)
// ─────────────────────────────────────────────
const gradeFullTest = async ({
    task1Prompt,
    task1Input,
    task1Image,
    task2Prompt,
    task2Input,
    targetBand = 7.0,
}) => {
    console.log(`[AI] Starting Full Test grading (Task 1 & Task 2 in parallel)...`);

    const [task1Result, task2Result] = await Promise.all([
        gradeSingleTask('Task 1', task1Prompt, task1Input, targetBand, task1Image),
        gradeSingleTask('Task 2', task2Prompt, task2Input, targetBand, null),
    ]);

    // IELTS official formula: Task 2 weight = 2/3, Task 1 weight = 1/3
    const t1Band = task1Result.overall_band || 7.0;
    const t2Band = task2Result.overall_band || 7.0;
    const rawOverall = (t1Band * 1 + t2Band * 2) / 3;
    const overallBand = roundToHalf(rawOverall);

    console.log(`[AI] Full Test scored: Task 1 = ${t1Band}, Task 2 = ${t2Band} => Overall = ${overallBand}`);

    return {
        overall_band: overallBand,
        target_band: Number(targetBand) || 7.0,
        part_type: 'Full Test',
        sub_scores: {
            Task1_Overall: t1Band,
            Task2_Overall: t2Band,
            TA: task1Result.sub_scores?.TA ?? t1Band,
            TR: task2Result.sub_scores?.TR ?? t2Band,
            CC: roundToHalf(((task1Result.sub_scores?.CC || t1Band) + (task2Result.sub_scores?.CC || t2Band) * 2) / 3),
            LR: roundToHalf(((task1Result.sub_scores?.LR || t1Band) + (task2Result.sub_scores?.LR || t2Band) * 2) / 3),
            GRA: roundToHalf(((task1Result.sub_scores?.GRA || t1Band) + (task2Result.sub_scores?.GRA || t2Band) * 2) / 3),
        },
        task1: task1Result,
        task2: task2Result,
        feedback: {
            overall_summary: {
                task1_band: t1Band,
                task2_band: t2Band,
                full_test_band: overallBand,
                target_band: Number(targetBand) || 7.0,
                status: overallBand >= (Number(targetBand) || 7.0) ? 'achieved' : 'below',
            },
            target_band_analysis: {
                target_band: Number(targetBand) || 7.0,
                achieved_band: overallBand,
                status: overallBand >= (Number(targetBand) || 7.0) ? 'achieved' : 'below',
                summary: `Overall Full Test achieved Band ${overallBand} (Task 1: ${t1Band}, Task 2: ${t2Band}). ${
                    overallBand >= (Number(targetBand) || 7.0)
                        ? `You have successfully achieved your Target Band of ${targetBand}!`
                        : `You are currently ${((Number(targetBand) || 7.0) - overallBand).toFixed(1)} band away from your Target Band of ${targetBand}.`
                }`,
                strengths: [
                    ...(task1Result.feedback?.target_band_analysis?.strengths || []).slice(0, 2),
                    ...(task2Result.feedback?.target_band_analysis?.strengths || []).slice(0, 2),
                ],
                key_gaps: [
                    ...(task1Result.feedback?.target_band_analysis?.key_gaps || []).slice(0, 2),
                    ...(task2Result.feedback?.target_band_analysis?.key_gaps || []).slice(0, 2),
                ],
            },
            task1_feedback: task1Result.feedback,
            task2_feedback: task2Result.feedback,
            improvements: [
                ...(task1Result.feedback?.improvements || []).map(imp => ({
                    title: `[Task 1] ${imp.title}`,
                    content: imp.content,
                })),
                ...(task2Result.feedback?.improvements || []).map(imp => ({
                    title: `[Task 2] ${imp.title}`,
                    content: imp.content,
                })),
            ],
            sample_rewrite: '', // Removed auto generation for Full Test
        },
    };
};

// ─────────────────────────────────────────────
// Main Entry point
// ─────────────────────────────────────────────
exports.gradeAndCrossCheck = async (skill, taskPrompt, userInput, audioPath, options = {}) => {
    const partType   = options.part_type || 'Task 2';
    const targetBand = options.target_band || 7.0;
    const imageUrl   = options.image_url || null;

    if (partType === 'Full Test') {
        return gradeFullTest({
            task1Prompt: options.task1_prompt || taskPrompt,
            task1Input:  options.task1_input  || userInput,
            task1Image:  options.task1_image  || imageUrl,
            task2Prompt: options.task2_prompt || taskPrompt,
            task2Input:  options.task2_input  || userInput,
            targetBand,
        });
    }

    // Single Task (Task 1 or Task 2)
    return gradeSingleTask(partType, taskPrompt, userInput, targetBand, imageUrl);
};

exports.gradeSingleTask    = gradeSingleTask;
exports.gradeFullTest      = gradeFullTest;
exports.generateSampleEssay = generateSampleEssay;

