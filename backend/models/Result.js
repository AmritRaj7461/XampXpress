const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    default: null,
  },
  // 'teacher' = teacher-designed, 'ai' = AI-generated
  type: {
    type: String,
    enum: ['teacher', 'ai'],
    default: 'teacher',
  },
  // For AI tests (stored inline since there's no separate Exam doc)
  aiTestData: {
    subject: { type: String, default: '' },
    topics: [{ type: String }],
    questions: [{
      questionText: String,
      options: [String],
      correctAnswer: String,
    }],
  },
  violated: {
    type: Boolean,
    default: false,
  },
  score: {
    type: Number,
    required: true,
  },
  totalQuestions: {
    type: Number,
    required: true,
  },
  accuracy: {
    type: Number,
    required: true,
  },
  attempted: {
    type: Number,
    required: true,
  },
  responses: [{
    questionId: { type: String },
    selectedOption: { type: String },
    isCorrect: { type: Boolean },
  }],
}, { timestamps: true });

const Result = mongoose.model('Result', resultSchema);
module.exports = Result;

