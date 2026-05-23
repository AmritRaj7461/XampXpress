const express = require('express');
const router = express.Router();
const { createExam, getExams, getExamById, submitExam, updateExam, deleteExam } = require('../controllers/examController');
const { protect, teacherOnly, studentOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getExams)
  .post(protect, teacherOnly, createExam);

router.route('/:id')
  .get(protect, getExamById)
  .put(protect, teacherOnly, updateExam)
  .delete(protect, teacherOnly, deleteExam);

router.route('/:id/submit')
  .post(protect, studentOnly, submitExam);

module.exports = router;
