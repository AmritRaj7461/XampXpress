const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Exam = require('./models/Exam');
const Result = require('./models/Result');
const dotenv = require('dotenv');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/xampxpress';

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // Clear existing data
    console.log('Clearing database...');
    await User.deleteMany({});
    await Exam.deleteMany({});
    await Result.deleteMany({});
    console.log('Cleared.');

    // Create teacher
    console.log('Creating teacher...');
    const teacher = await User.create({
      name: 'Test Teacher',
      email: 'teacher@test.com',
      password: 'password123',
      role: 'teacher'
    });
    console.log('Teacher created:', teacher.email, 'userId:', teacher.userId);

    // Create student
    console.log('Creating student...');
    const student = await User.create({
      name: 'Test Student',
      email: 'student@test.com',
      password: 'password123',
      role: 'student'
    });
    console.log('Student created:', student.email, 'userId:', student.userId);

    // Create exam
    console.log('Creating exam...');
    const exam = await Exam.create({
      title: 'Introduction to Programming',
      subject: 'Computer Science',
      timeLimit: 10,
      createdBy: teacher._id,
      examDate: new Date(), // today
      assignedTo: [student._id],
      questions: [
        {
          questionText: 'What does HTML stand for?',
          options: [
            'Hyper Text Markup Language',
            'High Tech Modern Language',
            'Hyperlink and Text Markup Language',
            'Home Tool Markup Language'
          ],
          correctAnswer: 'Hyper Text Markup Language'
        },
        {
          questionText: 'Which programming language is known as the language of the web?',
          options: ['Python', 'C++', 'JavaScript', 'Java'],
          correctAnswer: 'JavaScript'
        }
      ]
    });
    console.log('Exam created:', exam.title);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seed();
