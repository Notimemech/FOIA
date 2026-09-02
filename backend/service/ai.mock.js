// ─────────────────────────────────────────────
// ai.mock.js — Mock grade data for fallback (no AI key)
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

const mockGradeSpeaking = (partType = 'Part 2 & 3', targetBand = 7.0) => {
    const isFullTest = (partType || '').toLowerCase().includes('full');
    return {
        overall_band: 7.0,
        target_band: Number(targetBand) || 7.0,
        part_type: partType,
        sub_scores: { FC: 7.0, LR: 7.0, PR: 7.0, GRA: 7.0 },
        feedback: {
            'Fluency & Coherence': {
                'Speech Rate & Continuity':       { score: 7.0, comment: 'Maintains a steady speech rate with minimal unnatural pauses during long turns.' },
                'Hesitation & Self-Correction':   { score: 7.0, comment: 'Occasional hesitation occurs primarily for content planning rather than searching for basic words.' },
                'Use of Cohesive Devices':        { score: 7.0, comment: 'Uses a flexible range of discourse markers (e.g., "From my perspective", "As a consequence") naturally.' },
                'Topic Development & Coherence':  { score: 7.0, comment: 'Answers are fully developed with relevant personal insights and extended logical flow.' }
            },
            'Lexical Resource': {
                'Vocabulary Range & Flexibility':         { score: 7.0, comment: 'Demonstrates a wide variety of topic-specific vocabulary and expressions.' },
                'Precision & Appropriacy of Word Choice': { score: 7.0, comment: 'Uses words accurately with clear awareness of context and formal register.' },
                'Use of Less Common & Idiomatic Language':{ score: 7.0, comment: 'Incorporates natural idiomatic phrases (e.g., "broaden my horizons", "once in a blue moon") effectively.' },
                'Paraphrasing Skill':                     { score: 7.0, comment: 'Paraphrases question prompts smoothly without relying on direct repetition.' }
            },
            'Pronunciation': {
                'Clarity of Individual Sounds':   { score: 7.0, comment: 'Consonants and vowel sounds are articulated clearly with minimal accent interference.' },
                'Rhythm, Stress & Intonation':    { score: 7.0, comment: 'Effective use of sentence stress and rising/falling intonation to convey subtle nuances.' },
                'Connected Speech & Chunking':    { score: 7.0, comment: 'Demonstrates natural linking and appropriate pauses at phrase boundaries.' },
                'Overall Intelligibility':        { score: 7.5, comment: 'Effortlessly understood throughout the speaking assessment.' }
            },
            'Grammatical Range & Accuracy': {
                'Grammatical Accuracy':           { score: 7.0, comment: 'Produces a strong balance of simple and complex sentence forms with frequent error-free utterances.' }
            },
            transcript: 'Well, to be completely honest, travelling to coastal areas has always been my greatest passion. Whenever I get some time off, I try to explore new destinations because it really helps me recharge my batteries and gain fresh perspectives on life.',
            questions_transcripts: [
                { question_number: 1, transcript: 'Well, my hometown is Da Nang, a dynamic coastal city in central Vietnam known for its scenic bridges and pristine beaches.' },
                { question_number: 2, transcript: 'What I appreciate most is the welcoming atmosphere and the fresh seafood, along with the relatively low levels of traffic congestion.' },
                { question_number: 3, transcript: 'If I could make one change, I would advocate for more green urban parks and improved public cycling infrastructure.' },
                { question_number: 4, transcript: 'Without a doubt, I foresee myself living there long term because of the unparalleled quality of life and balanced pace of living.' },
                { question_number: 5, transcript: 'Over the last few years, it has transformed remarkably into a modern technological and tourism hub with impressive high-rise developments.' }
            ],
            target_band_analysis: {
                target_band: Number(targetBand) || 7.0,
                achieved_band: 7.0,
                status: Number(targetBand) <= 7.0 ? 'achieved' : 'below',
                summary: `Your Speaking performance achieved Band 7.0, ${Number(targetBand) <= 7.0 ? 'successfully meeting' : 'working towards'} your Target Band of ${targetBand}.`,
                strengths: [
                    'Natural delivery with coherent topic extension and clear discourse markers',
                    'Strong phonetic clarity with appropriate word stress and intonation'
                ],
                key_gaps: [
                    'Incorporate more varied idiomatic phrases in complex abstract discussions',
                    'Minimize occasional mid-clause hesitations when formulating complex viewpoints'
                ]
            },
            ...(isFullTest ? {
                examiner_strategy_breakdown: {
                    part1_ceiling_band: 7.5,
                    part1_ceiling_rationale: 'Part 1 demonstrated fluent responses to familiar topics with strong lexical breadth, setting the maximum potential ceiling at Band 7.5.',
                    part2_floor_band: 6.5,
                    part2_floor_rationale: 'Part 2 sustained 2-minute monologue showed occasional pauses when structuring extended thoughts, establishing a solid baseline floor at Band 6.5.',
                    part3_calibration_band: 7.0,
                    part3_calibration_rationale: 'Part 3 abstract discussion handled complex social perspectives competently with moderate idiomatic range, locking in the exact calibrated score at Band 7.0.'
                }
            } : {}),
            improvements: [
                { title: 'Enhance Idiomatic Phrasing', content: 'Incorporate higher-level collocations and idioms naturally (e.g. use "spark my curiosity" or "a game changer" where appropriate).' },
                { title: 'Refine Complex Sentence Openers', content: 'Use advanced conditional and concession structures such as "Had I not experienced that...", "Notwithstanding the fact that..." to push Grammar score to Band 8.0+.' }
            ],
            sample_answer: 'To speak candidly, one of the most memorable journeys I have ever embarked upon was a road trip across the central highlands. What made it particularly extraordinary was not merely the breathtaking scenery, but the immersive cultural encounters with local artisans. Looking back, that voyage genuinely broadened my perspectives and fostered an enduring appreciation for sustainable travel.'
        }
    };
};

module.exports = { mockGradeTask1, mockGradeTask2, mockGradeSpeaking };
