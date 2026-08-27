const db = require('../db');
const aiService = require('../service/ai.service');

// Helper function to parse raw AI text into JSON objects
const parseImprovements = (improvements) => {
    if (!improvements || !Array.isArray(improvements)) return improvements;
    
    return improvements.map(imp => {
        if (typeof imp === 'string') {
            const parsed = [];
            const regex = /(?:\*\s*)?\*\*(.*?)\*\*(?:\:|\s*-)?\s*([\s\S]*?)(?=(?:\*\s*)?\*\*|$)/g;
            let match;
            let found = false;
            
            let textToParse = imp;
            const introMatch = textToParse.match(/([\s\S]*?\-\-\-)/);
            if (introMatch) {
                textToParse = textToParse.substring(introMatch[0].length);
            }

            while ((match = regex.exec(textToParse)) !== null) {
                if (match[1].trim().toLowerCase() === 'original text' || match[1].trim().toLowerCase() === 'improvements') continue;
                found = true;
                parsed.push({
                    title: match[1].trim(),
                    content: match[2].trim().replace(/^\*\s*/, '')
                });
            }
            if (found && parsed.length > 0) return parsed;
            return { title: 'Suggestion', content: imp };
        }
        return imp;
    }).flat();
};

const formatAssessment = (assessment) => {
    if (!assessment) return assessment;
    if (assessment.feedback && assessment.feedback.improvements) {
        assessment.feedback.improvements = parseImprovements(assessment.feedback.improvements);
    }
    return assessment;
};

exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }
        const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
        res.json({ imageUrl, filename: req.file.filename });
    } catch (err) {
        console.error('[Upload Image Error]:', err.message);
        res.status(500).json({ error: 'Failed to upload image' });
    }
};

exports.submitAssessment = async (req, res) => {
    try {
        const {
            question_id,
            skill = 'writing',
            part_type = 'Task 2',
            task_prompt,
            user_input_text,
            target_band = 7.0,
            image_url,
            task1_prompt,
            task1_input,
            task1_image,
            task2_prompt,
            task2_input,
        } = req.body;

        const audio_path = req.file ? `/uploads/${req.file.filename}` : null;

        const effectivePrompt = task_prompt || (part_type === 'Full Test' 
            ? `Task 1: ${task1_prompt || ''}\n\nTask 2: ${task2_prompt || ''}`
            : '');
        const effectiveInput = user_input_text || (part_type === 'Full Test'
            ? `=== TASK 1 ===\n${task1_input || ''}\n\n=== TASK 2 ===\n${task2_input || ''}`
            : '');

        // 1. Lưu bài nộp tạm thời
        let assessment;
        try {
            const insertResult = await db.query(
                `INSERT INTO assessments 
                 (question_id, skill, part_type, task_prompt, user_input_text, audio_path, image_url, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, 'processing') 
                 RETURNING *`,
                [question_id || null, skill, part_type, effectivePrompt, effectiveInput, audio_path, image_url || task1_image || null]
            );
            assessment = insertResult.rows[0];
        } catch (dbErr) {
            console.warn('[DB Warning] Fallback insert without image_url:', dbErr.message);
            const insertFallback = await db.query(
                `INSERT INTO assessments 
                 (question_id, skill, part_type, task_prompt, user_input_text, audio_path, status) 
                 VALUES ($1, $2, $3, $4, $5, $6, 'processing') 
                 RETURNING *`,
                [question_id || null, skill, part_type, effectivePrompt, effectiveInput, audio_path]
            );
            assessment = insertFallback.rows[0];
        }

        // 2. Gọi AI Service để chấm bài
        const aiResult = await aiService.gradeAndCrossCheck(
            skill, 
            effectivePrompt, 
            effectiveInput, 
            audio_path ? req.file.path : null,
            {
                part_type,
                target_band: Number(target_band) || 7.0,
                image_url: image_url || task1_image || null,
                task1_prompt,
                task1_input,
                task1_image,
                task2_prompt,
                task2_input,
            }
        );

        // Đính kèm metadata mở rộng vào feedback để frontend render đầy đủ
        const enrichedFeedback = {
            ...aiResult.feedback,
            target_band: Number(target_band) || 7.0,
            part_type,
            image_url: image_url || task1_image || null,
            task1: aiResult.task1 || (part_type === 'Task 1' ? { prompt: effectivePrompt, image: image_url, input: effectiveInput } : null),
            task2: aiResult.task2 || (part_type === 'Task 2' ? { prompt: effectivePrompt, input: effectiveInput } : null),
            task1_prompt: task1_prompt || (part_type === 'Task 1' ? effectivePrompt : null),
            task1_input:  task1_input  || (part_type === 'Task 1' ? effectiveInput : null),
            task1_image:  task1_image  || (part_type === 'Task 1' ? image_url : null),
            task2_prompt: task2_prompt || (part_type === 'Task 2' ? effectivePrompt : null),
            task2_input:  task2_input  || (part_type === 'Task 2' ? effectiveInput : null),
        };

        // 3. Cập nhật kết quả vào database
        const updateResult = await db.query(
            `UPDATE assessments 
             SET overall_band = $1, sub_scores = $2, feedback = $3, status = 'completed'
             WHERE id = $4 RETURNING *`,
            [aiResult.overall_band, aiResult.sub_scores, enrichedFeedback, assessment.id]
        );

        res.json(formatAssessment(updateResult.rows[0]));
    } catch (err) {
        console.error('[Assessment Submit Error]:', err.message);
        res.status(500).send('Server error');
    }
};

exports.getAllAssessments = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM assessments ORDER BY created_at DESC');
        res.json(result.rows.map(formatAssessment));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getAssessmentById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM assessments WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Assessment not found' });
        }
        
        res.json(formatAssessment(result.rows[0]));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.generateSampleEssay = async (req, res) => {
    try {
        const { id } = req.params;
        const { part_type, task_prompt, user_input_text, image_url, target_band } = req.body;

        let effectivePartType = part_type;
        let effectivePrompt   = task_prompt;
        let effectiveInput    = user_input_text;
        let effectiveImage    = image_url;
        let effectiveTarget   = target_band || 7.0;

        let assessment = null;
        if (id) {
            const dbResult = await db.query('SELECT * FROM assessments WHERE id = $1', [id]);
            if (dbResult.rows.length > 0) {
                assessment = dbResult.rows[0];
                effectivePartType = part_type || assessment.part_type;
                effectivePrompt   = task_prompt || assessment.task_prompt;
                effectiveInput    = user_input_text || assessment.user_input_text;
                effectiveImage    = image_url || assessment.image_url;
                effectiveTarget   = target_band || assessment.feedback?.target_band || 7.0;
            }
        }

        const sampleRewrite = await aiService.generateSampleEssay({
            partType: effectivePartType || 'Task 2',
            taskPrompt: effectivePrompt || '',
            userInput: effectiveInput || '',
            targetBand: Number(effectiveTarget) || 7.0,
            imageUrl: effectiveImage || null,
        });

        // Persist generated model essay into DB if assessment exists
        if (assessment) {
            const currentFeedback = assessment.feedback || {};
            const updatedFeedback = {
                ...currentFeedback,
                sample_rewrite: sampleRewrite,
            };
            await db.query(
                `UPDATE assessments SET feedback = $1 WHERE id = $2`,
                [updatedFeedback, assessment.id]
            );
        }

        res.json({ sample_rewrite: sampleRewrite });
    } catch (err) {
        console.error('[Generate Sample Error]:', err.message);
        res.status(500).json({ error: 'Failed to generate model essay' });
    }
};

