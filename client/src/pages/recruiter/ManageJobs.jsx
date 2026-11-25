import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobApi } from '../../api';
import Spinner from '../../components/common/Spinner';
import {
  Briefcase,
  Users,
  Edit2,
  XCircle,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [closingJobId, setClosingJobId] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [notification, setNotification] = useState({ type: '', text: '' });

  const branchesList = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML'];

  useEffect(() => {
    fetchRecruiterJobs();
  }, []);

  const fetchRecruiterJobs = async () => {
    try {
      const res = await jobApi.getRecruiterJobs();
      setJobs(res.data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseJob = async (id) => {
    if (!window.confirm('Are you sure you want to close this job drive? No new applications will be accepted, but you can continue reviewing existing applicants.')) {
      return;
    }
    setClosingJobId(id);
    setNotification({ type: '', text: '' });

    try {
      await jobApi.closeJob(id);
      setNotification({ type: 'success', text: 'Job posting closed successfully.' });
      await fetchRecruiterJobs();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to close job posting' });
    } finally {
      setClosingJobId(null);
    }
  };

  const openEditModal = (job) => {
    setEditingJob({
      ...job,
      eligibleBranches: [...job.eligibleBranches],
      requiredSkills: (job.requiredSkills || []).join(', '),
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    setNotification({ type: '', text: '' });

    try {
      const payload = {
        title: editingJob.title,
        package: editingJob.package,
        location: editingJob.location,
        minCGPA: parseFloat(editingJob.minCGPA),
        maxBacklogs: parseInt(editingJob.maxBacklogs, 10),
        eligibleBranches: editingJob.eligibleBranches,
        requiredSkills: editingJob.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        description: editingJob.description,
      };

      const res = await jobApi.updateJob(editingJob._id, payload);
      setNotification({
        type: 'success',
        text: res.message || 'Job updated successfully.',
      });
      setEditingJob(null);
      await fetchRecruiterJobs();
    } catch (err) {
      setNotification({ type: 'error', text: err.message || 'Failed to update job' });
    } finally {
      setSavingEdit(false);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Manage Job Postings</h1>
          <p className="text-sm text-slate-500 mt-1">
            Review status, edit parameters, close drives, and review candidate rosters.
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

      {notification.text && (
        <div
          className={`p-4 rounded-xl flex items-start space-x-3 text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <span>{notification.text}</span>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Postings Created</h3>
          <p className="text-sm text-slate-500 mt-1">Get started by creating a campus job opportunity.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">Title & Company</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Criteria</th>
                  <th className="py-3 px-4">Deadline</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job._id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{job.title}</div>
                      <div className="text-xs text-slate-500">{job.company} • {job.package}</div>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-xs font-bold text-slate-500">
                      {job.type}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div>Min CGPA: <strong>{job.minCGPA}</strong></div>
                      <div>Max Backlogs: <strong>{job.maxBacklogs}</strong></div>
                      <div className="text-[11px] text-slate-400">
                        {job.eligibleBranches?.join(', ')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {new Date(job.deadline).toLocaleDateString()}
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
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-2">
                        <Link
                          to={`/recruiter/jobs/${job._id}/applicants`}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-indigo-600 hover:bg-indigo-50"
                        >
                          Applicants
                        </Link>
                        {job.status !== 'closed' && (
                          <>
                            <button
                              onClick={() => openEditModal(job)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                              title="Edit Opportunity"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCloseJob(job._id)}
                              disabled={closingJobId === job._id}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50"
                              title="Close Job Posting"
                            >
                              {closingJobId === job._id ? (
                                <Spinner size="sm" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Job Opportunity</h3>
              <button
                onClick={() => setEditingJob(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Warning if job is open */}
            {editingJob.status === 'open' && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Important Notice:</strong> Modifying eligibility criteria (Min CGPA, Backlogs, or Eligible Branches) on an approved <strong>OPEN</strong> job will automatically reset its status to <strong>PENDING</strong> for Placement Officer re-approval.
                </span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Role Title</label>
                  <input
                    type="text"
                    required
                    value={editingJob.title}
                    onChange={(e) => setEditingJob({ ...editingJob, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Package / CTC</label>
                  <input
                    type="text"
                    required
                    value={editingJob.package}
                    onChange={(e) => setEditingJob({ ...editingJob, package: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Min CGPA</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    required
                    value={editingJob.minCGPA}
                    onChange={(e) => setEditingJob({ ...editingJob, minCGPA: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700">Max Backlogs</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editingJob.maxBacklogs}
                    onChange={(e) => setEditingJob({ ...editingJob, maxBacklogs: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Eligible Branches
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {branchesList.map((branch) => {
                    const sel = editingJob.eligibleBranches.includes(branch);
                    return (
                      <button
                        type="button"
                        key={branch}
                        onClick={() => {
                          const cur = [...editingJob.eligibleBranches];
                          setEditingJob({
                            ...editingJob,
                            eligibleBranches: sel
                              ? cur.length > 1
                                ? cur.filter((b) => b !== branch)
                                : cur
                              : [...cur, branch],
                          });
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-semibold border ${
                          sel
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        {branch} {sel ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Required Skills</label>
                <input
                  type="text"
                  value={editingJob.requiredSkills}
                  onChange={(e) =>
                    setEditingJob({ ...editingJob, requiredSkills: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editingJob.description}
                  onChange={(e) =>
                    setEditingJob({ ...editingJob, description: e.target.value })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingJob(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingEdit ? <Spinner size="sm" className="border-white" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageJobs;

