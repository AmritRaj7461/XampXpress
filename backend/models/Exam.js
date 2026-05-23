const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  timeLimit: {
    type: Number, // in minutes
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  examDate: {
    type: Date,
    required: true,
  },
  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  questions: [{
    questionText: {
      type: String,
      required: true,
    },
    options: [{
      type: String,
      required: true,
    }],
    correctAnswer: {
      type: String,
      required: true,
    }
  }],
  type: {
    type: String,
    default: 'teacher',
  },
}, { timestamps: true });

const Exam = mongoose.model('Exam', examSchema);
module.exports = Exam;
