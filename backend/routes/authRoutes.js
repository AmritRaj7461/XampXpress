const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getUserProfile, googleAuth, updateUserProfile, getStudents, uploadResume } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.get('/students', protect, getStudents);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.post('/upload-resume', protect, upload.single('resume'), uploadResume);

module.exports = router;
