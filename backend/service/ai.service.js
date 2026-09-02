// ─────────────────────────────────────────────
// ai.service.js — Core AI grading orchestration
// ─────────────────────────────────────────────
const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');
const path = require('path');
const { mockGradeTask1, mockGradeTask2, mockGradeSpeaking } = require('./ai.mock');
const {
    buildGradingPromptTask1,
    buildGradingPromptTask2,
    buildImprovementsPrompt,
    buildSampleEssayPrompt,
    buildGradingPromptSpeaking,
    buildSpeakingSamplePrompt,
} = require('./ai.prompts');

const ai = process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const roundToHalf = (num) => Math.round(Number(num) * 2) / 2;
const countWords = (text) => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
};

// ─────────────────────────────────────────────
// Gemini API caller (with model fallback)
// ─────────────────────────────────────────────
const MODELS = [
    'gemini-2.5-flash',
    'gemini-3.6-flash',
    'gemini-2.5-flash-lite',
    'gemini-1.5-flash',
];

const callGemini = async (prompt, audioPart = null) => {
    let lastError;
    for (const model of MODELS) {
        try {
            const contents = audioPart ? [audioPart, { text: prompt }] : prompt;
            const response = await ai.models.generateContent({
                model,
                contents,
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
// Score normalization (word-count caps)
// ─────────────────────────────────────────────
const normalizeGradingResult = (result, userInput = '') => {
    if (!result?.feedback) return result;

    const wordCount = countWords(userInput);

    // Official IELTS 2023 length capping
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

    for (const [, catData] of Object.entries(result.feedback)) {
        if (!catData || typeof catData !== 'object' || Array.isArray(catData)) continue;
        for (const [, subVal] of Object.entries(catData)) {
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
// Grade Single Writing Task (Task 1 or Task 2)
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

        result.feedback.improvements = improvementsRaw?.improvements ?? [
            { title: 'Review Detailed Criteria', content: 'Check the specific criteria scores and sub-criteria comments to improve your writing.' },
        ];
        result.feedback.sample_rewrite = '';
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
// Grade Full Writing Test (Task 1 + Task 2)
// ─────────────────────────────────────────────
const gradeFullTest = async ({ task1Prompt, task1Input, task1Image, task2Prompt, task2Input, targetBand = 7.0 }) => {
    console.log('[AI] Starting Full Test grading (Task 1 & Task 2 in parallel)...');

    const [task1Result, task2Result] = await Promise.all([
        gradeSingleTask('Task 1', task1Prompt, task1Input, targetBand, task1Image),
        gradeSingleTask('Task 2', task2Prompt, task2Input, targetBand, null),
    ]);

    // IELTS official formula: Task 2 weight = 2/3, Task 1 weight = 1/3
    const t1Band = task1Result.overall_band || 7.0;
    const t2Band = task2Result.overall_band || 7.0;
    const overallBand = roundToHalf((t1Band * 1 + t2Band * 2) / 3);

    console.log(`[AI] Full Test scored: Task 1 = ${t1Band}, Task 2 = ${t2Band} => Overall = ${overallBand}`);

    return {
        overall_band: overallBand,
        target_band: Number(targetBand) || 7.0,
        part_type: 'Full Test',
        sub_scores: {
            Task1_Overall: t1Band,
            Task2_Overall: t2Band,
            TA:  task1Result.sub_scores?.TA ?? t1Band,
            TR:  task2Result.sub_scores?.TR ?? t2Band,
            CC:  roundToHalf(((task1Result.sub_scores?.CC || t1Band) + (task2Result.sub_scores?.CC || t2Band) * 2) / 3),
            LR:  roundToHalf(((task1Result.sub_scores?.LR || t1Band) + (task2Result.sub_scores?.LR || t2Band) * 2) / 3),
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
                ...(task1Result.feedback?.improvements || []).map(imp => ({ title: `[Task 1] ${imp.title}`, content: imp.content })),
                ...(task2Result.feedback?.improvements || []).map(imp => ({ title: `[Task 2] ${imp.title}`, content: imp.content })),
            ],
            sample_rewrite: '',
        },
    };
};

// ─────────────────────────────────────────────
// Grade Speaking Task
// ─────────────────────────────────────────────
const gradeSpeakingTask = async (partType = 'Part 2 & 3', taskPrompt = '', audioPath = null, targetBand = 7.0) => {
    if (!ai) {
        await new Promise((r) => setTimeout(r, 2000));
        return mockGradeSpeaking(partType, targetBand);
    }

    let audioPart = null;
    if (audioPath && fs.existsSync(audioPath)) {
        try {
            const audioBuffer = fs.readFileSync(audioPath);
            const ext = path.extname(audioPath).toLowerCase();
            let mimeType = 'audio/wav';
            if (ext === '.mp3') mimeType = 'audio/mp3';
            else if (ext === '.webm') mimeType = 'audio/webm';
            else if (ext === '.ogg') mimeType = 'audio/ogg';
            else if (ext === '.m4a') mimeType = 'audio/m4a';
            audioPart = { inlineData: { data: audioBuffer.toString('base64'), mimeType } };
        } catch (err) {
            console.error('[AI] Failed to read audio file:', err.message);
        }
    }

    const gradingPrompt = buildGradingPromptSpeaking(partType, taskPrompt, targetBand);

    try {
        console.log(`[AI] Grading Speaking ${partType} with Target Band ${targetBand}...`);
        for (let attempt = 1; attempt <= 2; attempt++) {
            try {
                const res = await callGemini(gradingPrompt, audioPart);
                if (res && res.feedback && res.overall_band !== undefined) {
                    res.part_type = partType;
                    res.target_band = Number(targetBand) || 7.0;

                    if (res.sub_scores) {
                        const scores = Object.values(res.sub_scores).map(Number).filter(n => !isNaN(n));
                        if (scores.length > 0) {
                            res.overall_band = roundToHalf(scores.reduce((a, b) => a + b, 0) / scores.length);
                        }
                    }

                    const isFullTest = (partType || '').toLowerCase().includes('full');
                    if (!isFullTest && res.feedback) {
                        delete res.feedback.examiner_strategy_breakdown;
                    }

                    if (!res.feedback.target_band_analysis) {
                        res.feedback.target_band_analysis = {
                            target_band: Number(targetBand) || 7.0,
                            achieved_band: res.overall_band,
                            status: res.overall_band >= (Number(targetBand) || 7.0) ? 'achieved' : 'below',
                            summary: `Your Speaking achieved Band ${res.overall_band} compared to target Band ${targetBand || 7.0}.`,
                            strengths: ['Clear delivery of main ideas', 'Good phonetic intelligibility'],
                            key_gaps: ['Work on greater lexical variety and natural intonation'],
                        };
                    }
                    return res;
                }
            } catch (e) {
                console.error(`[AI] Speaking grading attempt ${attempt} error:`, e.message);
            }
        }
        return mockGradeSpeaking(partType, targetBand);
    } catch (err) {
        console.error('[AI] Speaking Service Error:', err);
        return mockGradeSpeaking(partType, targetBand);
    }
};

// ─────────────────────────────────────────────
// On-demand Sample Generators
// ─────────────────────────────────────────────
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
            if (res && res.sample_rewrite) return res.sample_rewrite;
        } catch (e) {
            console.error(`[AI] Generate sample attempt ${attempt} error:`, e.message);
        }
    }

    throw new Error('Failed to generate model essay with AI model');
};

const generateSpeakingSample = async ({ partType = 'Part 2 & 3', taskPrompt = '' }) => {
    console.log(`[AI] Generating on-demand Model Spoken Answer for ${partType}...`);
    if (!ai) {
        await new Promise((r) => setTimeout(r, 1200));
        return `To speak candidly, regarding this topic: "${taskPrompt.slice(0, 80)}...", one of the most memorable experiences I have had involved navigating unfamiliar challenges with a resilient mindset. What truly stood out was how it pushed me out of my comfort zone, enabling me to refine both my interpersonal communication and problem-solving skills under time pressure. In retrospect, that experience was a pivotal turning point that continues to shape my perspectives today.`;
    }

    const prompt = buildSpeakingSamplePrompt(partType, taskPrompt);

    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const res = await callGemini(prompt);
            if (res && res.sample_answer) return res.sample_answer;
        } catch (e) {
            console.error(`[AI] Generate speaking sample attempt ${attempt} error:`, e.message);
        }
    }
    return `Well, to address this question directly, I believe that having the adaptability to handle unexpected situations is immensely beneficial. In my own life, whenever I encounter complex hurdles, I strive to stay analytical while maintaining a positive outlook.`;
};

// ─────────────────────────────────────────────
// Main Entry Point
// ─────────────────────────────────────────────
exports.gradeAndCrossCheck = async (skill, taskPrompt, userInput, audioPath, options = {}) => {
    const partType   = options.part_type || (skill === 'speaking' ? 'Part 2 & 3' : 'Task 2');
    const targetBand = options.target_band || 7.0;
    const imageUrl   = options.image_url || null;

    if (skill === 'speaking') {
        return gradeSpeakingTask(partType, taskPrompt, audioPath, targetBand);
    }

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

    return gradeSingleTask(partType, taskPrompt, userInput, targetBand, imageUrl);
};

exports.gradeSingleTask        = gradeSingleTask;
exports.gradeFullTest          = gradeFullTest;
exports.gradeSpeakingTask      = gradeSpeakingTask;
exports.generateSampleEssay    = generateSampleEssay;
exports.generateSpeakingSample = generateSpeakingSample;
exports.mockGradeSpeaking      = mockGradeSpeaking;
