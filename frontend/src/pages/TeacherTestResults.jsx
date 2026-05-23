import { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherTestResults = () => {
  const { id } = useParams();
  const { api } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await api.get(`/exams/${id}/results`);
        setResults(res.data);
      } catch (err) {
        console.error(err);
        alert('Failed to load results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [id, api]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <Link to="/teacher/manage-tests" className="text-gray-400 hover:text-white flex items-center mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Manage Tests
          </Link>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Test Results
          </h1>
          <p className="text-gray-400 mt-1">Review student performance and proctoring logs.</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900/50 text-gray-400 text-sm border-b border-gray-700">
                <th className="p-4 font-semibold">Student Name</th>
                <th className="p-4 font-semibold">Email</th>
                <th className="p-4 font-semibold">Score</th>
                <th className="p-4 font-semibold">Accuracy</th>
                <th className="p-4 font-semibold text-center">Status</th>
                <th className="p-4 font-semibold text-right">Violation Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700/50">
              {results.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No results found for this exam yet.
                  </td>
                </tr>
              ) : (
                results.map((result) => (
                  <tr key={result._id} className="hover:bg-gray-700/20 transition-colors">
                    <td className="p-4 font-medium">{result.student?.name || 'Unknown'}</td>
                    <td className="p-4 text-gray-400">{result.student?.email || 'Unknown'}</td>
                    <td className="p-4">
                      <span className="text-indigo-400 font-bold">{result.score}</span>
                      <span className="text-gray-500 text-xs ml-1">/ {result.totalQuestions}</span>
                    </td>
                    <td className="p-4">
                      {result.accuracy.toFixed(1)}%
                    </td>
                    <td className="p-4 text-center">
                      {result.violated ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/50 text-red-400 border border-red-800">
                          <ShieldAlert className="w-3 h-3 mr-1" /> Terminated
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-900/50 text-emerald-400 border border-emerald-800">
                          Completed
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {result.violationLogs && result.violationLogs.length > 0 ? (
                        <div className="flex flex-col gap-2 items-end">
                          {result.violationLogs.map((log, idx) => (
                            <button
                              key={idx}
                              onClick={() => setSelectedLog(log)}
                              className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1 px-2 rounded flex items-center transition-colors"
                            >
                              <ImageIcon className="w-3 h-3 mr-1 text-red-400" />
                              View Log #{idx + 1}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm">Clean</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedLog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-gray-900 rounded-2xl border border-gray-700 max-w-3xl w-full overflow-hidden shadow-2xl"
            >
              <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-900/50">
                <h3 className="text-lg font-bold text-red-400 flex items-center">
                  <ShieldAlert className="w-5 h-5 mr-2" /> Proctoring Incident Report
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-1.5 rounded-full hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6">
                <div className="mb-4 space-y-2">
                  <p className="text-gray-300"><strong className="text-gray-500 uppercase text-xs tracking-wider">Reason:</strong> {selectedLog.reason}</p>
                  <p className="text-gray-300"><strong className="text-gray-500 uppercase text-xs tracking-wider">Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}</p>
                </div>
                {selectedLog.screenshotBase64 ? (
                  <div className="rounded-lg overflow-hidden border-2 border-red-900/50 shadow-lg relative">
                    <div className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold uppercase tracking-wider shadow-md">
                      Webcam Snapshot
                    </div>
                    <img 
                      src={selectedLog.screenshotBase64} 
                      alt="Violation Snapshot" 
                      className="w-full h-auto"
                    />
                  </div>
                ) : (
                  <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
                    <ImageIcon className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                    <p className="text-gray-500">No snapshot available for this incident.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TeacherTestResults;
