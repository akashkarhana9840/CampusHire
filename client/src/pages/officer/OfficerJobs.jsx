import React, { useState, useEffect } from 'react';
import { officerApi, applicationApi, profileApi } from '../../api';
import Spinner from '../../components/common/Spinner';
import {
  Briefcase,
  Search,
  Users,
  Filter,
  Calendar,
  Building,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

const OfficerJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
  });

  // State for read-only applicant roster modal
  const [viewingApplicantsJob, setViewingApplicantsJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [previewingResumeId, setPreviewingResumeId] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  useEffect(() => {
    fetchAllJobs();
  }, [filters.status, filters.type]);

  const fetchAllJobs = async () => {
    setLoading(true);
    try {
      const params = {
        status: filters.status || undefined,
        type: filters.type || undefined,
        search: filters.search || undefined,
      };
      const res = await officerApi.getAllJobs(params);
      setJobs(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAllJobs();
  };

  const openApplicantsModal = async (job) => {
    setViewingApplicantsJob(job);
    setLoadingApplicants(true);
    try {
      const res = await applicationApi.getJobApplicants(job._id);
      setApplicants(res.data.applicants || []);
    } catch (err) {
      console.error('Failed to load applicants:', err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handlePreviewResume = async (studentUserId) => {
    setPreviewingResumeId(studentUserId);
    try {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      const blob = await profileApi.streamResumeBlob(studentUserId);
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      alert('Could not stream resume PDF: ' + err.message);
    } finally {
      setPreviewingResumeId(null);
    }
  };

  const handleCloseModal = () => {
    setViewingApplicantsJob(null);
    setApplicants([]);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Campus Drives Directory</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor all opportunities across companies. Read-only applicant audit inspection.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company or title..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700"
          >
            <option value="">All Statuses (Pending, Open, Closed, Rejected)</option>
            <option value="open">Open</option>
            <option value="pending">Pending</option>
            <option value="closed">Closed</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700"
          >
            <option value="">All Types</option>
            <option value="job">Job</option>
            <option value="internship">Internship</option>
          </select>
        </div>
      </div>

      {/* Jobs Table */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner size="lg" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No drives match criteria</h3>
          <p className="text-sm text-slate-500 mt-1">Adjust status filters or search terms.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Posted By</th>
                  <th className="py-3 px-4">Criteria</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4 text-right">Applicants Roster</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{job.title}</div>
                      <div className="text-xs text-slate-500">
                        {job.company} • {job.package} • <span className="uppercase font-semibold">{job.type}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>{job.postedBy?.name || 'Recruiter'}</div>
                      <div className="text-slate-400">{job.postedBy?.email}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>Min CGPA: <strong>{job.minCGPA}</strong></div>
                      <div>Max Backlogs: <strong>{job.maxBacklogs}</strong></div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          job.status === 'open'
                            ? 'bg-emerald-100 text-emerald-800'
                            : job.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : job.status === 'rejected'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {job.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(job.deadline).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openApplicantsModal(job)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>View Applicants</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Read-only Officer Applicants Roster Modal */}
      {viewingApplicantsJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-indigo-600 uppercase">
                  Read-Only Placement Audit
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  Applicants for {viewingApplicantsJob.title} ({viewingApplicantsJob.company})
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* In-modal PDF preview if requested */}
            {pdfBlobUrl && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-slate-100 px-4 py-2 flex justify-between items-center text-xs font-semibold text-slate-600 border-b border-slate-200">
                  <span>Candidate Verified Resume (Officer Stream)</span>
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(pdfBlobUrl);
                      setPdfBlobUrl(null);
                    }}
                    className="text-slate-500 hover:text-slate-800 font-bold"
                  >
                    Close PDF ✕
                  </button>
                </div>
                <iframe
                  src={pdfBlobUrl}
                  title="Resume Viewer"
                  className="w-full h-80 border-0"
                />
              </div>
            )}

            {loadingApplicants ? (
              <div className="py-12 flex justify-center items-center">
                <Spinner size="md" />
              </div>
            ) : applicants.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No students have applied to this drive yet.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-100 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Branch & Roll</th>
                      <th className="py-2.5 px-3">CGPA / Backlogs</th>
                      <th className="py-2.5 px-3">Applied Date</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Resume</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.map((app) => (
                      <tr key={app._id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {app.student?.name}
                          <div className="text-[10px] text-slate-400 font-normal">{app.student?.email}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          {app.profileSnapshot?.branch} • {app.profileSnapshot?.rollNo}
                        </td>
                        <td className="py-2.5 px-3">
                          CGPA: <strong>{app.profileSnapshot?.cgpa}</strong> • Backlogs: {app.profileSnapshot?.backlogs}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(app.appliedAt).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full font-bold ${
                              app.status === 'Hired'
                                ? 'bg-emerald-100 text-emerald-800'
                                : app.status === 'Interview'
                                ? 'bg-purple-100 text-purple-800'
                                : app.status === 'Shortlisted'
                                ? 'bg-blue-100 text-blue-800'
                                : app.status === 'Rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {app.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handlePreviewResume(app.student?._id)}
                            disabled={previewingResumeId === app.student?._id}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded border border-slate-200 text-indigo-600 hover:bg-slate-50 font-semibold"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs hover:bg-slate-200"
              >
                Close Audit Roster
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficerJobs;

