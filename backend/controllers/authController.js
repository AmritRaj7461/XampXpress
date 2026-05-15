const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { emailOrId, password } = req.body;

  try {
    // Check if user exists by email or custom userId
    const user = await User.findOne({
      $or: [{ email: emailOrId }, { userId: emailOrId }]
    });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);
  const Result = require('../models/Result');

  if (user) {
    // Recalculate stats based on actual results in DB
    const results = await Result.find({ student: req.user._id });
    
    let totalTests = results.length;
    let averageScore = 0;
    let accuracy = 0;

    if (totalTests > 0) {
      averageScore = results.reduce((acc, curr) => acc + curr.score, 0) / totalTests;
      accuracy = results.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) / totalTests;
    }

    // Sync user stats if they differ from DB reality
    if (user.totalTests !== totalTests || user.averageScore !== averageScore || user.accuracy !== accuracy) {
      user.totalTests = totalTests;
      user.averageScore = averageScore;
      user.accuracy = accuracy;
      await user.save();
    }

    res.json({
      _id: user._id,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      totalTests: user.totalTests,
      averageScore: user.averageScore,
      accuracy: user.accuracy,
      streak: user.streak,
      badges: user.badges,
      educationLevel: user.educationLevel,
      schoolName10th: user.schoolName10th,
      percentage10th: user.percentage10th,
      schoolName12th: user.schoolName12th,
      percentage12th: user.percentage12th,
      collegeName: user.collegeName,
      degree: user.degree,
      cgpa: user.cgpa,
      aadharNumber: user.aadharNumber,
      panNumber: user.panNumber,
      dob: user.dob,
      address: user.address,
      resumeUrl: user.resumeUrl,
      phone: user.phone,
      fairPoints: user.fairPoints,
      createdAt: user.createdAt
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Auth user with Google
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res) => {
  const { token, role } = req.body; // role is only used if it's a new registration

  try {
    const googleRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    if (!googleRes.ok) {
      const text = await googleRes.text();
      throw new Error(`Google API Error: ${googleRes.status} - ${text}`);
    }
    
    const googleData = await googleRes.json();
    const { name, email, sub: googleId, picture } = googleData;

    let user = await User.findOne({ email });

    if (user) {
      // Login existing user
      res.json({
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    } else {
      // Register new user via Google
      // Since Google doesn't provide a password, we generate a random one
      // In a real app, you might want to mark this user as 'googleAuthOnly'
      const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
      
      user = await User.create({
        name,
        email,
        password: randomPassword,
        role: role || 'student', // Default to student if not provided
        avatar: picture || '',
      });

      res.status(201).json({
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ 
      message: 'Invalid Google Token',
      details: error.message,
      tokenReceived: req.body.token ? 'Yes' : 'No'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;
    if (req.body.password) {
      user.password = req.body.password;
    }
    
    // Academic Info
    if (req.body.educationLevel !== undefined) user.educationLevel = req.body.educationLevel;
    if (req.body.schoolName10th !== undefined) user.schoolName10th = req.body.schoolName10th;
    if (req.body.percentage10th !== undefined) user.percentage10th = req.body.percentage10th;
    if (req.body.schoolName12th !== undefined) user.schoolName12th = req.body.schoolName12th;
    if (req.body.percentage12th !== undefined) user.percentage12th = req.body.percentage12th;
    if (req.body.collegeName !== undefined) user.collegeName = req.body.collegeName;
    if (req.body.degree !== undefined) user.degree = req.body.degree;
    if (req.body.cgpa !== undefined) user.cgpa = req.body.cgpa;
    
    // Additional Info
    if (req.body.aadharNumber !== undefined) user.aadharNumber = req.body.aadharNumber;
    if (req.body.panNumber !== undefined) user.panNumber = req.body.panNumber;
    if (req.body.dob !== undefined) user.dob = req.body.dob;
    if (req.body.address !== undefined) user.address = req.body.address;
    
    // Account Info
    if (req.body.phone !== undefined) user.phone = req.body.phone;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      userId: updatedUser.userId,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      educationLevel: updatedUser.educationLevel,
      schoolName10th: updatedUser.schoolName10th,
      percentage10th: updatedUser.percentage10th,
      schoolName12th: updatedUser.schoolName12th,
      percentage12th: updatedUser.percentage12th,
      collegeName: updatedUser.collegeName,
      degree: updatedUser.degree,
      cgpa: updatedUser.cgpa,
      aadharNumber: updatedUser.aadharNumber,
      panNumber: updatedUser.panNumber,
      dob: updatedUser.dob,
      address: updatedUser.address,
      resumeUrl: updatedUser.resumeUrl,
      phone: updatedUser.phone,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404).json({ message: 'User not found' });
  }
};

// @desc    Get all students
// @route   GET /api/auth/students
// @access  Private/Teacher
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload Resume
// @route   POST /api/auth/upload-resume
// @access  Private/Student
const uploadResume = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    // Generate local URL
    const fileUrl = `/uploads/resumes/${req.file.filename}`;
    user.resumeUrl = fileUrl;
    
    const updatedUser = await user.save();

    res.json({
      message: 'Resume uploaded successfully',
      resumeUrl: fileUrl
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, googleAuth, updateUserProfile, getStudents, uploadResume };
