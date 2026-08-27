/**
 * rubric.service.js
 *
 * Loads IELTS writing rubric from structured JSON and formats it into
 * a clear context block to prepend to AI grading prompts.
 *
 * Rubric source: db/access/writing_rubic.json
 * Only bands 5+ are included (as per product requirement).
 */

const fs   = require('fs');
const path = require('path');

const RUBRIC_PATH  = path.join(__dirname, '../../db/access/writing_rubic.json');
const SAMPLES_PATH = path.join(__dirname, '../../db/access/writing_samples.json'); // optional

const CRITERION_LABELS = {
    task_achievement:              'Task Achievement / Task Response',
    coherence_and_cohesion:        'Coherence & Cohesion',
    lexical_resource:              'Lexical Resource',
    grammatical_range_and_accuracy:'Grammatical Range & Accuracy',
};

// ─── In-memory state ───
let _writingContext = null; // formatted string, ready to inject

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Convert the structured rubric JSON into a human-readable text block.
 * Only includes bands >= MIN_BAND.
 */
function formatRubric(rubricData, minBand = 5) {
    const bands = (rubricData.bands || [])
        .filter(b => b.band >= minBand)
        .sort((a, b) => b.band - a.band); // descending: 9, 8, 7, 6, 5

    if (bands.length === 0) return '';

    const lines = [];
    lines.push(`IELTS Writing Band Descriptors (Band ${minBand}–9)`);
    lines.push('─'.repeat(60));

    for (const band of bands) {
        lines.push(`\nBAND ${band.band}`);
        lines.push('─'.repeat(30));

        for (const [key, label] of Object.entries(CRITERION_LABELS)) {
            if (!band[key]) continue;
            lines.push(`\n▸ ${label}:`);
            for (const point of band[key]) {
                lines.push(`  • ${point}`);
            }
        }
    }

    return lines.join('\n');
}

/**
 * Load optional sample essays JSON (bands 5+).
 * Expected format: { "samples": [{ "band": 7, "essay": "..." }, ...] }
 */
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
        // Limit each sample to 1000 chars to stay within token budget
        const text = (s.essay || '').substring(0, 1000);
        lines.push(text + (s.essay?.length > 1000 ? '\n...[truncated]' : ''));
    }

    return lines.join('\n');
}

// ─── Public API ────────────────────────────────────────────────────────────

/**
 * Call once at server startup.
 */
exports.initRubrics = () => {
    // Load writing rubric
    if (fs.existsSync(RUBRIC_PATH)) {
        try {
            const rubricData = JSON.parse(fs.readFileSync(RUBRIC_PATH, 'utf-8'));
            const rubricText = formatRubric(rubricData, 5);

            // Load optional sample essays
            let samplesText = '';
            if (fs.existsSync(SAMPLES_PATH)) {
                const samplesData = JSON.parse(fs.readFileSync(SAMPLES_PATH, 'utf-8'));
                samplesText = formatSamples(samplesData, 5);
                console.log(`[Rubric] Sample essays loaded`);
            } else {
                console.log(`[Rubric] No writing_samples.json found — skipping samples`);
            }

            _writingContext = rubricText + (samplesText ? '\n\n' + samplesText : '');
            console.log(`[Rubric] Writing context ready — ${_writingContext.length.toLocaleString()} chars, bands: ${
                (rubricData.bands || []).filter(b => b.band >= 5).map(b => b.band).join(', ')
            }`);
        } catch (e) {
            console.error('[Rubric] Failed to load writing rubric:', e.message);
        }
    } else {
        console.warn('[Rubric] writing_rubic.json not found at:', RUBRIC_PATH);
    }
};

/**
 * Build the context block to prepend to an AI prompt.
 * Returns empty string if no rubric is loaded.
 */
exports.buildContextBlock = (skill) => {
    // Currently only writing rubric is available from JSON
    // Speaking rubric can be added later
    const ctx = skill === 'writing' ? _writingContext : null;
    if (!ctx) return '';

    return [
        '='.repeat(60),
        'OFFICIAL IELTS GRADING REFERENCE — READ CAREFULLY',
        'You MUST follow these band descriptors when assigning scores.',
        '='.repeat(60),
        ctx,
        '='.repeat(60),
        'END OF REFERENCE MATERIAL',
        '='.repeat(60),
        '',
    ].join('\n');
};

/**
 * Check if rubric context is available for a given skill.
 */
exports.hasContext = (skill) => {
    return skill === 'writing' ? !!_writingContext : false;
};
