import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { applicationApi, profileApi } from '../../api';
import Spinner from '../../components/common/Spinner';
import {
  ArrowLeft,
  Users,
  FileText,
  CheckCircle,
  Clock,
  Filter,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

const JobApplicants = () => {
  const { jobId } = useParams();
  const [jobInfo, setJobInfo] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [previewingResumeId, setPreviewingResumeId] = useState(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [forbiddenError, setForbiddenError] = useState(false);

  useEffect(() => {
    fetchApplicants();
  }, [jobId, statusFilter]);

  const fetchApplicants = async () => {
    setLoading(true);
    setForbiddenError(false);
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await applicationApi.getJobApplicants(jobId, params);
      setJobInfo(res.data.job);
      setApplicants(res.data.applicants || []);
    } catch (err) {
      console.error(err);
      if (err.status === 403) {
        setForbiddenError(true);
      } else {
        setMessage({ type: 'error', text: err.message || 'Failed to load applicants roster' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Valid Next Transitions based on backend Finite State Machine
  const getNextAllowedStatuses = (currentStatus) => {
    const transitions = {
      Applied: ['Shortlisted', 'Rejected'],
      Shortlisted: ['Interview', 'Rejected'],
      Interview: ['Hired', 'Rejected'],
      Hired: [],
      Rejected: [],
    };
    return transitions[currentStatus] || [];
  };

  const handleStatusChange = async (appId, newStatus) => {
    setUpdatingId(appId);
    setMessage({ type: '', text: '' });

    try {
      await applicationApi.updateStatus(appId, newStatus);
      setMessage({ type: 'success', text: `Applicant status transitioned to "${newStatus}"` });
      await fetchApplicants();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update applicant status' });
    } finally {
      setUpdatingId(null);
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
      setMessage({ type: 'error', text: 'Failed to load resume PDF: ' + err.message });
    } finally {
      setPreviewingResumeId(null);
    }
  };

  const handleClosePreview = () => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  if (forbiddenError) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-red-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Access Denied (403)</h2>
        <p className="text-sm text-slate-600 mt-2">
          You do not have permission to view applicants for this job posting. Recruiters can only access candidates who applied to their own job drives.
        </p>
        <Link
          to="/recruiter/jobs"
          className="mt-6 inline-flex items-center px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
        >
          Return to My Postings
        </Link>
      </div>
    );
  }

  if (loading && !jobInfo) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/recruiter/jobs"
        className="inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to my postings</span>
      </Link>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div>
          <span className="text-xs uppercase font-bold text-indigo-600">
            {jobInfo?.company} • {jobInfo?.status}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Applicants: {jobInfo?.title}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Showing verified academic snapshot frozen at application submission.
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"
          >
            <option value="">All Statuses ({applicants.length})</option>
            <option value="Applied">Applied</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="Interview">Interview</option>
            <option value="Hired">Hired</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl flex items-start space-x-3 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* PDF Stream Preview Modal */}
      {pdfBlobUrl && (
        <div className="border border-slate-200 rounded-xl overflow-hidden shadow-lg bg-white">
          <div className="bg-slate-100 px-4 py-2.5 flex justify-between items-center text-xs font-semibold text-slate-600 border-b border-slate-200">
            <span>Verified Candidate Resume (Authenticated Stream)</span>
            <button
              onClick={handleClosePreview}
              className="text-slate-500 hover:text-slate-800 font-bold"
            >
              Close Preview ✕
            </button>
          </div>
          <iframe
            src={pdfBlobUrl}
            title="Resume Viewer"
            className="w-full h-96 border-0"
          />
        </div>
      )}

      {/* Applicant Table */}
      {applicants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No applicants found</h3>
          <p className="text-sm text-slate-500 mt-1">
            {statusFilter
              ? `No candidates currently in "${statusFilter}" state.`
              : 'No students have applied to this drive yet.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Branch & Roll</th>
                  <th className="py-3 px-4">CGPA / Backlogs</th>
                  <th className="py-3 px-4">Snapshot Skills</th>
                  <th className="py-3 px-4">Resume</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4 text-right">Update Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {applicants.map((app) => {
                  const snap = app.profileSnapshot || {};
                  const allowedNext = getNextAllowedStatuses(app.status);

                  return (
                    <tr key={app._id} className="hover:bg-slate-50/50">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{app.student?.name}</div>
                        <div className="text-xs text-slate-500">{app.student?.email}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                        <div>Branch: <strong>{snap.branch || 'N/A'}</strong></div>
                        <div className="text-slate-500">{snap.rollNo || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        <div>CGPA: <strong className="text-slate-800">{snap.cgpa}</strong></div>
                        <div className="text-slate-500">Backlogs: {snap.backlogs}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {snap.skills?.slice(0, 3).map((s, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handlePreviewResume(app.student?._id)}
                          disabled={previewingResumeId === app.student?._id}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                        >
                          {previewingResumeId === app.student?._id ? (
                            <Spinner size="sm" />
                          ) : (
                            <ExternalLink className="w-3.5 h-3.5" />
                          )}
                          <span>Resume PDF</span>
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
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
                      <td className="py-3.5 px-4 text-right">
                        {allowedNext.length === 0 ? (
                          <span className="text-xs text-slate-400 font-medium italic">
                            Terminal State
                          </span>
                        ) : (
                          <div className="inline-flex items-center space-x-1.5">
                            {allowedNext.map((nextSt) => (
                              <button
                                key={nextSt}
                                onClick={() => handleStatusChange(app._id, nextSt)}
                                disabled={updatingId !== null}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                                  nextSt === 'Rejected'
                                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                                    : 'border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                                }`}
                              >
                                {updatingId === app._id ? 'Updating...' : nextSt}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobApplicants;

