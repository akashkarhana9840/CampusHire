import React, { useState, useEffect } from 'react';
import { profileApi } from '../../api';
import Spinner from '../../components/common/Spinner';
import {
  User,
  GraduationCap,
  BookOpen,
  Award,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [previewingResume, setPreviewingResume] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    branch: 'CSE',
    rollNo: '',
    cgpa: '',
    backlogs: 0,
    skills: '',
    contact: {
      phone: '',
      linkedin: '',
      github: '',
    },
  });

  const branches = ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'AIDS', 'AIML'];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await profileApi.getMe();
      if (res.data) {
        setProfile(res.data);
        setFormData({
          branch: res.data.branch || 'CSE',
          rollNo: res.data.rollNo || '',
          cgpa: res.data.cgpa !== undefined ? res.data.cgpa : '',
          backlogs: res.data.backlogs !== undefined ? res.data.backlogs : 0,
          skills: (res.data.skills || []).join(', '),
          contact: {
            phone: res.data.contact?.phone || '',
            linkedin: res.data.contact?.linkedin || '',
            github: res.data.contact?.github || '',
          },
        });
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('contact.')) {
      const field = name.split('.')[1];
      setFormData({
        ...formData,
        contact: { ...formData.contact, [field]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    setMessage({ type: '', text: '' });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        branch: formData.branch,
        rollNo: formData.rollNo.trim().toUpperCase(),
        cgpa: parseFloat(formData.cgpa),
        backlogs: parseInt(formData.backlogs, 10),
        skills: formData.skills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        contact: formData.contact,
      };

      const res = await profileApi.updateMe(payload);
      setProfile(res.data);
      setMessage({ type: 'success', text: 'Academic profile saved successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setMessage({ type: 'error', text: 'Only PDF files are supported for resumes.' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Resume file size cannot exceed 2MB.' });
      return;
    }

    setUploadingResume(true);
    setMessage({ type: '', text: '' });

    try {
      const uploadData = new FormData();
      uploadData.append('resume', file);
      await profileApi.uploadResume(uploadData);
      setMessage({ type: 'success', text: 'Resume uploaded successfully to MongoDB GridFS!' });
      await fetchProfile();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Resume upload failed' });
    } finally {
      setUploadingResume(false);
    }
  };

  // Authenticated Blob fetch for resume preview (No direct links)
  const handlePreviewResume = async () => {
    if (!profile?._id) return;
    setPreviewingResume(true);

    try {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      const blob = await profileApi.streamResumeBlob(profile._id);
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not fetch resume PDF: ' + err.message });
    } finally {
      setPreviewingResume(false);
    }
  };

  const handleClosePreview = () => {
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Student Profile & Resume</h1>
        <p className="text-sm text-slate-500 mt-1">
          Provide accurate academic information and upload your resume. This data is used to calculate eligibility for placement drives.
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

      {/* Resume Upload Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" />
              <span>Resume PDF (GridFS Storage)</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              PDF only, maximum 2MB. Validated via binary magic bytes.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {profile?.resumeFileId && (
              <button
                type="button"
                onClick={handlePreviewResume}
                disabled={previewingResume}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {previewingResume ? (
                  <Spinner size="sm" className="mr-1" />
                ) : (
                  <ExternalLink className="w-4 h-4 text-indigo-600" />
                )}
                <span>Preview Resume</span>
              </button>
            )}

            <label className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 cursor-pointer shadow-sm transition-colors">
              {uploadingResume ? (
                <Spinner size="sm" className="border-white mr-1" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              <span>{profile?.resumeFileId ? 'Replace Resume' : 'Upload Resume'}</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handleResumeUpload}
                disabled={uploadingResume}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {profile?.resumeFileId ? (
          <div className="mt-4 flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/60">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                PDF
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {profile.resumeOriginalName || 'Resume.pdf'}
                </p>
                <p className="text-xs text-slate-500">
                  Uploaded on {new Date(profile.resumeUploadedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
              Verified
            </span>
          </div>
        ) : (
          <div className="mt-4 p-4 text-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 text-slate-500 text-sm">
            No resume uploaded yet. You cannot apply to campus jobs until your resume is uploaded.
          </div>
        )}

        {/* In-page PDF preview modal if requested */}
        {pdfBlobUrl && (
          <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-100 px-4 py-2.5 flex justify-between items-center text-xs font-semibold text-slate-600 border-b border-slate-200">
              <span>Authenticated Resume Stream Preview</span>
              <button
                onClick={handleClosePreview}
                className="text-slate-500 hover:text-slate-800 font-bold"
              >
                Close Preview ✕
              </button>
            </div>
            <iframe
              src={pdfBlobUrl}
              title="Resume Preview"
              className="w-full h-96 border-0"
            />
          </div>
        )}
      </div>

      {/* Academic Profile Form */}
      <form onSubmit={handleProfileSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-6">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2 pb-4 border-b border-slate-100">
          <GraduationCap className="w-5 h-5 text-indigo-600" />
          <span>Academic & Personal Details</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700">Engineering Branch</label>
            <select
              name="branch"
              value={formData.branch}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            >
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">College Roll Number / USN</label>
            <input
              type="text"
              name="rollNo"
              value={formData.rollNo}
              onChange={handleInputChange}
              required
              placeholder="e.g. 2021BCSE042"
              className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Cumulative CGPA (0 - 10)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              name="cgpa"
              value={formData.cgpa}
              onChange={handleInputChange}
              required
              placeholder="e.g. 8.45"
              className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Active Backlogs Count</label>
            <input
              type="number"
              min="0"
              name="backlogs"
              value={formData.backlogs}
              onChange={handleInputChange}
              required
              placeholder="0"
              className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Skills (comma separated)
          </label>
          <input
            type="text"
            name="skills"
            value={formData.skills}
            onChange={handleInputChange}
            placeholder="React, Node.js, Express, MongoDB, Python, SQL"
            className="mt-1 block w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="pt-4 border-t border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Contact & Social Links</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600">Phone Number</label>
              <input
                type="text"
                name="contact.phone"
                value={formData.contact.phone}
                onChange={handleInputChange}
                placeholder="+91 9876543210"
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">LinkedIn Profile URL</label>
              <input
                type="text"
                name="contact.linkedin"
                value={formData.contact.linkedin}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/..."
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">GitHub Profile URL</label>
              <input
                type="text"
                name="contact.github"
                value={formData.contact.github}
                onChange={handleInputChange}
                placeholder="https://github.com/..."
                className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
          >
            {saving ? <Spinner size="sm" className="border-white mr-1" /> : null}
            <span>Save Academic Profile</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default StudentProfile;

