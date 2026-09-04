const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Ensure upload dir exists
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Routes
const questionRoutes = require('./routes/question.routes');
const assessmentRoutes = require('./routes/assessment.routes');

app.use('/api/questions', questionRoutes);
app.use('/api/assessments', assessmentRoutes);

app.get('/', (req, res) => {
    res.send('IELTS Examiner API is running');
});

app.listen(port, process.env.BACKEND_URL, () => {
    console.log(`Server is running on port ${port}`);
    // Load rubric context into memory (non-blocking, best-effort)
    const rubricService = require('./service/rubric.service');
    rubricService.initRubrics();
});
