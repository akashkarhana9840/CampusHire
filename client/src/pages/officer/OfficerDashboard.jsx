import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { officerApi, noticeApi } from '../../api';
import Spinner from '../../components/common/Spinner';
import {
  Shield,
  Users,
  Briefcase,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Bell,
  Clock,
} from 'lucide-react';

const OfficerDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingJobs, setPendingJobs] = useState([]);
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, pendingRes, noticesRes] = await Promise.allSettled([
        officerApi.getStats(),
        officerApi.getPendingJobs(),
        noticeApi.getNotices(),
      ]);

      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
      if (pendingRes.status === 'fulfilled') setPendingJobs(pendingRes.value.data || []);
      if (noticesRes.status === 'fulfilled') setNotices(noticesRes.value.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Officer Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>Campus Placement Cell Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Placement Officer Overview
            </h1>
            <p className="mt-1 text-slate-300 text-sm">
              Verify recruiter registrations, review drive postings, broadcast announcements, and monitor campus hiring activity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/officer/approvals"
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm shadow-md transition-colors"
            >
              <Clock className="w-4 h-4" />
              <span>Pending Drives ({pendingJobs.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Enrolled Students</span>
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats?.totalStudents || 0}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Registered profiles</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Recruiters</span>
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats?.totalRecruiters || 0}
          </div>
          <div className="text-xs text-amber-600 font-semibold mt-1">
            {stats?.pendingRecruiters || 0} Awaiting approval
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Campus Drives</span>
            <Briefcase className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            {stats?.totalJobs || 0}
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">
            {stats?.openJobs || 0} Active & Open
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Total Placed</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-600">
            {stats?.totalHired || 0}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Across {stats?.totalApplications || 0} applications
          </span>
        </div>
      </div>

      {/* Pending Approval Quick Alert */}
      {pendingJobs.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-amber-900 text-base">
                {pendingJobs.length} Job Posting(s) Awaiting Placement Cell Review
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                Companies have submitted new drive details or updated eligibility criteria on open drives. Review criteria before publishing to students.
              </p>
            </div>
          </div>
          <Link
            to="/officer/approvals"
            className="px-4 py-2 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors shadow-sm"
          >
            Review Approvals Queue →
          </Link>
        </div>
      )}

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/officer/users"
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600">
            Manage Users Directory
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Review registered students and approve corporate recruiter accounts.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-indigo-600">
            <span>Explore directory</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        <Link
          to="/officer/jobs"
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
            <Briefcase className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-600">
            All Campus Drives Directory
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Inspect all jobs across pending, open, closed, or rejected states and inspect applicant rosters.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-purple-600">
            <span>View all drives</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>

        <Link
          to="/officer/notices"
          className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4 group-hover:scale-105 transition-transform">
            <Bell className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-600">
            Notices & Announcements
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Publish campus placement announcements visible on student and recruiter dashboards.
          </p>
          <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600">
            <span>Manage notices</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </div>
        </Link>
      </div>
    </div>
  );
};

export default OfficerDashboard;

