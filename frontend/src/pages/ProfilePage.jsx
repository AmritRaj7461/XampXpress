import { useState, useContext, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, Shield, FileText, Settings,
  User, Lock, Phone, Mail, Camera, Save,
  Upload, Eye, BookOpen, School, BadgeCheck,
  Calendar, MapPin, CreditCard, IdCard, AlertTriangle, Edit2
} from 'lucide-react';

// ─── helpers ────────────────────────────────────────────────────────────────
const BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
// Prefix relative avatar paths (e.g. "/uploads/...") with the backend origin
const getAvatarUrl = (avatar) => {
  if (!avatar) return '';
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;
  return `${BACKEND}${avatar}`;
};

const InputField = ({ label, icon: Icon, type = 'text', readOnly, ...props }) => (
  <div className="space-y-1">
    {label && <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">{label}</label>}
    <div className="relative group">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-600 dark:text-gray-500 group-focus-within:text-blue-400 transition-colors">
          <Icon size={14} />
        </div>
      )}
      <input
        type={type}
        readOnly={readOnly}
        className={`w-full ${Icon ? 'pl-9' : 'pl-3.5'} pr-3.5 py-2 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 ${readOnly ? 'cursor-default opacity-80' : ''}`}
        {...props}
      />
    </div>
  </div>
);

// ─── Tab 1 – Academic Info ──────────────────────────────────────────────────
const AcademicTab = ({ form, onChange, isEditing }) => {
  const isCollege = form.educationLevel === 'college';
  const isSchool  = form.educationLevel === 'school';

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Education Level</label>
        <select
          value={form.educationLevel}
          onChange={e => onChange('educationLevel', e.target.value)}
          className="w-full px-3.5 py-2 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm text-gray-900 dark:text-white disabled:opacity-80"
        >
          <option value="" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Select your level</option>
          <option value="school" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Currently in School (10th / 12th)</option>
          <option value="college" className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">Currently in College / University</option>
        </select>
      </div>

      {(isSchool || isCollege) && (
        <div className="border-t border-gray-200 dark:border-white/10 pt-6 space-y-5">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><School size={18} className="text-blue-400" /> 10th Grade</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField readOnly={!isEditing} label="School Name" icon={School} value={form.schoolName10th} onChange={e => onChange('schoolName10th', e.target.value)} placeholder="e.g. Delhi Public School" />
            <InputField readOnly={!isEditing} label="Percentage / CGPA" icon={BookOpen} value={form.percentage10th} onChange={e => onChange('percentage10th', e.target.value)} placeholder="e.g. 92.4%" />
          </div>
        </div>
      )}

      {(isSchool || isCollege) && (
        <div className="space-y-5">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><School size={18} className="text-purple-400" /> 12th Grade</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField readOnly={!isEditing} label="School Name" icon={School} value={form.schoolName12th} onChange={e => onChange('schoolName12th', e.target.value)} placeholder="e.g. Delhi Public School" />
            <InputField readOnly={!isEditing} label="Percentage / CGPA" icon={BookOpen} value={form.percentage12th} onChange={e => onChange('percentage12th', e.target.value)} placeholder="e.g. 88%" />
          </div>
        </div>
      )}

      {isCollege && (
        <div className="border-t border-gray-200 dark:border-white/10 pt-6 space-y-5">
          <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2"><GraduationCap size={18} className="text-green-400" /> College / University</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField readOnly={!isEditing} label="College Name" icon={GraduationCap} value={form.collegeName} onChange={e => onChange('collegeName', e.target.value)} placeholder="e.g. IIT Delhi" />
            <InputField readOnly={!isEditing} label="Degree / Programme" icon={BookOpen} value={form.degree} onChange={e => onChange('degree', e.target.value)} placeholder="e.g. B.Tech Computer Science" />
            <InputField readOnly={!isEditing} label="Current CGPA" icon={BadgeCheck} value={form.cgpa} onChange={e => onChange('cgpa', e.target.value)} placeholder="e.g. 8.7 / 10" />
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Tab 2 – Additional Info ────────────────────────────────────────────────
const AdditionalTab = ({ form, onChange, isEditing }) => (
  <div className="space-y-5">
    <p className="text-sm text-gray-500">This information is kept private and used only for identity verification.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <InputField readOnly={!isEditing} label="Date of Birth" icon={Calendar} type="date" value={form.dob} onChange={e => onChange('dob', e.target.value)} />
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Aadhar Number</label>
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
            <IdCard size={16} />
          </div>
          <input
            type="text"
            maxLength={14}
            value={form.aadharNumber}
            onChange={e => {
              const cleaned = e.target.value.replace(/\D/g, '').slice(0, 12);
              const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
              onChange('aadharNumber', formatted);
            }}
            readOnly={!isEditing}
            className="w-full pl-9 pr-3.5 py-2 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 tracking-widest disabled:opacity-80"
            placeholder="XXXX XXXX XXXX"
          />
        </div>
      </div>
      <InputField readOnly={!isEditing} label="PAN Number" icon={CreditCard} value={form.panNumber} onChange={e => onChange('panNumber', e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} />
      <div className="md:col-span-2 space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Full Address</label>
        <div className="relative group">
          <div className="absolute top-3 left-0 pl-3.5 flex items-start pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
            <MapPin size={16} />
          </div>
          <textarea
            rows={3}
            readOnly={!isEditing}
            value={form.address}
            onChange={e => onChange('address', e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 bg-gray-100 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 resize-none disabled:opacity-80"
            placeholder="House No., Street, City, State, PIN"
          />
        </div>
      </div>
    </div>
  </div>
);

// ─── Tab 3 – Resume ─────────────────────────────────────────────────────────
const ResumeTab = ({ user, api, onResumeUpdate }) => {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const fileInputRef = useRef();
  const isLocked = user?.educationLevel === 'school' || !user?.educationLevel;

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    setMessage({ type: '', text: '' });

    const formData = new FormData();
    formData.append('resume', file);

    try {
      const res = await api.post('/auth/upload-resume', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage({ type: 'success', text: 'Resume uploaded successfully!' });
      onResumeUpdate(res.data.resumeUrl);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Upload failed. Only PDF files up to 5MB are allowed.' });
    } finally {
      setUploading(false);
    }
  };

  if (isLocked) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-500">
          <AlertTriangle size={40} />
        </div>
        <h3 className="text-xl font-bold">Section Locked</h3>
        <p className="text-gray-500 max-w-sm">
          The Resume section is only available for students currently enrolled in a College or University.
          Please update your Education Level in the <strong>Academic Info</strong> tab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-white/10 hover:border-blue-500/50 rounded-3xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group"
      >
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
          <Upload size={32} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-300 group-hover:text-white transition-colors">
            {uploading ? 'Uploading...' : 'Click to Upload Resume'}
          </p>
          <p className="text-sm text-gray-600 mt-1">PDF only · Max 5MB</p>
        </div>
        <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleUpload} className="hidden" />
      </div>

      {message.text && (
        <div className={`p-4 rounded-2xl text-sm font-medium border ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
          {message.text}
        </div>
      )}

      {user?.resumeUrl && (
        <div className="glass border border-white/10 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400">
              <FileText size={24} />
            </div>
            <div>
              <p className="font-semibold">Current Resume</p>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{user.resumeUrl.split('/').pop()}</p>
            </div>
          </div>
          <a
            href={`${BACKEND}${user.resumeUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition"
          >
            <Eye size={16} /> Preview
          </a>
        </div>
      )}
    </div>
  );
};

// ─── Tab 4 – Account Settings ────────────────────────────────────────────────
const AccountTab = ({ user, form, onChange, isEditing }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <InputField readOnly={!isEditing} label="Display Name" icon={User} value={form.name} onChange={e => onChange('name', e.target.value)} placeholder="Your full name" />
      <InputField readOnly={!isEditing} label="Phone Number" icon={Phone} type="tel" value={form.phone} onChange={e => onChange('phone', e.target.value)} placeholder="+91 XXXXX XXXXX" />
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 ml-1">Email Address</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-600"><Mail size={16} /></div>
          <input
            type="email"
            readOnly
            value={user?.email || ''}
            className="w-full pl-10 pr-3.5 py-2 bg-gray-200 dark:bg-black/10 border border-gray-300 dark:border-white/5 rounded-xl text-sm text-gray-600 dark:text-gray-500 cursor-not-allowed"
          />
        </div>
        <p className="text-[11px] text-gray-600 ml-1">Email cannot be changed after registration.</p>
      </div>
      <InputField readOnly={!isEditing} label="Avatar Image URL" icon={Camera} type="url" value={form.avatar} onChange={e => onChange('avatar', e.target.value)} placeholder="https://..." />
    </div>

    <div className="border-t border-gray-200 dark:border-white/10 pt-6 space-y-4">
      <h4 className="font-semibold text-gray-700 dark:text-gray-300">Change Password</h4>
      <p className="text-sm text-gray-600">Leave blank to keep your current password.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InputField readOnly={!isEditing} label="New Password" icon={Lock} type="password" value={form.password} onChange={e => onChange('password', e.target.value)} placeholder="Min 6 characters" minLength={6} />
        <InputField readOnly={!isEditing} label="Confirm Password" icon={Lock} type="password" value={form.confirmPassword} onChange={e => onChange('confirmPassword', e.target.value)} placeholder="Repeat new password" minLength={6} />
      </div>
    </div>
  </div>
);

// ─── Shared Save Button ──────────────────────────────────────────────────────
const SaveBtn = ({ loading, onSave }) => (
  <div className="flex justify-center pb-6">
    <button
      onClick={onSave}
      disabled={loading}
      className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-60"
    >
      <Save size={16} />
      {loading ? 'Saving...' : 'Save All Changes'}
    </button>
  </div>
);

// ─── Crop Modal Component ───────────────────────────────────────────────────
const CropModal = ({ imageSrc, onCrop, onClose }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageDims, setImageDims] = useState({ width: 0, height: 0 });
  const imageRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const ar = img.width / img.height;
      if (ar >= 1) {
        // Landscape
        setImageDims({
          height: 320,
          width: 320 * ar
        });
      } else {
        // Portrait
        setImageDims({
          width: 320,
          height: 320 / ar
        });
      }
    };
  }, [imageSrc]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    e.target.setPointerCapture(e.pointerId);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = (e) => {
    setIsDragging(false);
    try {
      e.target.releasePointerCapture(e.pointerId);
    } catch {
      // ignore errors
    }
  };

  const handleSave = () => {
    if (!imageRef.current || !containerRef.current) return;

    const img = imageRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // High quality square output size for the avatar
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    // Clear and draw circular clip
    ctx.clearRect(0, 0, size, size);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.clip();

    const rect = img.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();

    // Image position relative to the container
    const imgLeft = rect.left - containerRect.left;
    const imgTop = rect.top - containerRect.top;
    const imgWidth = rect.width;
    const imgHeight = rect.height;

    // The crop circle in container coordinates:
    const cropX = (containerRect.width - 200) / 2; // 60px
    const cropY = (containerRect.height - 200) / 2; // 60px
    const cropSize = 200;

    // Scale factors
    const scaleX = img.naturalWidth / imgWidth;
    const scaleY = img.naturalHeight / imgHeight;

    const sx = (cropX - imgLeft) * scaleX;
    const sy = (cropY - imgTop) * scaleY;
    const sWidth = cropSize * scaleX;
    const sHeight = cropSize * scaleY;

    // Draw the sub-rectangle of the source image onto the canvas
    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);

    canvas.toBlob((blob) => {
      onCrop(blob);
    }, 'image/jpeg', 0.95);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-[32px] p-6 max-w-sm w-full flex flex-col items-center gap-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white">Crop Profile Photo</h3>
        
        {/* Workspace */}
        <div 
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="relative w-80 h-80 bg-slate-950 rounded-2xl overflow-hidden cursor-move select-none touch-none"
        >
          {/* Renders image */}
          {imageDims.width > 0 && (
            <img
              ref={imageRef}
              src={imageSrc}
              alt="To crop"
              draggable={false}
              className="absolute max-w-none origin-center"
              style={{
                width: `${imageDims.width}px`,
                height: `${imageDims.height}px`,
                left: `${(320 - imageDims.width) / 2}px`,
                top: `${(320 - imageDims.height) / 2}px`,
                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
              }}
            />
          )}

          {/* Circular mask overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="w-[200px] h-[200px] rounded-full border-2 border-blue-500 shadow-[0_0_0_9999px_rgba(15,23,42,0.75)]"></div>
          </div>
        </div>

        {/* Zoom Slider */}
        <div className="w-full space-y-2">
          <div className="flex justify-between text-xs text-gray-400 font-medium px-1">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-blue-500 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button 
            onClick={onClose}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-gray-300 text-sm font-semibold rounded-xl transition"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl transition shadow-lg shadow-blue-500/20"
          >
            Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, updateProfile, api, setUser } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedImage, setSelectedImage] = useState(null);
  const avatarInputRef = useRef();
  const [form, setForm] = useState({
    // account
    name:            user?.name || '',
    avatar:          user?.avatar || '',
    phone:           user?.phone || '',
    password:        '',
    confirmPassword: '',
    // academic
    educationLevel:  user?.educationLevel || '',
    schoolName10th:  user?.schoolName10th || '',
    percentage10th:  user?.percentage10th || '',
    schoolName12th:  user?.schoolName12th || '',
    percentage12th:  user?.percentage12th || '',
    collegeName:     user?.collegeName || '',
    degree:          user?.degree || '',
    cgpa:            user?.cgpa || '',
    // additional
    aadharNumber:    user?.aadharNumber || '',
    panNumber:       user?.panNumber || '',
    dob:             user?.dob || '',
    address:         user?.address || '',
  });

  // Sync form state when user details are loaded/updated in the context
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(prev => ({
        ...prev,
        name:            user.name || '',
        avatar:          user.avatar || '',
        phone:           user.phone || '',
        educationLevel:  user.educationLevel || '',
        schoolName10th:  user.schoolName10th || '',
        percentage10th:  user.percentage10th || '',
        schoolName12th:  user.schoolName12th || '',
        percentage12th:  user.percentage12th || '',
        collegeName:     user.collegeName || '',
        degree:          user.degree || '',
        cgpa:            user.cgpa || '',
        aadharNumber:    user.aadharNumber || '',
        panNumber:       user.panNumber || '',
        dob:             user.dob || '',
        address:         user.address || '',
      }));
    }
  }, [user]);

  // Calculate if the form has unsaved changes (commented out as it is currently unused to satisfy eslint)
  /*
  const isDirty = useMemo(() => {
    return (
      form.name !== (user?.name || '') ||
      form.phone !== (user?.phone || '') ||
      form.avatar !== (user?.avatar || '') ||
      form.educationLevel !== (user?.educationLevel || '') ||
      form.schoolName10th !== (user?.schoolName10th || '') ||
      form.percentage10th !== (user?.percentage10th || '') ||
      form.schoolName12th !== (user?.schoolName12th || '') ||
      form.percentage12th !== (user?.percentage12th || '') ||
      form.collegeName !== (user?.collegeName || '') ||
      form.degree !== (user?.degree || '') ||
      form.cgpa !== (user?.cgpa || '') ||
      form.aadharNumber !== (user?.aadharNumber || '') ||
      form.panNumber !== (user?.panNumber || '') ||
      form.dob !== (user?.dob || '') ||
      form.address !== (user?.address || '') ||
      form.password !== '' ||
      form.confirmPassword !== ''
    );
  }, [form, user]);
  */

  const handleChange = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    setMessage({ type: '', text: '' });
    if (form.password && form.password !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }
    setLoading(true);
    try {
      const data = { ...form };
      if (!data.password) { delete data.password; }
      delete data.confirmPassword;
      await updateProfile(data);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      if (setUser) setUser({ ...user, ...data });
      setForm(prev => ({ ...prev, password: '', confirmPassword: '' }));
      // Auto-hide message after 3.5s
      setTimeout(() => setMessage({ type: '', text: '' }), 3500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update.' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3500);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeUpdate = (url) => {
    setUser(prev => ({ ...prev, resumeUrl: url }));
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };


  // ── Teacher/Admin view (simple) ──
  if (user?.role === 'teacher' || user?.role === 'admin') {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Profile Settings</h1>
        {message.text && (
          <div className={`p-4 rounded-2xl text-sm font-medium border ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
            {message.text}
          </div>
        )}
        <div className="glass rounded-[32px] p-8 space-y-5">
          <div className="flex items-center gap-5 pb-6 border-b border-white/10">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              {form.avatar ? <img src={getAvatarUrl(form.avatar)} alt={form.name} className="w-full h-full object-cover" /> : <User size={40} className="text-white" />}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-gray-500 text-sm">{user.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="Display Name" icon={User} value={form.name} onChange={e => handleChange('name', e.target.value)} />
            <InputField label="Avatar URL" icon={Camera} value={form.avatar} onChange={e => handleChange('avatar', e.target.value)} type="url" />
            <InputField label="New Password" icon={Lock} type="password" value={form.password} onChange={e => handleChange('password', e.target.value)} placeholder="Leave blank to keep" />
            <InputField label="Confirm Password" icon={Lock} type="password" value={form.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} />
          </div>
          <SaveBtn loading={loading} onSave={handleSave} />
        </div>
      </div>
    );
  }

  // ── Student 4-tab view ──
  const tabs = [
    { label: 'Academic Info', icon: GraduationCap },
    { label: 'Additional Info', icon: Shield },
    { label: 'Resume / CV', icon: FileText },
    { label: 'Account Settings', icon: Settings },
  ];

  // Derive current institution name from academic data
  const institutionName = form.educationLevel === 'college'
    ? form.collegeName || 'College not set'
    : form.educationLevel === 'school'
    ? form.schoolName12th || form.schoolName10th || 'School not set'
    : 'Not specified';

  const educationLabel = form.educationLevel === 'college'
    ? '🎓 College / University'
    : form.educationLevel === 'school'
    ? '🏫 School'
    : '—';

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';


  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      {/* Notification Banner */}
      <AnimatePresence>
        {message.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 p-4 rounded-2xl text-sm font-medium border ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── LEFT: Portrait Card ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-[32px] p-8 flex flex-col items-center text-center lg:w-72 shrink-0 self-start"
        >
          {/* Decorative gradient header blob */}
          <div className="absolute top-0 left-0 right-0 h-24 rounded-t-[32px] bg-gradient-to-br from-blue-600/20 to-purple-600/20 pointer-events-none" />

          {/* Avatar */}
          <div className="relative mt-4 mb-5 z-10">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-500 border-4 border-white/10 shadow-2xl">
              {form.avatar
                ? <img src={getAvatarUrl(form.avatar)} alt={form.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white"><User size={52} /></div>
              }
            </div>
            {/* Camera button */}
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-9 h-9 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center text-white shadow-lg border-2 border-[#0f0f17] transition"
              title="Change profile photo"
            >
              <Camera size={15} />
            </button>
            {/* Hidden File input for avatar upload */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFileChange}
            />
          </div>

          {/* Name & Edit Button */}
          <div className="flex items-center justify-center gap-2 mb-1 z-10 w-full relative">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <button 
              onClick={() => {
                setIsEditing(!isEditing);
                setActiveTab(0);
              }} 
              className={`w-7 h-7 rounded-full flex items-center justify-center transition ${isEditing ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700'}`}
              title={isEditing ? "Cancel Editing" : "Edit Profile"}
            >
              <Edit2 size={13} />
            </button>
          </div>

          {/* Student ID */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-5 z-10">
            <BadgeCheck size={13} />
            {user?.userId || 'Student ID'}
          </div>

          <div className="w-full border-t border-white/10 pt-5 space-y-4 z-10">
            {/* Date of Joining */}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date of Joining</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center justify-center gap-1.5">
                <Calendar size={14} className="text-purple-400" />
                {joinedDate}
              </span>
            </div>

            {/* Education Level */}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Education Level</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{educationLabel}</span>
            </div>

            {/* Institution */}
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {form.educationLevel === 'college' ? 'College / University' : 'School'}
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug">{institutionName}</span>
            </div>
          </div>

          {/* Role Badge */}
          <div className="mt-6 w-full pt-5 border-t border-gray-200 dark:border-white/10 z-10">
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-blue-400">
              <GraduationCap size={16} /> Student Account
            </div>
          </div>
        </motion.div>

        {/* ── RIGHT: 4-Tab Landscape Card ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass rounded-[32px] overflow-hidden flex-1"
        >
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto">
            {tabs.map((tab, i) => {
              const isActive = activeTab === i;
              const isResumeLocked = i === 2 && (user?.educationLevel === 'school' || !user?.educationLevel);
              return (
                <button
                  key={i}
                  onClick={() => setActiveTab(i)}
                  className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold whitespace-nowrap transition-all relative flex-1 justify-center ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : isResumeLocked
                      ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <tab.icon size={16} />
                  <span className="hidden sm:inline">{tab.label}</span>
                  {isResumeLocked && <span className="ml-1 text-yellow-600">🔒</span>}
                  {isActive && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 0 && <AcademicTab form={form} onChange={handleChange} isEditing={isEditing} />}
                {activeTab === 1 && <AdditionalTab form={form} onChange={handleChange} isEditing={isEditing} />}
                {activeTab === 2 && <ResumeTab user={user} api={api} onResumeUpdate={handleResumeUpdate} />}
                {activeTab === 3 && <AccountTab user={user} form={form} onChange={handleChange} isEditing={isEditing} />}
              </motion.div>
            </AnimatePresence>

            {/* Global Save Button - Bottom Center */}
            {isEditing && (
              <div className="mt-8 flex justify-center border-t border-gray-200 dark:border-white/10 pt-6">
                <SaveBtn loading={loading} onSave={handleSave} />
              </div>
            )}
          </div>
        </motion.div>

      </div>
      
      {selectedImage && (
        <CropModal
          imageSrc={selectedImage}
          onClose={() => {
            setSelectedImage(null);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
          }}
          onCrop={async (croppedBlob) => {
            setSelectedImage(null);
            if (avatarInputRef.current) avatarInputRef.current.value = '';
            
            // Upload the cropped blob
            setMessage({ type: '', text: '' });
            setLoading(true);
            const formData = new FormData();
            formData.append('avatar', croppedBlob, 'avatar.jpg');

            try {
              const res = await api.post('/auth/upload-avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
              });
              setMessage({ type: 'success', text: 'Profile photo updated successfully!' });
              const newAvatarUrl = res.data.avatarUrl;
              setForm(prev => ({ ...prev, avatar: newAvatarUrl }));
              setUser(prev => ({ ...prev, avatar: newAvatarUrl }));
              setTimeout(() => setMessage({ type: '', text: '' }), 3500);
            } catch (err) {
              setMessage({
                type: 'error',
                text: err.response?.data?.message || 'Upload failed. Only image files up to 2MB are allowed.'
              });
              setTimeout(() => setMessage({ type: '', text: '' }), 3500);
            } finally {
              setLoading(false);
            }
          }}
        />
      )}
    </div>
  );
};

export default ProfilePage;

