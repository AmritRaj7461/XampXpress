const Exam = require('../models/Exam');
const Result = require('../models/Result');
const User = require('../models/User');

// @desc    Create an exam
// @route   POST /api/exams
// @access  Private/Teacher
const createExam = async (req, res) => {
  try {
    const { title, subject, timeLimit, questions, examDate, assignedTo } = req.body;

    const exam = new Exam({
      title,
      subject,
      timeLimit,
      questions,
      examDate,
      assignedTo: assignedTo || [],
      createdBy: req.user._id,
    });

    const createdExam = await exam.save();
    res.status(201).json(createdExam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all exams (for student list or teacher's own exams)
// @route   GET /api/exams
// @access  Private
const getExams = async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      const exams = await Exam.find({ createdBy: req.user._id }).sort({ createdAt: -1 });
      res.json(exams);
    } else {
      // Students see exams assigned to them or to the entire class (assignedTo is empty)
      const exams = await Exam.find({
        $or: [
          { assignedTo: { $size: 0 } },
          { assignedTo: req.user._id }
        ]
      }).populate('createdBy', 'name').sort({ examDate: 1 });
      
      // Get all results for this student to mark completed ones
      const studentResults = await Result.find({ student: req.user._id });
      const completedExamIds = new Set(studentResults.map(r => r.exam.toString()));

      // Exclude correct answers for students before they take it
      const sanitizedExams = exams.map(exam => {
        const examObj = exam.toObject();
        const sanitizedQuestions = examObj.questions.map(q => ({
          _id: q._id,
          questionText: q.questionText,
          options: q.options,
        }));
        return {
          ...examObj,
          questions: sanitizedQuestions,
          completed: completedExamIds.has(examObj._id.toString()),
        };
      });
      res.json(sanitizedExams);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single exam by ID
// @route   GET /api/exams/:id
// @access  Private
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    
    if (exam) {
      if (req.user.role === 'student') {
        const existingResult = await Result.findOne({ student: req.user._id, exam: exam._id });
        if (existingResult) {
          return res.status(400).json({ message: 'You have already completed this exam and cannot re-attempt it.' });
        }

        const sanitizedQuestions = exam.questions.map(q => ({
          _id: q._id,
          questionText: q.questionText,
          options: q.options,
        }));
        const sanitizedExam = { ...exam._doc, questions: sanitizedQuestions };
        res.json(sanitizedExam);
      } else {
        res.json(exam);
      }
    } else {
      res.status(404).json({ message: 'Exam not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit an exam
// @route   POST /api/exams/:id/submit
// @access  Private/Student
const submitExam = async (req, res) => {
  try {
    const { responses, violated = false, violationLogs = [] } = req.body;
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    const existingResult = await Result.findOne({ student: req.user._id, exam: exam._id });
    if (existingResult) {
      return res.status(400).json({ message: 'You have already completed this exam and cannot re-submit it.' });
    }

    let score = 0;
    let attempted = 0;
    const evaluatedResponses = [];

    responses.forEach(userResponse => {
      const question = exam.questions.find(q => q._id.toString() === userResponse.questionId);
      if (question) {
        attempted++;
        const isCorrect = question.correctAnswer === userResponse.selectedOption;
        if (isCorrect) score++;

        evaluatedResponses.push({
          questionId: question._id,
          selectedOption: userResponse.selectedOption,
          isCorrect
        });
      }
    });

    const totalQuestions = exam.questions.length;
    const accuracy = attempted > 0 ? (score / attempted) * 100 : 0;

    const result = new Result({
      student: req.user._id,
      exam: exam._id,
      type: 'teacher',
      violated,
      violationLogs,
      score,
      totalQuestions,
      accuracy,
      attempted,
      responses: evaluatedResponses,
    });

    await result.save();

    // Update student stats
    const user = await User.findById(req.user._id);
    user.totalTests = (user.totalTests || 0) + 1;
    user.averageScore = (((user.averageScore || 0) * (user.totalTests - 1)) + score) / user.totalTests;
    user.accuracy = (((user.accuracy || 0) * (user.totalTests - 1)) + accuracy) / user.totalTests;
    
    // Fair Points: +1 for clean test, -2 for violated (min 0)
    if (violated) {
      user.fairPoints = Math.max(0, (user.fairPoints || 0) - 2);
    } else {
      user.fairPoints = (user.fairPoints || 0) + 1;
    }
    
    // Streak logic (basic)
    const today = new Date();
    if (user.lastActive) {
      const diffTime = Math.abs(today - user.lastActive);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays === 1) {
        user.streak += 1;
      } else if (diffDays > 1) {
        user.streak = 1;
      }
    } else {
      user.streak = 1;
    }
    user.lastActive = today;
    
    // Add badges
    if (user.totalTests === 1 && !user.badges.includes('First Attempt')) {
      user.badges.push('First Attempt');
    }
    if (user.totalTests === 10 && !user.badges.includes('Test Warrior')) {
      user.badges.push('Test Warrior');
    }

    await user.save();

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an exam
// @route   PUT /api/exams/:id
// @access  Private/Teacher
const updateExam = async (req, res) => {
  try {
    const { title, subject, timeLimit, questions, examDate, assignedTo } = req.body;
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if the user is the creator of the exam
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to edit this exam' });
    }

    exam.title = title || exam.title;
    exam.subject = subject || exam.subject;
    exam.timeLimit = timeLimit !== undefined ? timeLimit : exam.timeLimit;
    exam.questions = questions || exam.questions;
    exam.examDate = examDate || exam.examDate;
    exam.assignedTo = assignedTo || exam.assignedTo;

    const updatedExam = await exam.save();
    res.json(updatedExam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an exam
// @route   DELETE /api/exams/:id
// @access  Private/Teacher
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Check if the user is the creator of the exam
    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this exam' });
    }

    await exam.deleteOne();
    res.json({ message: 'Exam removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all results for a specific exam
// @route   GET /api/exams/:id/results
// @access  Private/Teacher
const getExamResults = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    if (exam.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view these results' });
    }

    const results = await Result.find({ exam: exam._id })
      .populate('student', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createExam,
  getExams,
  getExamById,
  submitExam,
  updateExam,
  deleteExam,
  getExamResults
};
