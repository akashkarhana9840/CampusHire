import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { profileApi, applicationApi, jobApi, noticeApi } from '../../api';
import Spinner from '../../components/common/Spinner';
import {
  Briefcase,
  CheckSquare,
  AlertTriangle,
  ArrowRight,
  UserCheck,
  TrendingUp,
  Bell,
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobsCount, setJobsCount] = useState(0);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [profileRes, appRes, jobRes, noticeRes] = await Promise.allSettled([
          profileApi.getMe(),
          applicationApi.getMyApplications(),
          jobApi.getJobs({ limit: 1 }),
          noticeApi.getNotices(),
        ]);

        if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);
        if (appRes.status === 'fulfilled') setApplications(appRes.value.data || []);
        if (jobRes.status === 'fulfilled') setJobsCount(jobRes.value.data?.pagination?.total || 0);
        if (noticeRes.status === 'fulfilled') setNotices(noticeRes.value.data || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const isProfileComplete = profile && profile.resumeFileId;

  // Compute status metrics
  const totalApplied = applications.length;
  const shortlisted = applications.filter((a) => a.status === 'Shortlisted').length;
  const interviews = applications.filter((a) => a.status === 'Interview').length;
  const offers = applications.filter((a) => a.status === 'Hired').length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-700 rounded-2xl p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="mt-1 text-indigo-100 text-sm">
              Your centralized hub for college placements, internship drives, and interview tracking.
            </p>
          </div>
          <Link
            to="/student/jobs"
            className="inline-flex items-center px-4 py-2.5 rounded-xl bg-white text-indigo-700 font-semibold text-sm hover:bg-indigo-50 shadow-sm transition-colors"
          >
            <span>Explore Opportunities</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Link>
        </div>

        {/* Profile alert if incomplete */}
        {!isProfileComplete && (
          <div className="mt-6 p-4 rounded-xl bg-amber-500/20 border border-amber-300/40 text-amber-100 flex items-start space-x-3 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-300 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold text-white">Action Required:</span> Your profile or resume is incomplete! Complete your profile now to become eligible for company job drives.
            </div>
            <Link
              to="/student/profile"
              className="underline font-semibold text-white hover:text-amber-200"
            >
              Update Profile
            </Link>
          </div>
        )}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Open Drives</span>
            <Briefcase className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">{jobsCount}</div>
          <span className="text-xs text-slate-500 mt-1 block">Active on campus</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Total Applied</span>
            <CheckSquare className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">{totalApplied}</div>
          <span className="text-xs text-slate-500 mt-1 block">Applications sent</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Interviews</span>
            <UserCheck className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            {interviews + shortlisted}
          </div>
          <span className="text-xs text-purple-600 mt-1 block font-medium">
            {shortlisted} Shortlisted, {interviews} Scheduled
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Job Offers</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-600">{offers}</div>
          <span className="text-xs text-emerald-700 mt-1 block font-medium">Hired</span>
        </div>
      </div>

      {/* Campus Notices Board */}
      {notices.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600" />
            <span>Placement Cell Announcements</span>
          </h2>
          <div className="space-y-3">
            {notices.slice(0, 3).map((notice) => (
              <div
                key={notice._id}
                className="p-4 rounded-xl bg-slate-50 border border-slate-200/60"
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">{notice.title}</h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {new Date(notice.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                  {notice.message}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Applications Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-slate-900">Recent Applications</h2>
          <Link
            to="/student/applications"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            View all ({applications.length})
          </Link>
        </div>

        {applications.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 font-medium">You haven't applied to any drives yet.</p>
            <Link
              to="/student/jobs"
              className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline"
            >
              Browse active campus opportunities →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Company</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Applied Date</th>
                  <th className="py-3 px-4 rounded-r-lg">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applications.slice(0, 5).map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {app.jobId?.company || 'Company'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{app.jobId?.title || 'Role'}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {app.jobId?.package || 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(app.appliedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                          app.status === 'Hired'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'Interview'
                            ? 'bg-purple-100 text-purple-800'
                            : app.status === 'Shortlisted'
                            ? 'bg-blue-100 text-blue-800'
                            : app.status === 'Rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {app.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;

