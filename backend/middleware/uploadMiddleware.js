const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const resumeDir = path.join(__dirname, '..', 'uploads', 'resumes');
if (!fs.existsSync(resumeDir)) {
  fs.mkdirSync(resumeDir, { recursive: true });
}

const avatarDir = path.join(__dirname, '..', 'uploads', 'avatars');
if (!fs.existsSync(avatarDir)) {
  fs.mkdirSync(avatarDir, { recursive: true });
}

// Resume Storage & Filter
const resumeStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, resumeDir);
  },
  filename(req, file, cb) {
    cb(null, `resume-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

function checkResumeFileType(file, cb) {
  const filetypes = /pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: PDFs Only!');
  }
}

const uploadResume = multer({
  storage: resumeStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    checkResumeFileType(file, cb);
  }
});

// Avatar Storage & Filter
const avatarStorage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, avatarDir);
  },
  filename(req, file, cb) {
    cb(null, `avatar-${req.user._id}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

function checkAvatarFileType(file, cb) {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb('Error: Images Only (jpeg, jpg, png, gif, webp)!');
  }
}

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    checkAvatarFileType(file, cb);
  }
});

module.exports = {
  uploadResume,
  uploadAvatar
};

