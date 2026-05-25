const User = require('../models/User');
const Exam = require('../models/Exam');
const Result = require('../models/Result');

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

module.exports = {
  getAdminStats,
  getTeachers,
  updateTeacherOrganization,
  promoteToAdmin
};
