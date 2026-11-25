import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { jobApi, profileApi, applicationApi } from '../../api';
import Spinner from '../../components/common/Spinner';
import {
  Briefcase,
  MapPin,
  Calendar,
  IndianRupee,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  Building,
} from 'lucide-react';

const StudentJobDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchJobAndStudentState();
  }, [id]);

  const fetchJobAndStudentState = async () => {
    try {
      const [jobRes, profileRes, myAppsRes] = await Promise.allSettled([
        jobApi.getJobById(id),
        profileApi.getMe(),
        applicationApi.getMyApplications(),
      ]);

      if (jobRes.status === 'fulfilled') setJob(jobRes.value.data);
      if (profileRes.status === 'fulfilled') setProfile(profileRes.value.data);

      if (myAppsRes.status === 'fulfilled' && myAppsRes.value.data) {
        const found = myAppsRes.value.data.find((app) => app.jobId?._id === id);
        if (found) setAlreadyApplied(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateEligibility = () => {
    const reasons = [];
    if (!profile) return { eligible: false, reasons: ['Please create your student academic profile first.'] };
    if (!profile.resumeFileId) reasons.push('Resume is not uploaded. Please upload your resume in PDF format.');

    const studentBranchNorm = (profile.branch || '').toUpperCase();
    const eligibleNorm = (job?.eligibleBranches || []).map((b) => b.toUpperCase());
    if (!eligibleNorm.includes(studentBranchNorm)) {
      reasons.push(`Your branch (${profile.branch}) is not eligible for this role. Eligible branches: [${job.eligibleBranches.join(', ')}]`);
    }

    if (profile.cgpa < job?.minCGPA) {
      reasons.push(`Your CGPA (${profile.cgpa}) is lower than minimum requirement (${job.minCGPA})`);
    }

    if (profile.backlogs > job?.maxBacklogs) {
      reasons.push(`You have ${profile.backlogs} backlog(s), which exceeds allowed limit (${job.maxBacklogs})`);
    }

    return {
      eligible: reasons.length === 0,
      reasons,
    };
  };

  const handleApply = async () => {
    setApplying(true);
    setFeedback({ type: '', text: '' });

    try {
      await applicationApi.applyToJob(id);
      setAlreadyApplied(true);
      setFeedback({
        type: 'success',
        text: 'Application submitted successfully! Academic snapshot and verified resume attached.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message || 'Failed to submit application',
      });
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Job Posting Not Found</h2>
        <Link to="/student/jobs" className="mt-4 inline-block text-sm text-indigo-600 font-semibold">
          ← Back to opportunities
        </Link>
      </div>
    );
  }

  const eligibility = calculateEligibility();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        to="/student/jobs"
        className="inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to all opportunities</span>
      </Link>

      {feedback.text && (
        <div
          className={`p-4 rounded-xl flex items-start space-x-3 text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                job.type === 'job'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'bg-emerald-50 text-emerald-700'
              }`}
            >
              {job.type}
            </span>
            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {job.title}
            </h1>
            <p className="mt-1 text-lg font-semibold text-indigo-600 flex items-center gap-1.5">
              <Building className="w-5 h-5" />
              <span>{job.company}</span>
            </p>
          </div>

          <div>
            {alreadyApplied ? (
              <span className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-sm font-bold">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Applied Already</span>
              </span>
            ) : (
              <button
                onClick={handleApply}
                disabled={!eligibility.eligible || applying}
                className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-100 transition-colors"
              >
                {applying ? <Spinner size="sm" className="border-white mr-1" /> : null}
                <span>Submit Application</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick specs */}
        <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-500 text-xs block">Package / Stipend</span>
            <strong className="text-slate-900">{job.package}</strong>
          </div>
          <div>
            <span className="text-slate-500 text-xs block">Location</span>
            <strong className="text-slate-900">{job.location || 'On-site'}</strong>
          </div>
          <div>
            <span className="text-slate-500 text-xs block">Deadline</span>
            <strong className="text-slate-900">
              {new Date(job.deadline).toLocaleDateString()}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 text-xs block">Min CGPA Required</span>
            <strong className="text-slate-900">{job.minCGPA}</strong>
          </div>
        </div>
      </div>

      {/* Eligibility Breakdown Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          {eligibility.eligible ? (
            <CheckCircle className="w-5 h-5 text-emerald-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          )}
          <span>Your Eligibility Status</span>
        </h2>

        {eligibility.eligible ? (
          <p className="text-sm text-emerald-800 bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            You meet all academic criteria (Branch, CGPA, Backlogs, and Verified Resume) for this opportunity.
          </p>
        ) : (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-sm space-y-2">
            <p className="font-semibold text-amber-900">You are currently ineligible for this job due to:</p>
            <ul className="list-disc pl-5 space-y-1 text-amber-800 text-xs">
              {eligibility.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <div className="pt-2">
              <Link to="/student/profile" className="text-xs font-bold text-indigo-700 underline">
                Update profile & resume here →
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Job Description & Requirements */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Description</h2>
          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {job.description}
          </p>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900 mb-2">Eligible Engineering Branches</h2>
          <div className="flex flex-wrap gap-2">
            {job.eligibleBranches?.map((branch) => (
              <span
                key={branch}
                className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold"
              >
                {branch}
              </span>
            ))}
          </div>
        </div>

        {job.requiredSkills?.length > 0 && (
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-2">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {job.requiredSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentJobDetails;

