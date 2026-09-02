// ─────────────────────────────────────────────
// ai.prompts.js — AI prompt builder functions
// ─────────────────────────────────────────────
const rubricService = require('./rubric.service');

const countWords = (text) => {
    if (!text || typeof text !== 'string') return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
};

// ─────────────────────────────────────────────
// Writing Prompts
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

const buildSampleEssayPrompt = (partType, taskPrompt, userInput, targetBand, imageUrl) => {
    const isTask1 = partType === 'Task 1';
    const imageInfo = imageUrl ? `\nIMAGE/CHART REFERENCE: The chart/diagram provided is: ${imageUrl}` : '';

    return `You are a certified senior IELTS Master Examiner and English author.
Your task is to write a pristine, Band 8.5 to 9.0 model ${isTask1 ? 'report' : 'essay'} for the following IELTS Writing ${partType} prompt.

TASK PROMPT:
${taskPrompt}${imageInfo}

${userInput ? `CANDIDATE'S ORIGINAL WRITING (FOR TOPIC CONTEXT & ARGUMENT FLOW):\n${userInput}` : ''}

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

// ─────────────────────────────────────────────
// Speaking Prompts
// ─────────────────────────────────────────────
const buildGradingPromptSpeaking = (partType, taskPrompt, targetBand) => {
    const contextBlock = rubricService.buildContextBlock('speaking', partType);
    const isFullTest = (partType || '').toLowerCase().includes('full');

    const strategyInstructions = isFullTest ? `
================================================================================
MANDATORY EXAMINER ASSESSMENT STRATEGY (THREE-STAGE PROGRESSIVE TRIANGULATION):
================================================================================
When evaluating the candidate's speech across the full test, you MUST apply the official IELTS Examiner progressive triangulation strategy:
1. Part 1 (Maximum Potential Ceiling Band):
   - Assess candidate fluency and comfortable agility in familiar everyday contexts to establish their MAXIMUM CEILING BAND.
   - Question: "What is the peak band this candidate could theoretically attain based on their best performance in simple settings?"
   - Establishes the UPPER BOUND (Band Ceiling).
2. Part 2 (Minimum Baseline Floor Band):
   - Assess the 2-minute uninterrupted monologue (Long Turn) to identify breakdown points, hesitation density, grammatical vulnerabilities, and stamina limits.
   - Question: "When required to sustain 2 full minutes of discourse independently without prompts, what is the absolute lowest floor band that the candidate does not fall below?"
   - Establishes the LOWER BOUND (Band Floor).
3. Part 3 (Exact Calibrated Final Band):
   - Assess in-depth abstract discussion to probe linguistic depth and lock in the EXACT FINAL BAND SCORE.
   - The calibrated final score for each criterion and overall band MUST land decisively within the interval:
     Part 2 Floor <= Final Band Score <= Part 1 Ceiling.
` : `
================================================================================
DIRECT INDIVIDUAL SECTION ASSESSMENT:
================================================================================
This is a single-section speaking evaluation for ${partType}.
Do NOT use three-stage progressive triangulation. Directly and immediately evaluate the candidate's speech against the official Band ${targetBand || '7.0'} descriptors from the official IELTS Speaking Rubric above for this section only.
`;

    const strategyJsonSchema = isFullTest ? `
    "examiner_strategy_breakdown": {
      "part1_ceiling_band": 0.0,
      "part1_ceiling_rationale": "<How Part 1 established the candidate's upper ceiling limit>",
      "part2_floor_band": 0.0,
      "part2_floor_rationale": "<How Part 2 monologue revealed the minimum floor limit>",
      "part3_calibration_band": 0.0,
      "part3_calibration_rationale": "<How Part 3 abstract discussion pinpointed the exact band between Floor and Ceiling>"
    },` : '';

    return `${contextBlock}
You are a certified senior IELTS Speaking examiner. Your task is to evaluate the candidate's IELTS Speaking recording for ${partType}.

TASK PROMPT / QUESTIONS:
${taskPrompt}

TARGET BAND BENCHMARK: ${targetBand || '7.0'}
Compare the candidate's speech directly against the official Band ${targetBand || '7.0'} descriptors from the official IELTS Speaking Rubric above.
${strategyInstructions}
Evaluate across the 4 official IELTS Speaking criteria and the exact sub-criteria below:
1. Fluency & Coherence
   - Speech Rate & Continuity
   - Hesitation & Self-Correction
   - Use of Cohesive Devices
   - Topic Development & Coherence
2. Lexical Resource
   - Vocabulary Range & Flexibility
   - Precision & Appropriacy of Word Choice
   - Use of Less Common & Idiomatic Language
   - Paraphrasing Skill
3. Pronunciation
   - Clarity of Individual Sounds
   - Rhythm, Stress & Intonation
   - Connected Speech & Chunking
   - Overall Intelligibility
4. Grammatical Range & Accuracy
   - Grammatical Accuracy

IMPORTANT: Transcribe the candidate's spoken response for EACH INDIVIDUAL QUESTION in the "questions_transcripts" array.

Return ONLY strictly valid JSON matching this schema:
{
  "overall_band": 0.0,
  "sub_scores": { "FC": 0.0, "LR": 0.0, "PR": 0.0, "GRA": 0.0 },
  "feedback": {
    "transcript": "<Full combined transcript of what the candidate said in English>",
    "questions_transcripts": [
      {
        "question_number": 1,
        "transcript": "<Exact spoken transcript for Question 1 in English>"
      },
      {
        "question_number": 2,
        "transcript": "<Exact spoken transcript for Question 2 in English>"
      }
    ],${strategyJsonSchema}
    "Fluency & Coherence": {
      "Speech Rate & Continuity":       { "score": 0.0, "comment": "<specific evaluation quoting spoken phrases>" },
      "Hesitation & Self-Correction":   { "score": 0.0, "comment": "<specific evaluation>" },
      "Use of Cohesive Devices":        { "score": 0.0, "comment": "<specific evaluation>" },
      "Topic Development & Coherence":  { "score": 0.0, "comment": "<specific evaluation>" }
    },
    "Lexical Resource": {
      "Vocabulary Range & Flexibility":         { "score": 0.0, "comment": "<specific evaluation>" },
      "Precision & Appropriacy of Word Choice": { "score": 0.0, "comment": "<specific evaluation>" },
      "Use of Less Common & Idiomatic Language":{ "score": 0.0, "comment": "<specific evaluation>" },
      "Paraphrasing Skill":                     { "score": 0.0, "comment": "<specific evaluation>" }
    },
    "Pronunciation": {
      "Clarity of Individual Sounds":   { "score": 0.0, "comment": "<specific evaluation>" },
      "Rhythm, Stress & Intonation":    { "score": 0.0, "comment": "<specific evaluation>" },
      "Connected Speech & Chunking":    { "score": 0.0, "comment": "<specific evaluation>" },
      "Overall Intelligibility":        { "score": 0.0, "comment": "<specific evaluation>" }
    },
    "Grammatical Range & Accuracy": {
      "Grammatical Accuracy":           { "score": 0.0, "comment": "<specific evaluation>" }
    },
    "target_band_analysis": {
      "target_band": ${Number(targetBand) || 7.0},
      "achieved_band": 0.0,
      "status": "achieved | below",
      "summary": "<Comparison of achieved band vs target band>",
      "strengths": ["<strength 1>", "<strength 2>"],
      "key_gaps": ["<gap 1>", "<gap 2>"]
    },
    "improvements": [
      { "title": "<Actionable Improvement Title>", "content": "<Detailed advice with concrete vocabulary/collocations/grammar structures>" },
      { "title": "<Actionable Improvement Title>", "content": "<Detailed advice>" }
    ],
    "sample_answer": "<Band 8.5+ model spoken answer in natural spoken English answering the prompt>"
  }
}

STRICT EXAMINER CALIBRATION & GRADING RULES (PREVENT LENIENT SCORING):
1. Fluency & Coherence:
   - Strictly audit speech rate, speech continuity, mid-clause pauses, false starts, backtracking, and word-searching hesitations.
   - If the candidate frequently hesitates or searches for basic vocabulary, Fluency MUST NOT exceed Band 5.5 - 6.0.
   - Band 7.0+ requires effortless speech flow, natural discourse markers, and smooth topic extension without noticeable strain.
2. Lexical Resource:
   - Penalize over-reliance on basic/generic vocabulary (e.g. "nice", "good", "important", "very", "things").
   - Verify collocation accuracy, style/register, and ability to paraphrase without awkwardness.
   - Band 7.0+ requires accurate use of less common collocations and idiomatic expressions with stylistic awareness.
3. Grammatical Range & Accuracy:
   - Strictly measure grammatical error density (tenses, subject-verb agreement, singular/plural, articles, prepositions).
   - If systematic basic grammatical errors occur throughout, GRA MUST be capped at Band 5.0 - 5.5.
   - Band 7.0+ requires a variety of complex structures with frequent error-free spoken sentences.
4. Pronunciation:
   - Audit phonemic clarity (vowels/consonants), word stress, rhythm/stress-timing, intonation contour, and connected speech/linking.
   - If the speaker is monotone, drops final consonants, or requires listener effort to understand, Pronunciation MUST NOT exceed Band 5.5 - 6.0.
   - Band 7.0+ requires expressive intonation, natural rhythm, clear chunking, and effortless intelligibility throughout.
5. Overall Calibration:
   - Strictly adhere to the IELTS Speaking Key Assessment Criteria and Band Descriptors above.
   - Do NOT inflate scores or grade leniently. Most intermediate spoken answers genuinely fall in the Band 5.0 - 6.0 range.
   - overall_band = arithmetic average of FC, LR, PR, GRA rounded to the nearest 0.5 (e.g. 6.25 -> 6.5, 6.125 -> 6.0).
   - Every score must be between 0.0 and 9.0 in 0.5 increments.
   - If audio is silent, blank, or completely uninterpretable, score Band 0.0.
   - All evaluation comments must cite concrete spoken phrases and phonetic evidence in English.
   - Do NOT use markdown inside JSON string values.`;
};

const buildSpeakingSamplePrompt = (partType, taskPrompt) => `You are a native English speaker and former IELTS examiner. Generate a Band 8.5–9.0 model spoken answer for the following IELTS Speaking prompt.
PROMPT:
${taskPrompt}
PART TYPE:
${partType}

REQUIREMENTS:
- Natural spoken English register (use appropriate discourse markers like "Well,", "To be perfectly honest,", "Looking back,", "Having said that,").
- Rich idioms and natural academic collocations.
- Diverse grammatical range (conditionals, passive structures, relative clauses).
- Length appropriate for ${partType === 'Part 1' ? '1.5 - 2 minutes across questions' : '2 full minutes of speaking'}.

Output ONLY JSON:
{
  "sample_answer": "<Full text of the model spoken answer in English with natural paragraph breaks>"
}`;

module.exports = {
    buildGradingPromptTask1,
    buildGradingPromptTask2,
    buildImprovementsPrompt,
    buildSampleEssayPrompt,
    buildGradingPromptSpeaking,
    buildSpeakingSamplePrompt,
};
