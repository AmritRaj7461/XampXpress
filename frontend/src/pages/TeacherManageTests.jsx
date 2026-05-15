import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Trash2, Edit, Search, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const TeacherManageTests = () => {
  const { api } = useContext(AuthContext);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await api.get('/exams');
        setExams(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchExams();
  }, [api]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      try {
        // Backend endpoint for delete might not exist yet, we simulate it or implement it.
        // Assuming /api/exams/:id DELETE exists
        // await api.delete(`/exams/${id}`);
        setExams(exams.filter(e => e._id !== id));
        alert('Test deleted (Simulated)');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const filteredExams = exams.filter(e => 
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 pb-24">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Tests</h1>
          <p className="text-gray-500">View, edit, or delete the exams you've created.</p>
        </div>
        <Link 
          to="/teacher/create-test"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-lg shadow-blue-500/30 transition w-fit"
        >
          <Plus size={20} /> Create New Test
        </Link>
      </div>

      <div className="glass p-6 rounded-3xl border border-white/50 dark:border-gray-700/50">
        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 rounded-xl mb-6 border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-500 transition">
          <Search size={20} className="text-gray-400" />
          <input 
            type="text"
            placeholder="Search by title or subject..."
            className="bg-transparent w-full outline-none text-gray-700 dark:text-gray-200"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>
        ) : filteredExams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-500 text-sm tracking-wider uppercase">
                  <th className="py-4 px-4 font-bold">Exam Title</th>
                  <th className="py-4 px-4 font-bold">Subject</th>
                  <th className="py-4 px-4 font-bold">Duration</th>
                  <th className="py-4 px-4 font-bold">Questions</th>
                  <th className="py-4 px-4 font-bold">Created Date</th>
                  <th className="py-4 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam, idx) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    key={exam._id} 
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group"
                  >
                    <td className="py-4 px-4 font-bold">{exam.title}</td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-md text-xs font-semibold">{exam.subject}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{exam.timeLimit} mins</td>
                    <td className="py-4 px-4 text-gray-600 dark:text-gray-400">{exam.questions.length}</td>
                    <td className="py-4 px-4 text-gray-500 text-sm">{new Date(exam.createdAt).toLocaleDateString()}</td>
                    <td className="py-4 px-4 flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition">
                      <button className="p-2 bg-gray-100 hover:bg-blue-100 dark:bg-gray-700 dark:hover:bg-blue-900/40 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition" title="Edit">
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(exam._id)}
                        className="p-2 bg-gray-100 hover:bg-red-100 dark:bg-gray-700 dark:hover:bg-red-900/40 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition" title="Delete"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-gray-500">
            No tests found. Try adjusting your search or create a new test.
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherManageTests;
