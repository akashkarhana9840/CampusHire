import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jobApi } from '../../api';
import Spinner from '../../components/common/Spinner';
import { ArrowLeft, Briefcase, AlertCircle, CheckCircle2 } from 'lucide-react';

const CreateJob = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const branchesList = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML'];

  const [formData, setFormData] = useState({
    company: '',
    title: '',
    type: 'job',
    description: '',
    location: 'On-site',
    package: '',
    deadline: '',
    minCGPA: 0,
    maxBacklogs: 0,
    eligibleBranches: ['CSE', 'IT'],
    requiredSkills: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleBranchToggle = (branch) => {
    const current = [...formData.eligibleBranches];
    if (current.includes(branch)) {
      if (current.length === 1) return; // Must have at least one branch
      setFormData({ ...formData, eligibleBranches: current.filter((b) => b !== branch) });
    } else {
      setFormData({ ...formData, eligibleBranches: [...current, branch] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validate deadline is in future
    if (new Date(formData.deadline).getTime() <= Date.now()) {
      setMessage({ type: 'error', text: 'Application deadline must be a future date and time' });
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        minCGPA: parseFloat(formData.minCGPA),
        maxBacklogs: parseInt(formData.maxBacklogs, 10),
        requiredSkills: formData.requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        deadline: new Date(formData.deadline).toISOString(),
      };

      await jobApi.createJob(payload);
      setMessage({
        type: 'success',
        text: 'Opportunity posted successfully! It is currently pending approval by the Placement Officer.',
      });
      setTimeout(() => {
        navigate('/recruiter/jobs');
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to submit posting' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        to="/recruiter/jobs"
        className="inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-600 hover:text-indigo-600"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to my postings</span>
      </Link>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Post New Campus Drive</h1>
          <p className="text-sm text-slate-500 mt-1">
            Fill in the job or internship details and academic eligibility rules. All postings require placement officer approval before appearing to students.
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700">Company Name</label>
              <input
                type="text"
                name="company"
                required
                value={formData.company}
                onChange={handleInputChange}
                placeholder="e.g. Google, Microsoft, TCS"
                className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Opportunity Title</label>
              <input
                type="text"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Graduate Software Engineer"
                className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg text-sm"
              >
                <option value="job">Full-time Job</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Package / Stipend</label>
              <input
                type="text"
                name="package"
                required
                value={formData.package}
                onChange={handleInputChange}
                placeholder="e.g. 14 LPA or 50,000 / month"
                className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="e.g. Bangalore / Remote"
                className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Application Deadline</label>
              <input
                type="datetime-local"
                name="deadline"
                required
                value={formData.deadline}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Job Description & Responsibilities</label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Detailed overview of job responsibilities and technical expectations..."
              className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          {/* Academic Eligibility Section */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Academic Eligibility Criteria</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600">Minimum CGPA (0 - 10)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  name="minCGPA"
                  required
                  value={formData.minCGPA}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600">Maximum Allowed Active Backlogs</label>
                <input
                  type="number"
                  min="0"
                  name="maxBacklogs"
                  required
                  value={formData.maxBacklogs}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-2">
                Eligible Engineering Branches (Select all that apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {branchesList.map((branch) => {
                  const isSelected = formData.eligibleBranches.includes(branch);
                  return (
                    <button
                      type="button"
                      key={branch}
                      onClick={() => handleBranchToggle(branch)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {branch} {isSelected ? '✓' : '+'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">
                Required Technical Skills (comma separated)
              </label>
              <input
                type="text"
                name="requiredSkills"
                value={formData.requiredSkills}
                onChange={handleInputChange}
                placeholder="e.g. Java, Python, React, SQL, AWS"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? <Spinner size="sm" className="border-white mr-1" /> : null}
              <span>Submit Posting for Approval</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateJob;

