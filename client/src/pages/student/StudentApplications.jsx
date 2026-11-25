import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationApi } from '../../api';
import Spinner from '../../components/common/Spinner';
import {
  Briefcase,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  History,
  Building,
  AlertCircle,
} from 'lucide-react';

const StudentApplications = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAppId, setExpandedAppId] = useState(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await applicationApi.getMyApplications();
      setApplications(res.data || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedAppId(expandedAppId === id ? null : id);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const badgeMap = {
      Applied: 'bg-slate-100 text-slate-800 border-slate-200',
      Shortlisted: 'bg-blue-100 text-blue-800 border-blue-200',
      Interview: 'bg-purple-100 text-purple-800 border-purple-200',
      Hired: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Rejected: 'bg-red-100 text-red-800 border-red-200',
    };
    return badgeMap[status] || 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Applications</h1>
        <p className="text-sm text-slate-500 mt-1">
          Track the status of your applications and view the audit timeline of recruitment stages.
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No applications submitted yet</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            You haven't submitted any job or internship applications.
          </p>
          <Link
            to="/student/jobs"
            className="mt-4 inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            Browse Active Drives
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const isExpanded = expandedAppId === app._id;

            return (
              <div
                key={app._id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
              >
                <div className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {app.jobId?.title || 'Job Title'}
                      </h3>
                      <span className="text-xs uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-semibold">
                        {app.jobId?.type}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-indigo-600 flex items-center gap-1 mt-1">
                      <Building className="w-4 h-4" />
                      <span>{app.jobId?.company}</span>
                    </p>

                    <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-500">
                      <span>Package: <strong className="text-slate-700">{app.jobId?.package}</strong></span>
                      <span>Applied On: {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadge(
                        app.status
                      )}`}
                    >
                      {app.status}
                    </span>

                    <button
                      onClick={() => toggleExpand(app._id)}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span>Timeline</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Status Timeline History Dropdown */}
                {isExpanded && (
                  <div className="bg-slate-50/70 border-t border-slate-100 p-5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Status Change Audit History</span>
                    </h4>

                    <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {app.statusHistory && app.statusHistory.length > 0 ? (
                        app.statusHistory.map((step, index) => (
                          <div key={index} className="relative">
                            <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-600 border-2 border-white shadow-sm" />
                            <div className="text-sm font-bold text-slate-800">{step.status}</div>
                            <div className="text-xs text-slate-500">
                              {new Date(step.changedAt).toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No status updates recorded yet.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentApplications;

