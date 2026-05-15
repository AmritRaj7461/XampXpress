const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authRoutes = require('./routes/authRoutes');
const examRoutes = require('./routes/examRoutes');
const aiRoutes = require('./routes/aiRoutes');

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/xampxpress')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/ai', aiRoutes);

// Get results for a user
app.get('/api/results', require('./middleware/authMiddleware').protect, async (req, res) => {
  try {
    const Result = require('./models/Result');
    if (req.user.role === 'student') {
      const results = await Result.find({ student: req.user._id }).populate('exam', 'title subject timeLimit').sort({ createdAt: -1 });
      res.json(results);
    } else {
      // Teachers get results of their created exams (could be complex query, keeping it simple for now)
      // They might want to query by specific exam ID instead
      res.json([]);
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
