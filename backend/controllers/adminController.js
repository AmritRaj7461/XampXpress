const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');
const Organization = require('../models/Organization');

// @desc    Get Admin Dashboard Stats
// @route   GET /api/admin/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const totalExams = await Exam.countDocuments({});

    // Aggregate organizations from teachers
    const orgData = await User.aggregate([
      { $match: { role: 'teacher', organization: { $ne: '' } } },
      { $group: { _id: '$organization', count: { $sum: 1 } } }
    ]);

    const totalOrganizations = orgData.length;

    res.json({
      totalStudents,
      totalTeachers,
      totalAdmins,
      totalExams,
      totalOrganizations,
      orgData
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all teachers and admins
// @route   GET /api/admin/teachers
// @access  Private/Admin
const getTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: { $in: ['teacher', 'admin'] } }).select('-password').sort({ createdAt: -1 });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update teacher organization
// @route   PUT /api/admin/teachers/:id/organization
// @access  Private/Admin
const updateTeacherOrganization = async (req, res) => {
  try {
    const { organization } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role !== 'teacher' && user.role !== 'admin') {
      return res.status(400).json({ message: 'Only teacher or admin organizations can be updated' });
    }

    user.organization = organization;
    await user.save();

    res.json({ message: 'Organization updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Promote teacher to Admin
// @route   PUT /api/admin/teachers/:id/promote
// @access  Private/Admin
const promoteToAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    user.role = 'admin';

    // Generate new ADM userId prefix
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
      (today.getMonth() + 1).toString().padStart(2, '0') +
      today.getDate().toString().padStart(2, '0');
    
    const prefix = 'ADM';
    
    const lastUser = await User.findOne({
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
    user.userId = `${prefix}${dateStr}${counterStr}`;

    await user.save();

    res.json({ message: 'User promoted to Admin successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all organizations and status
// @route   GET /api/admin/organizations
// @access  Private/Admin
const getOrganizations = async (req, res) => {
  try {
    // Gather distinct organizations from teacher profiles
    const distinctOrgs = await User.distinct('organization', { role: 'teacher', organization: { $ne: '' } });
    
    // Fetch registered license status from Organization model
    const savedOrgs = await Organization.find({});
    
    const orgList = distinctOrgs.map(name => {
      const matched = savedOrgs.find(o => o.name === name);
      return {
        name,
        status: matched ? matched.status : 'active'
      };
    });

    // Also include any organizations in status collection that don't have teachers yet
    savedOrgs.forEach(org => {
      if (!distinctOrgs.includes(org.name)) {
        orgList.push({
          name: org.name,
          status: org.status
        });
      }
    });

    res.json(orgList);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update organization status (cease/activate license)
// @route   PUT /api/admin/organizations/:name/status
// @access  Private/Admin
const updateOrganizationStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'active' or 'suspended'
    const name = req.params.name;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ message: 'Invalid organization license status' });
    }

    let org = await Organization.findOne({ name });
    if (!org) {
      org = new Organization({ name, status });
    } else {
      org.status = status;
    }
    await org.save();

    res.json({
      message: `Organization license for "${name}" successfully set to ${status === 'suspended' ? 'Ceased (Suspended)' : 'Active'}.`,
      org
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Run database stats check (REAL)
// @route   POST /api/admin/diagnose
// @access  Private/Admin
const runDiagnostics = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const stats = await mongoose.connection.db.stats();
    
    res.json({
      status: 'healthy',
      ping: 'ok',
      collections: stats.collections,
      objects: stats.objects,
      avgObjSize: stats.avgObjSize,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Prune AI Mock test records (REAL)
// @route   POST /api/admin/prune
// @access  Private/Admin
const pruneAIResults = async (req, res) => {
  try {
    // Delete all Result records of type 'ai'
    const pruneResult = await Result.deleteMany({ type: 'ai' });
    res.json({
      message: `Pruning complete. Deleted ${pruneResult.deletedCount} AI mock test records.`,
      deletedCount: pruneResult.deletedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export system JSON backup (REAL)
// @route   GET /api/admin/backup
// @access  Private/Admin
const backupDatabase = async (req, res) => {
  try {
    const users = await User.find({});
    const exams = await Exam.find({});
    const results = await Result.find({});
    const orgs = await Organization.find({});

    const backup = {
      exportedAt: new Date().toISOString(),
      database: 'XampXpress MongoDB',
      usersCount: users.length,
      examsCount: exams.length,
      resultsCount: results.length,
      organizationsCount: orgs.length,
      users,
      exams,
      results,
      organizations: orgs
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=xampxpress_backup.json');
    res.send(JSON.stringify(backup, null, 2));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update student organization/school/college
// @route   PUT /api/admin/students/:id/organization
// @access  Private/Admin
const updateStudentOrganization = async (req, res) => {
  try {
    const { organization, educationLevel, schoolName10th, schoolName12th, collegeName, degree, cgpa } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (user.role !== 'student') {
      return res.status(400).json({ message: 'Only student organizations/schools can be updated' });
    }

    if (organization !== undefined) user.organization = organization;
    if (educationLevel !== undefined) user.educationLevel = educationLevel;
    if (schoolName10th !== undefined) user.schoolName10th = schoolName10th;
    if (schoolName12th !== undefined) user.schoolName12th = schoolName12th;
    if (collegeName !== undefined) user.collegeName = collegeName;
    if (degree !== undefined) user.degree = degree;
    if (cgpa !== undefined) user.cgpa = cgpa;

    await user.save();

    res.json({ message: 'Student details updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
