const express = require('express');
const router = express.Router();
const questionController = require('../controller/questionController');

router.get('/roulette', questionController.getRouletteTopics);
router.get('/', questionController.getAllQuestions);
router.get('/:id', questionController.getQuestionById);
router.post('/', questionController.createQuestion);

module.exports = router;
