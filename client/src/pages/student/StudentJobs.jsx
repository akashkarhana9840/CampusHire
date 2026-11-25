import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobApi, profileApi } from '../../api';
import Spinner from '../../components/common/Spinner';
import {
  Search,
  Briefcase,
  MapPin,
  Calendar,
  IndianRupee,
  ChevronRight,
  Filter,
  CheckCircle,
  XCircle,
} from 'lucide-react';

const StudentJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const [filters, setFilters] = useState({
    search: '',
    type: '',
    branch: '',
    page: 1,
  });

  const branches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML'];

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [filters.page, filters.type, filters.branch]);

  const fetchProfile = async () => {
    try {
      const res = await profileApi.getMe();
      if (res.data) setProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = {
        page: filters.page,
        limit: 9,
        search: filters.search || undefined,
        type: filters.type || undefined,
        branch: filters.branch || undefined,
      };

      const res = await jobApi.getJobs(params);
      setJobs(res.data.jobs || []);
      setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters({ ...filters, page: 1 });
    fetchJobs();
  };

  // Quick eligibility check for job card badge
  const checkCardEligibility = (job) => {
    if (!profile) return { eligible: false, text: 'Profile Incomplete' };
    if (!profile.resumeFileId) return { eligible: false, text: 'No Resume' };
    if (!job.eligibleBranches.includes(profile.branch)) return { eligible: false, text: 'Branch Ineligible' };
    if (profile.cgpa < job.minCGPA) return { eligible: false, text: 'CGPA Criteria' };
    if (profile.backlogs > job.maxBacklogs) return { eligible: false, text: 'Backlogs Criteria' };
    return { eligible: true, text: 'Eligible' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Campus Opportunities</h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore approved jobs & internships. Eligibility status is calculated automatically using your academic record.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3 md:space-y-0 md:flex md:items-center md:gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by company, role title, or skills..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </form>

        <div className="flex items-center gap-3">
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-700"
          >
            <option value="">All Types (Job & Internship)</option>
            <option value="job">Full-time Job</option>
            <option value="internship">Internship</option>
          </select>

          <select
            value={filters.branch}
            onChange={(e) => setFilters({ ...filters, branch: e.target.value, page: 1 })}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white text-slate-700"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content State: Loading, Empty, or Job Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No open drives found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            No active opportunities match your selected filters or current search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => {
            const eligibility = checkCardEligibility(job);

            return (
              <div
                key={job._id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase ${
                        job.type === 'job'
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {job.type}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        eligibility.eligible
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {eligibility.eligible ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>{eligibility.text}</span>
                    </span>
                  </div>

                  <h3 className="mt-3 text-lg font-bold text-slate-900 group-hover:text-indigo-600 line-clamp-1">
                    {job.title}
                  </h3>
                  <p className="text-sm font-semibold text-indigo-600">{job.company}</p>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <IndianRupee className="w-4 h-4 text-slate-400" />
                      <span className="font-semibold text-slate-800">{job.package}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{job.location || 'On-site'}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        Deadline: {new Date(job.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  {job.requiredSkills?.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {job.requiredSkills.slice(0, 3).map((skill, idx) => (
                        <span
                          key={idx}
                          className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md text-[11px]"
                        >
                          {skill}
                        </span>
                      ))}
                      {job.requiredSkills.length > 3 && (
                        <span className="text-[11px] text-slate-400 font-medium">
                          +{job.requiredSkills.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    Min CGPA: <strong className="text-slate-700">{job.minCGPA}</strong>
                  </span>

                  <Link
                    to={`/student/jobs/${job._id}`}
                    className="inline-flex items-center space-x-1 text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                  >
                    <span>View & Apply</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Bar */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <button
            disabled={pagination.page <= 1}
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            disabled={pagination.page >= pagination.pages}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentJobs;

