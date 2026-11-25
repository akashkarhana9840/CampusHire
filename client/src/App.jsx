import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout & Protected Route
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Public & Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentProfile from './pages/student/StudentProfile';
import StudentJobs from './pages/student/StudentJobs';
import StudentJobDetails from './pages/student/StudentJobDetails';
import StudentApplications from './pages/student/StudentApplications';

// Recruiter Pages (Sub-Phase 4B)
import RecruiterDashboard from './pages/recruiter/RecruiterDashboard';
import ManageJobs from './pages/recruiter/ManageJobs';
import CreateJob from './pages/recruiter/CreateJob';
import JobApplicants from './pages/recruiter/JobApplicants';

// Officer Pages (Sub-Phase 4C)
import OfficerDashboard from './pages/officer/OfficerDashboard';
import ApprovalsQueue from './pages/officer/ApprovalsQueue';
import ManageUsers from './pages/officer/ManageUsers';
import OfficerJobs from './pages/officer/OfficerJobs';
import OfficerNotices from './pages/officer/OfficerNotices';

function App() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Root redirect */}
      <Route
        path="/"
        element={
          user ? (
            <Navigate to={`/${user.role}/dashboard`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Student Protected Routes (Sub-Phase 4A) */}
      <Route element={<ProtectedRoute allowedRoles={['student']} />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/jobs" element={<StudentJobs />} />
        <Route path="/student/jobs/:id" element={<StudentJobDetails />} />
        <Route path="/student/applications" element={<StudentApplications />} />
      </Route>

      {/* Recruiter Protected Routes (Sub-Phase 4B) */}
      <Route element={<ProtectedRoute allowedRoles={['recruiter']} />}>
        <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
        <Route path="/recruiter/jobs" element={<ManageJobs />} />
        <Route path="/recruiter/jobs/create" element={<CreateJob />} />
        <Route path="/recruiter/jobs/:jobId/applicants" element={<JobApplicants />} />
      </Route>

      {/* Officer Protected Routes (Sub-Phase 4C) */}
      <Route element={<ProtectedRoute allowedRoles={['officer']} />}>
        <Route path="/officer/dashboard" element={<OfficerDashboard />} />
        <Route path="/officer/approvals" element={<ApprovalsQueue />} />
        <Route path="/officer/users" element={<ManageUsers />} />
        <Route path="/officer/jobs" element={<OfficerJobs />} />
        <Route path="/officer/notices" element={<OfficerNotices />} />
      </Route>

      {/* Fallback 404 */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800">
            <div className="text-center">
              <h1 className="text-5xl font-extrabold text-slate-300">404</h1>
              <p className="mt-2 text-lg font-medium text-slate-600">Page Not Found</p>
              <a href="/" className="mt-4 inline-block text-indigo-600 font-semibold hover:underline">
                Return to CampusHire
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default App;
