import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import Navbar from './components/Navbar';
import MainLayout from './components/MainLayout';
import AuthPage from './pages/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherCreateTest from './pages/TeacherCreateTest';
import TeacherEditTest from './pages/TeacherEditTest';
import TeacherManageTests from './pages/TeacherManageTests';
import TeacherSettings from './pages/TeacherSettings';
import StudentTestList from './pages/StudentTestList';
import StudentHistory from './pages/StudentHistory';
import ProfilePage from './pages/ProfilePage';
import CameraCheck from './components/Proctoring/CameraCheck';
import ExamPage from './pages/ExamPage';
import AIExamPage from './pages/AIExamPage';
import ResultPage from './pages/ResultPage';
import MobileBlocker from './components/MobileBlocker';

const RootRoute = () => {
  const { user, loading } = useContext(AuthContext);
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  
  return user.role === 'student' ? <Navigate to="/student" /> : <Navigate to="/teacher" />;
};

function App() {
  return (
    <AuthProvider>
      <MobileBlocker>
        <Router>
          <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <Routes>
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            
            {/* Exam Pages - Full Screen (No Navbar/Sidebar) */}
            <Route path="/student/exam/:id/setup" element={
              <ProtectedRoute allowedRoles={['student']}>
                <CameraCheck />
              </ProtectedRoute>
            } />
            <Route path="/student/exam/:id" element={
              <ProtectedRoute allowedRoles={['student']}>
                <ExamPage />
              </ProtectedRoute>
            } />
            <Route path="/student/result/:id" element={
              <ProtectedRoute allowedRoles={['student']}>
                <>
                  <Navbar />
                  <ResultPage />
                </>
              </ProtectedRoute>
            } />

            <Route 
              path="/*" 
              element={
                <>
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<RootRoute />} />
                    
                    {/* Student Routes */}
                    <Route path="/student" element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <MainLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<StudentDashboard />} />
                      <Route path="tests" element={<StudentTestList />} />
                      <Route path="history" element={<StudentHistory />} />
                      <Route path="profile" element={<ProfilePage />} />
                      <Route path="ai-exam" element={<AIExamPage />} />
                    </Route>

                    {/* Teacher Routes */}
                    <Route path="/teacher" element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <MainLayout />
                      </ProtectedRoute>
                    }>
                      <Route index element={<TeacherDashboard />} />
                      <Route path="create-test" element={<TeacherCreateTest />} />
                      <Route path="edit-test/:id" element={<TeacherEditTest />} />
                      <Route path="tests" element={<TeacherManageTests />} />
                      <Route path="settings" element={<TeacherSettings />} />
                      <Route path="profile" element={<ProfilePage />} />
                    </Route>

                  </Routes>
                </>
              } 
            />
          </Routes>
          </div>
        </Router>
      </MobileBlocker>
    </AuthProvider>
  );
}

export default App;
