import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Sparkles, FileText, Upload, X } from 'lucide-react';
import { motion } from 'framer-motion';

const TeacherCreateTest = () => {
  const { api } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [examData, setExamData] = useState({
    title: '',
    subject: '',
    timeLimit: 30,
    examDate: new Date().toISOString().split('T')[0],
    assignedTo: [],
    questions: [
      { questionText: '', options: ['', '', '', ''], correctAnswer: '' }
    ]
  });
  const [aiInputText, setAiInputText] = useState('');
  const [showAIImport, setShowAIImport] = useState(false);
  const [parsingAI, setParsingAI] = useState(false);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/auth/students');
        setStudents(res.data);
      } catch (error) {
        console.error('Failed to fetch students:', error);
      }
    };
    fetchStudents();
  }, []);

  const handleAssigneeChange = (studentId) => {
    if (studentId === 'all') {
      setExamData({ ...examData, assignedTo: [] });
      return;
    }
    
    let newAssignees = [...examData.assignedTo];
    if (newAssignees.includes(studentId)) {
      newAssignees = newAssignees.filter(id => id !== studentId);
    } else {
      newAssignees.push(studentId);
    }
    setExamData({ ...examData, assignedTo: newAssignees });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQs = [...examData.questions];
    updatedQs[index][field] = value;
    setExamData({ ...examData, questions: updatedQs });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updatedQs = [...examData.questions];
    updatedQs[qIndex].options[oIndex] = value;
    setExamData({ ...examData, questions: updatedQs });
  };

  const addQuestion = () => {
    setExamData({
      ...examData,
      questions: [...examData.questions, { questionText: '', options: ['', '', '', ''], correctAnswer: '' }]
    });
  };

  const removeQuestion = (index) => {
    if (examData.questions.length > 1) {
      const updatedQs = examData.questions.filter((_, i) => i !== index);
      setExamData({ ...examData, questions: updatedQs });
    }
  };

  const handleAIImport = async (file = null) => {
    setParsingAI(true);
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        formData.append('text', aiInputText);
      }

      const res = await api.post('/ai/parse-questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.questions) {
        // Append or replace? Let's append if current is empty or just one blank Q
        const currentQs = examData.questions;
        const isEmpty = currentQs.length === 1 && !currentQs[0].questionText;
        
        setExamData({
          ...examData,
          questions: isEmpty ? res.data.questions : [...currentQs, ...res.data.questions]
        });
        setAiInputText('');
        setShowAIImport(false);
      }
    } catch (err) {
      console.error(err);
      alert('AI Parsing failed. Please try again with clearer text.');
    } finally {
      setParsingAI(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/exams', examData);
      navigate('/teacher');
    } catch (err) {
      console.error(err);
      alert('Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-24">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Create New Exam</h1>
          <p className="text-gray-500">Configure exam settings and add questions.</p>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/30 transition disabled:opacity-50"
        >
          <Save size={20} />
          {loading ? 'Saving...' : 'Save Exam'}
        </button>
      </div>

      <div className="glass p-6 rounded-2xl space-y-4">
        <h2 className="text-xl font-bold border-b border-gray-200 dark:border-gray-700 pb-4">Exam Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Exam Title</label>
            <input 
              type="text" 
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={examData.title}
              onChange={(e) => setExamData({...examData, title: e.target.value})}
              required
              placeholder="e.g. Midterm Physics Exam"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Subject</label>
            <input 
              type="text" 
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={examData.subject}
              onChange={(e) => setExamData({...examData, subject: e.target.value})}
              required
              placeholder="e.g. Physics"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Time Limit (minutes)</label>
            <input 
              type="number" 
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={examData.timeLimit}
              onChange={(e) => setExamData({...examData, timeLimit: parseInt(e.target.value) || 0})}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Exam Date</label>
            <input 
              type="date" 
              className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition"
              value={examData.examDate}
              onChange={(e) => setExamData({...examData, examDate: e.target.value})}
              required
            />
          </div>
        </div>
        
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <label className="block text-sm font-medium mb-3">Assign To</label>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition">
              <input 
                type="checkbox" 
                checked={examData.assignedTo.length === 0}
                onChange={() => handleAssigneeChange('all')}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="font-medium">Entire Class</span>
            </label>
            
            {students.map(student => (
              <label key={student._id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition">
                <input 
                  type="checkbox" 
                  checked={examData.assignedTo.includes(student._id)}
                  onChange={() => handleAssigneeChange(student._id)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center overflow-hidden">
                    {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" /> : <span className="text-blue-600 text-xs font-bold">{student.name.charAt(0)}</span>}
                  </div>
                  <div>
                    <span className="block font-medium leading-none">{student.name}</span>
                    <span className="text-xs text-gray-500">{student.email}</span>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Questions ({examData.questions.length})</h2>
          <button 
            onClick={() => setShowAIImport(!showAIImport)} 
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium bg-purple-50 dark:bg-purple-900/30 px-4 py-2 rounded-lg transition"
          >
            <Sparkles size={18} /> {showAIImport ? 'Cancel Import' : 'AI Bulk Import'}
          </button>
        </div>

        {/* AI Import Section */}
        {showAIImport && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="glass p-6 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-900/50 bg-purple-50/10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold mb-1">
                  <FileText size={18} />
                  <span>Paste Raw Text</span>
                </div>
                <textarea 
                  className="w-full h-40 p-3 rounded-xl border border-purple-100 dark:border-purple-900/30 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-purple-500 outline-none transition text-sm"
                  placeholder="Paste questions here... e.g.
1. What is React?
A. Library B. Framework...
Ans: A"
                  value={aiInputText}
                  onChange={(e) => setAiInputText(e.target.value)}
                />
                <button 
                  onClick={() => handleAIImport()}
                  disabled={parsingAI || !aiInputText.trim()}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {parsingAI ? 'Parsing with AI...' : <><Sparkles size={18} /> Process Text</>}
                </button>
              </div>

              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-purple-200 dark:border-purple-900/30 rounded-xl bg-white/50 dark:bg-gray-800/50">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 mb-4">
                  <Upload size={32} />
                </div>
                <h3 className="font-bold mb-1 text-center">Upload PDF / DOCX</h3>
                <p className="text-xs text-gray-500 text-center mb-4">AI will extract questions and answers automatically</p>
                <input 
                  type="file" 
                  id="ai-file-upload" 
                  className="hidden" 
                  accept=".pdf,.docx"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) handleAIImport(file);
                  }}
                />
                <label 
                  htmlFor="ai-file-upload"
                  className="px-6 py-2 bg-white dark:bg-gray-700 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-600 dark:text-purple-300 font-bold hover:bg-purple-50 transition cursor-pointer"
                >
                  {parsingAI ? 'Processing File...' : 'Select File'}
                </label>
              </div>
            </div>
          </motion.div>
        )}

        {examData.questions.map((q, qIndex) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={qIndex} 
            className="glass p-6 rounded-2xl relative"
          >
            <button 
              onClick={() => removeQuestion(qIndex)}
              className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"
            >
              <Trash2 size={20} />
            </button>
            <div className="flex gap-4 items-start mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold shrink-0 mt-1">
                {qIndex + 1}
              </div>
              <div className="w-full">
                <textarea 
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none h-24"
                  placeholder="Enter question text here..."
                  value={q.questionText}
                  onChange={(e) => handleQuestionChange(qIndex, 'questionText', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pl-12 grid grid-cols-1 md:grid-cols-2 gap-4">
              {q.options.map((opt, oIndex) => (
                <div key={oIndex} className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name={`correct-${qIndex}`}
                    checked={q.correctAnswer === opt && opt !== ''}
                    onChange={() => handleQuestionChange(qIndex, 'correctAnswer', opt)}
                    className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <input 
                    type="text" 
                    className={`w-full p-3 rounded-lg border bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none transition ${q.correctAnswer === opt && opt !== '' ? 'border-green-500 dark:border-green-500 ring-1 ring-green-500' : 'border-gray-200 dark:border-gray-700'}`}
                    placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                    value={opt}
                    onChange={(e) => {
                      handleOptionChange(qIndex, oIndex, e.target.value);
                      if (q.correctAnswer === q.options[oIndex]) {
                        handleQuestionChange(qIndex, 'correctAnswer', e.target.value);
                      }
                    }}
                    required
                  />
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Add Question Button Moved to Bottom */}
        <button 
          onClick={addQuestion} 
          className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-bold bg-blue-50 dark:bg-blue-900/20 border-2 border-dashed border-blue-200 dark:border-blue-900/30 py-6 rounded-2xl transition hover:border-blue-400 group"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus size={24} />
          </div>
          <span className="text-lg">Add New Question</span>
        </button>
      </div>
    </div>
  );
};

export default TeacherCreateTest;
