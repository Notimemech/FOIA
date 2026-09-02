const db = require('../db');
const fs = require('fs');
const path = require('path');

exports.getAllQuestions = async (req, res) => {
    try {
        const { skill, part } = req.query;
        let query = 'SELECT * FROM questions WHERE 1=1';
        let params = [];
        
        if (skill) {
            params.push(skill);
            query += ` AND skill = $${params.length}`;
        }
        if (part) {
            params.push(part);
            query += ` AND part = $${params.length}`;
        }
        
        query += ' ORDER BY created_at DESC';
        
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getQuestionById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM questions WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ msg: 'Question not found' });
        }
        
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.createQuestion = async (req, res) => {
    try {
        const { skill, part, content, image_url } = req.body;
        
        const newQuestion = await db.query(
            'INSERT INTO questions (skill, part, content, image_url) VALUES ($1, $2, $3, $4) RETURNING *',
            [skill, part, content, image_url]
        );
        
        res.json(newQuestion.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
};

exports.getRouletteTopics = async (req, res) => {
    try {
        const { part } = req.query; // 'Part 1', 'Part 2', 'Part 3'
        let query = 'SELECT * FROM speaking_roulette_topics WHERE 1=1';
        let params = [];

        if (part) {
            params.push(part);
            query += ` AND part = $${params.length}`;
        }

        query += ' ORDER BY created_at ASC';

        try {
            const result = await db.query(query, params);
            if (result.rows && result.rows.length > 0) {
                return res.json(result.rows);
            }
        } catch (dbErr) {
            console.warn('[DB] speaking_roulette_topics table query failed, falling back to JSON file:', dbErr.message);
        }

        // Fallback to reading speaking_roulette.json
        const jsonPath = path.join(__dirname, '../../db/access/speaking_roulette.json');
        if (fs.existsSync(jsonPath)) {
            const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
            let all = [];
            const colorThemes = ['sage', 'sand', 'rust', 'slate', 'coral', 'moss', 'amber', 'indigo'];
            let idx = 0;
            ['part_1', 'part_2', 'part_3'].forEach((k) => {
                const partName = k === 'part_1' ? 'Part 1' : k === 'part_2' ? 'Part 2' : 'Part 3';
                if (!part || part === partName) {
                    const list = (raw.parts?.[k]?.topics || []).map((t) => ({
                        id: `roulette_${k}_${idx}`,
                        part: partName,
                        topic: t.topic,
                        cue_card: t.cue_card || null,
                        questions: t.questions || [],
                        color_theme: colorThemes[idx++ % colorThemes.length]
                    }));
                    all = all.concat(list);
                }
            });
            return res.json(all);
        }

        res.json([]);
    } catch (err) {
        console.error('[Roulette Topics Error]:', err.message);
        res.status(500).json({ error: 'Failed to fetch roulette topics' });
    }
};
