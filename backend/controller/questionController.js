const db = require('../db');

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
