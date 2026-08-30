/**
 * rubric.service.js
 *
 * Loads IELTS writing rubrics from structured JSON and formats them into
 * clear context blocks to prepend to AI grading prompts.
 *
 * Rubric sources:
 * - db/access/writing_rubic_task_1.json (Task 1: Task Achievement, CC, LR, GRA)
 * - db/access/writing_rubic_task_2.json (Task 2: Task Response, CC, LR, GRA)
 * - db/access/writing_rubic.json (Fallback)
 */

const fs   = require('fs');
const path = require('path');

const RUBRIC_TASK1_PATH          = path.join(__dirname, '../../db/access/writing_rubic_task_1.json');
const RUBRIC_TASK2_PATH          = path.join(__dirname, '../../db/access/writing_rubic_task_2.json');
const RUBRIC_FALLBACK            = path.join(__dirname, '../../db/access/writing_rubic.json');
const RUBRIC_SPEAKING_PATH       = path.join(__dirname, '../../db/access/speaking_rubic.json');
const SPEAKING_KEY_ASSESSMENT_PATH = path.join(__dirname, '../../db/access/speaking_key_assessment.md');
const SAMPLES_PATH               = path.join(__dirname, '../../db/access/writing_samples.json');

const WRITING_CRITERION_LABELS = {
    task_achievement:              'Task Achievement',
    task_response:                 'Task Response',
    coherence_and_cohesion:        'Coherence & Cohesion',
    lexical_resource:              'Lexical Resource',
    grammatical_range_and_accuracy:'Grammatical Range & Accuracy',
};

const SPEAKING_CRITERION_LABELS = {
    fluency_and_coherence:         'Fluency & Coherence',
    lexical_resource:              'Lexical Resource',
    pronunciation:                 'Pronunciation',
    grammatical_range_and_accuracy:'Grammatical Range & Accuracy',
};

// ─── In-memory state ───
let _task1Context = null;
let _task2Context = null;
let _speakingContext = null;
let _speakingKeyAssessmentContext = null;
let _samplesContext = null;

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatWritingRubric(rubricData, minBand = 0) {
    const bands = (rubricData.bands || [])
        .filter(b => b.band >= minBand)
        .sort((a, b) => b.band - a.band); // descending: 9, 8, 7, 6, 5, 4, 3, 2, 1, 0

    if (bands.length === 0) return '';

    const lines = [];
    lines.push(`IELTS ${rubricData.document_title || 'Writing Band Descriptors'} (Band ${minBand}–9)`);
    lines.push('─'.repeat(60));

    for (const band of bands) {
        lines.push(`\nBAND ${band.band}`);
        lines.push('─'.repeat(30));

        for (const [key, label] of Object.entries(WRITING_CRITERION_LABELS)) {
            if (!band[key]) continue;
            lines.push(`\n▸ ${label}:`);
            for (const point of band[key]) {
                lines.push(`  • ${point}`);
            }
        }
    }

    return lines.join('\n');
}

function formatSpeakingRubric(rubricData, minBand = 0) {
    const bands = (rubricData.bands || [])
        .filter(b => typeof b.band === 'number' && b.band >= minBand)
        .sort((a, b) => b.band - a.band);

    if (bands.length === 0) return '';

    const lines = [];
    lines.push(`IELTS ${rubricData.document_title || 'Speaking Band Descriptors'} (Band ${minBand}–9)`);
    lines.push('─'.repeat(60));

    for (const band of bands) {
        lines.push(`\nBAND ${band.band}`);
        lines.push('─'.repeat(30));

        for (const [key, label] of Object.entries(SPEAKING_CRITERION_LABELS)) {
            if (!band[key]) continue;
            lines.push(`\n▸ ${label}:`);
            if (Array.isArray(band[key])) {
                for (const point of band[key]) {
                    lines.push(`  • ${point}`);
                }
            } else if (typeof band[key] === 'string') {
                lines.push(`  • ${band[key]}`);
            }
        }
    }

    return lines.join('\n');
}

function formatSamples(samplesData, minBand = 5) {
    const samples = (samplesData?.samples || [])
        .filter(s => s.band >= minBand)
        .sort((a, b) => b.band - a.band);

    if (samples.length === 0) return '';

    const lines = [];
    lines.push(`\nSAMPLE ESSAYS BY BAND (Band ${minBand}–9 reference)`);
    lines.push('─'.repeat(60));

    for (const s of samples) {
        lines.push(`\n[Band ${s.band} Sample]`);
        const text = (s.essay || '').substring(0, 1000);
        lines.push(text + (s.essay?.length > 1000 ? '\n...[truncated]' : ''));
    }

    return lines.join('\n');
}

// ─── Public API ────────────────────────────────────────────────────────────

exports.initRubrics = () => {
    // 1. Load Samples if present
    if (fs.existsSync(SAMPLES_PATH)) {
        try {
            const samplesData = JSON.parse(fs.readFileSync(SAMPLES_PATH, 'utf-8'));
            _samplesContext = formatSamples(samplesData, 5);
            console.log('[Rubric] Sample essays loaded');
        } catch (e) {
            console.warn('[Rubric] Failed to parse samples:', e.message);
        }
    }

    // 2. Load Task 1 Rubric
    const task1Path = fs.existsSync(RUBRIC_TASK1_PATH) ? RUBRIC_TASK1_PATH : RUBRIC_FALLBACK;
    if (fs.existsSync(task1Path)) {
        try {
            const task1Data = JSON.parse(fs.readFileSync(task1Path, 'utf-8'));
            _task1Context = formatWritingRubric(task1Data, 0);
            console.log(`[Rubric] Task 1 context ready (${_task1Context.length.toLocaleString()} chars, full Band 0-9)`);
        } catch (e) {
            console.error('[Rubric] Failed to load Task 1 rubric:', e.message);
        }
    }

    // 3. Load Task 2 Rubric
    const task2Path = fs.existsSync(RUBRIC_TASK2_PATH) ? RUBRIC_TASK2_PATH : RUBRIC_FALLBACK;
    if (fs.existsSync(task2Path)) {
        try {
            const task2Data = JSON.parse(fs.readFileSync(task2Path, 'utf-8'));
            _task2Context = formatWritingRubric(task2Data, 0);
            console.log(`[Rubric] Task 2 context ready (${_task2Context.length.toLocaleString()} chars, full Band 0-9)`);
        } catch (e) {
            console.error('[Rubric] Failed to load Task 2 rubric:', e.message);
        }
    }

    // 4. Load Speaking Rubric & Key Assessment Criteria
    if (fs.existsSync(SPEAKING_KEY_ASSESSMENT_PATH)) {
        try {
            _speakingKeyAssessmentContext = fs.readFileSync(SPEAKING_KEY_ASSESSMENT_PATH, 'utf-8');
            console.log(`[Rubric] Speaking key assessment criteria ready (${_speakingKeyAssessmentContext.length.toLocaleString()} chars)`);
        } catch (e) {
            console.error('[Rubric] Failed to load Speaking key assessment criteria:', e.message);
        }
    }

    if (fs.existsSync(RUBRIC_SPEAKING_PATH)) {
        try {
            const speakingData = JSON.parse(fs.readFileSync(RUBRIC_SPEAKING_PATH, 'utf-8'));
            _speakingContext = formatSpeakingRubric(speakingData, 0);
            console.log(`[Rubric] Speaking context ready (${_speakingContext.length.toLocaleString()} chars, full Band 0-9)`);
        } catch (e) {
            console.error('[Rubric] Failed to load Speaking rubric:', e.message);
        }
    }
};

/**
 * Build the context block to prepend to an AI prompt.
 * @param {string} skill - 'writing' | 'speaking'
 * @param {string} partType - 'Task 1' | 'Task 2' | 'Part 1' | 'Part 2 & 3' | 'Part 2' | 'Part 3' | 'Full Test'
 */
exports.buildContextBlock = (skill, partType = 'Task 2') => {
    if (skill === 'speaking') {
        const blocks = [];
        
        if (_speakingKeyAssessmentContext) {
            blocks.push('='.repeat(60));
            blocks.push('IELTS SPEAKING KEY ASSESSMENT CRITERIA & INDICATORS — MANDATORY REFERENCE');
            blocks.push('='.repeat(60));
            blocks.push(_speakingKeyAssessmentContext);
        }

        if (_speakingContext) {
            blocks.push('='.repeat(60));
            blocks.push('OFFICIAL IELTS SPEAKING BAND DESCRIPTORS (BAND 0–9) — READ CAREFULLY');
            blocks.push('You MUST evaluate candidate speech strictly following these descriptors.');
            blocks.push('='.repeat(60));
            blocks.push(_speakingContext);
            blocks.push('='.repeat(60));
            blocks.push('END OF SPEAKING REFERENCE MATERIAL');
            blocks.push('='.repeat(60));
        }

        return blocks.join('\n');
    }

    if (skill !== 'writing') return '';

    let ctx = (partType === 'Task 1' ? _task1Context : _task2Context) || _task2Context || _task1Context;
    if (!ctx) return '';

    if (_samplesContext) {
        ctx += '\n\n' + _samplesContext;
    }

    return [
        '='.repeat(60),
        `OFFICIAL IELTS GRADING REFERENCE FOR ${partType ? partType.toUpperCase() : 'WRITING'} — READ CAREFULLY`,
        'You MUST follow these band descriptors when assigning scores.',
        '='.repeat(60),
        ctx,
        '='.repeat(60),
        'END OF REFERENCE MATERIAL',
        '='.repeat(60),
        '',
    ].join('\n');
};

exports.hasContext = (skill) => {
    if (skill === 'speaking') return !!_speakingContext;
    return skill === 'writing' ? !!(_task1Context || _task2Context) : false;
};

