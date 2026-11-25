import React, { useState, useEffect } from 'react';
import { officerApi } from '../../api';
import Spinner from '../../components/common/Spinner';
import {
  CheckCircle,
  XCircle,
  Briefcase,
  Calendar,
  IndianRupee,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Building,
} from 'lucide-react';

const ApprovalsQueue = () => {
  const [pendingJobs, setPendingJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchPendingJobs();
  }, []);

  const fetchPendingJobs = async () => {
    setLoading(true);
    try {
      const res = await officerApi.getPendingJobs();
      setPendingJobs(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to load approvals queue' });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (jobId, status) => {
    setProcessingId(jobId);
    setMessage({ type: '', text: '' });

    try {
      await officerApi.reviewJob(jobId, status);
      setMessage({
        type: 'success',
        text: `Job posting successfully ${status === 'open' ? 'Approved & Opened' : 'Rejected'}.`,
      });
      setSelectedJob(null);
      await fetchPendingJobs();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Review failed' });
    } finally {
      setProcessingId(null);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Job Approvals Queue</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review job and internship postings submitted by recruiters. Approved opportunities are immediately published to eligible students.
        </p>
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
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {pendingJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Approvals Queue is Clear!</h3>
          <p className="text-sm text-slate-500 mt-1">
            There are no pending drive submissions requiring placement officer review right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {pendingJobs.map((job) => (
            <div
              key={job._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:border-slate-300 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase bg-indigo-50 text-indigo-700">
                    {job.type}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                    Pending Approval
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>

                <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>{job.company}</span>
                  <span className="text-slate-400">• Posted by: {job.postedBy?.name} ({job.postedBy?.email})</span>
                </p>

                <div className="flex flex-wrap gap-4 text-xs text-slate-600 pt-1">
                  <span>Package: <strong className="text-slate-800">{job.package}</strong></span>
                  <span>Min CGPA: <strong className="text-slate-800">{job.minCGPA}</strong></span>
                  <span>Max Backlogs: <strong className="text-slate-800">{job.maxBacklogs}</strong></span>
                  <span>Deadline: <strong>{new Date(job.deadline).toLocaleDateString()}</strong></span>
                </div>

                <div className="text-xs text-slate-500">
                  Eligible Branches: <span className="font-semibold text-slate-700">{job.eligibleBranches?.join(', ')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                <button
                  onClick={() => setSelectedJob(job)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  View Details
                </button>

                <button
                  onClick={() => handleReview(job._id, 'rejected')}
                  disabled={processingId === job._id}
                  className="px-4 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 text-xs font-bold hover:bg-red-100 transition-colors disabled:opacity-40"
                >
                  Reject
                </button>

                <button
                  onClick={() => handleReview(job._id, 'open')}
                  disabled={processingId === job._id}
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-40 shadow-sm"
                >
                  {processingId === job._id ? <Spinner size="sm" className="border-white mr-1" /> : null}
                  <span>Approve & Open</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Details Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">{selectedJob.title} - {selectedJob.company}</h3>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Description</span>
                <p className="mt-1 text-slate-700 whitespace-pre-line leading-relaxed text-xs">
                  {selectedJob.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>Package: <strong className="text-slate-800">{selectedJob.package}</strong></div>
                <div>Location: <strong className="text-slate-800">{selectedJob.location}</strong></div>
                <div>Min CGPA: <strong className="text-slate-800">{selectedJob.minCGPA}</strong></div>
                <div>Max Backlogs: <strong className="text-slate-800">{selectedJob.maxBacklogs}</strong></div>
              </div>

              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Eligible Branches</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedJob.eligibleBranches?.map((b) => (
                    <span key={b} className="px-2 py-0.5 rounded text-xs bg-slate-100 font-semibold text-slate-700">
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {selectedJob.requiredSkills?.length > 0 && (
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase">Required Skills</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {selectedJob.requiredSkills.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded text-xs bg-indigo-50 font-semibold text-indigo-700">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600"
              >
                Close
              </button>
              <button
                onClick={() => handleReview(selectedJob._id, 'rejected')}
                className="px-4 py-2 rounded-lg bg-red-50 text-red-700 font-bold text-xs"
              >
                Reject
              </button>
              <button
                onClick={() => handleReview(selectedJob._id, 'open')}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-bold text-xs"
              >
                Approve & Publish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApprovalsQueue;

