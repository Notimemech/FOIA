const express = require('express');
const router = express.Router();
const assessmentController = require('../controller/assessmentController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads/'))
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
});
const upload = multer({ storage: storage });

router.post('/submit', upload.single('audio'), assessmentController.submitAssessment);
router.post('/upload-image', upload.single('image'), assessmentController.uploadImage);
router.post('/generate-sample', assessmentController.generateSampleEssay);
router.post('/:id/generate-sample', assessmentController.generateSampleEssay);
router.get('/', assessmentController.getAllAssessments);
router.get('/:id', assessmentController.getAssessmentById);

module.exports = router;

