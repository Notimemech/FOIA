const db = require('../db');
const aiService = require('../service/ai.service');

// Helper function to parse raw AI text into JSON objects
const parseImprovements = (improvements) => {
    if (!improvements || !Array.isArray(improvements)) return improvements;
    
    return improvements.map(imp => {
        if (typeof imp === 'string') {
            const parsed = [];
            // Look for patterns like "* **Title:** Content" or "**Title:** Content"
            const regex = /(?:\*\s*)?\*\*(.*?)\*\*(?:\:|\s*-)?\s*([\s\S]*?)(?=(?:\*\s*)?\*\*|$)/g;
            let match;
            let found = false;
            
            // Clean up standard intro text
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
    if (assessment.feedback && assessment.feedback.improvements) {
        assessment.feedback.improvements = parseImprovements(assessment.feedback.improvements);
    }
    return assessment;
};

exports.submitAssessment = async (req, res) => {
    try {
        const { question_id, skill, part_type, task_prompt, user_input_text } = req.body;
        const audio_path = req.file ? `/uploads/${req.file.filename}` : null;

        // 1. Lưu bài nộp tạm thời
        const insertResult = await db.query(
            `INSERT INTO assessments 
             (question_id, skill, part_type, task_prompt, user_input_text, audio_path, status) 
             VALUES ($1, $2, $3, $4, $5, $6, 'processing') 
             RETURNING *`,
            [question_id, skill, part_type, task_prompt, user_input_text, audio_path]
        );
        const assessment = insertResult.rows[0];

        // 2. Gọi AI Service để chấm bài (Background process hoặc await trực tiếp)
        // Trong môi trường production, nên dùng message queue. Ở đây await luôn cho đơn giản
        const aiResult = await aiService.gradeAndCrossCheck(
            skill, 
            task_prompt, 
            user_input_text, 
            audio_path ? req.file.path : null
        );

        // 3. Cập nhật kết quả
        const updateResult = await db.query(
            `UPDATE assessments 
             SET overall_band = $1, sub_scores = $2, feedback = $3, status = 'completed'
             WHERE id = $4 RETURNING *`,
            [aiResult.overall_band, aiResult.sub_scores, aiResult.feedback, assessment.id]
        );

        res.json(formatAssessment(updateResult.rows[0]));
    } catch (err) {
        console.error(err.message);
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
