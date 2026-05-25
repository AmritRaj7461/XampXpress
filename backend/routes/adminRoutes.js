const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getAdminStats,
  getTeachers,
  updateTeacherOrganization,
  promoteToAdmin
} = require('../controllers/adminController');

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.get('/teachers', getTeachers);
router.put('/teachers/:id/organization', updateTeacherOrganization);
router.put('/teachers/:id/promote', promoteToAdmin);

module.exports = router;
