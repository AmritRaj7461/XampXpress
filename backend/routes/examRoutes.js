const express = require('express');
const router = express.Router();
const { createExam, getExams, getExamById, submitExam } = require('../controllers/examController');
const { protect, teacherOnly, studentOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getExams)
  .post(protect, teacherOnly, createExam);

router.route('/:id')
  .get(protect, getExamById);

router.route('/:id/submit')
  .post(protect, studentOnly, submitExam);

module.exports = router;
