const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getAdminStats,
  getTeachers,
  updateTeacherOrganization,
  promoteToAdmin,
  getOrganizations,
  updateOrganizationStatus,
  runDiagnostics,
  pruneAIResults,
  backupDatabase,
  getStudents,
  updateStudentOrganization
} = require('../controllers/adminController');

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminOnly);

router.get('/stats', getAdminStats);
router.get('/teachers', getTeachers);
router.put('/teachers/:id/organization', updateTeacherOrganization);
router.put('/teachers/:id/promote', promoteToAdmin);
router.get('/organizations', getOrganizations);
router.put('/organizations/:name/status', updateOrganizationStatus);
router.post('/diagnose', runDiagnostics);
router.post('/prune', pruneAIResults);
router.get('/backup', backupDatabase);
router.get('/students', getStudents);
router.put('/students/:id/organization', updateStudentOrganization);

module.exports = router;
