import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { jobApi, applicationApi, noticeApi } from '../../api';
import Spinner from '../../components/common/Spinner';
import {
  Briefcase,
  Users,
  CheckCircle,
  Clock,
  PlusCircle,
  ArrowRight,
  TrendingUp,
  Bell,
} from 'lucide-react';

const RecruiterDashboard = () => {
  const { user } = useAuth();
  // If recruiter account not active, show pending approval message
  if (user && user.role === 'recruiter' && !user.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="p-6 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          <p>Your recruiter account is pending approval from the Placement Officer. You will be able to access the dashboard once approved.</p>
        </div>
      </div>
    );
  }

  const [notices, setNotices] = useState([]);
  const [applicantStats, setApplicantStats] = useState({
    totalApplicants: 0,
    shortlisted: 0,
    interview: 0,
    hired: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [jobsRes, noticesRes] = await Promise.allSettled([
        jobApi.getRecruiterJobs(),
        noticeApi.getNotices(),
      ]);

      const myJobs = jobsRes.status === 'fulfilled' ? jobsRes.value.data || [] : [];
      setJobs(myJobs);

      if (noticesRes.status === 'fulfilled') {
        setNotices(noticesRes.value.data || []);
      }

      // Fetch applicants count across all jobs
      const appPromises = myJobs.map((j) =>
        applicationApi.getJobApplicants(j._id).catch(() => ({ data: { applicants: [] } }))
      );
      const appResults = await Promise.all(appPromises);

      let total = 0;
      let short = 0;
      let intv = 0;
      let hr = 0;

      appResults.forEach((r) => {
        const list = r?.data?.applicants || [];
        total += list.length;
        list.forEach((app) => {
          if (app.status === 'Shortlisted') short++;
          else if (app.status === 'Interview') intv++;
          else if (app.status === 'Hired') hr++;
        });
      });

      setApplicantStats({
        totalApplicants: total,
        shortlisted: short,
        interview: intv,
        hired: hr,
      });
    } catch (err) {
      console.error('Failed to load recruiter dashboard:', err);
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

  const openJobsCount = jobs.filter((j) => j.status === 'open').length;
  const pendingJobsCount = jobs.filter((j) => j.status === 'pending').length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Recruiter Portal: {user?.name}
            </h1>
            <p className="mt-1 text-slate-300 text-sm">
              Manage your company drives, screen eligible student applicants, and update recruitment rounds.
            </p>
          </div>
          <Link
            to="/recruiter/jobs/create"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Drive</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Total Postings</span>
            <Briefcase className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">{jobs.length}</div>
          <div className="text-xs text-slate-500 mt-1">
            {openJobsCount} Open, {pendingJobsCount} Pending approval
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Total Applicants</span>
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900">
            {applicantStats.totalApplicants}
          </div>
          <span className="text-xs text-blue-600 mt-1 block font-medium">Verified candidates</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Interviews</span>
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-purple-700">
            {applicantStats.interview + applicantStats.shortlisted}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {applicantStats.shortlisted} Shortlisted, {applicantStats.interview} In rounds
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm font-medium">
            <span>Hired Students</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="mt-3 text-2xl sm:text-3xl font-bold text-emerald-600">
            {applicantStats.hired}
          </div>
          <span className="text-xs text-emerald-700 mt-1 block font-medium">Offers extended</span>
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

      {/* Postings Overview Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-slate-900">Your Campus Drives</h2>
          <Link
            to="/recruiter/jobs"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Manage all postings →
          </Link>
        </div>

        {jobs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Briefcase className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600 font-medium">You haven't posted any opportunities yet.</p>
            <Link
              to="/recruiter/jobs/create"
              className="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:underline"
            >
              Create your first job or internship posting →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Title</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Package</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4 rounded-r-lg text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.slice(0, 5).map((job) => (
                  <tr key={job._id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{job.title}</td>
                    <td className="py-3.5 px-4 uppercase text-xs font-bold text-slate-500">
                      {job.type}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{job.package}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          job.status === 'open'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : job.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(job.deadline).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/recruiter/jobs/${job._id}/applicants`}
                        className="inline-flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-500"
                      >
                        <span>Review Applicants</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-1" />
                      </Link>
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

export default RecruiterDashboard;

