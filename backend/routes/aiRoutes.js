const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { extractTopics, generateTest, submitAITest, parseQuestions } = require('../controllers/aiTestController');

// Store syllabus in memory (buffer) — no disk write needed
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and DOC/DOCX files are allowed'));
    }
  },
});

router.post('/extract-topics', protect, upload.single('syllabus'), extractTopics);
router.post('/generate-test', protect, generateTest);
router.post('/submit', protect, submitAITest);
router.post('/parse-questions', protect, upload.single('file'), parseQuestions);

module.exports = router;
