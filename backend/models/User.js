const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    required: true,
  },
  organization: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  // --- Extended Student Profile Fields ---
  educationLevel: {
    type: String,
    enum: ['school', 'college', ''],
    default: ''
  },
  schoolName10th: { type: String, default: '' },
  percentage10th: { type: String, default: '' },
  schoolName12th: { type: String, default: '' },
  percentage12th: { type: String, default: '' },
  collegeName: { type: String, default: '' },
  degree: { type: String, default: '' },
  cgpa: { type: String, default: '' },
  
  aadharNumber: { type: String, default: '' },
  panNumber: { type: String, default: '' },
  dob: { type: String, default: '' },
  address: { type: String, default: '' },
  
  resumeUrl: { type: String, default: '' },
  phone: { type: String, default: '' },
  // ---------------------------------------

  // Student stats
  totalTests: {
    type: Number,
    default: 0,
  },
  averageScore: {
    type: Number,
    default: 0,
  },
  accuracy: {
    type: Number,
    default: 0,
  },
  streak: {
    type: Number,
    default: 0,
  },
  lastActive: {
    type: Date,
  },
  badges: [{
    type: String
  }],
  fairPoints: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

// Pre-save hook to hash password and generate ID
userSchema.pre('save', async function () {
  if (!this.userId) {
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');

    let prefix = 'STU';
    if (this.role === 'teacher') prefix = 'TCH';
    else if (this.role === 'admin') prefix = 'ADM';
    
    // Find the highest existing userId for this prefix and date to prevent duplicates
    const lastUser = await this.constructor.findOne({
      userId: new RegExp(`^${prefix}${dateStr}`)
    })
      .sort({ userId: -1 })
      .select('userId')
      .exec();

    let nextCounter = 1;
    if (lastUser && lastUser.userId) {
      const lastCounterStr = lastUser.userId.replace(`${prefix}${dateStr}`, '');
      const lastCounter = parseInt(lastCounterStr, 10);
      if (!isNaN(lastCounter)) {
        nextCounter = lastCounter + 1;
      }
    }

    const counterStr = nextCounter.toString().padStart(4, '0');
    this.userId = `${prefix}${dateStr}${counterStr}`;
  }

  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
