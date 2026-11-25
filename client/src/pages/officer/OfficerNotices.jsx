import React, { useState, useEffect } from 'react';
import { noticeApi } from '../../api';
import Spinner from '../../components/common/Spinner';
import {
  Bell,
  PlusCircle,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

const OfficerNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', message: '' });
  const [alert, setAlert] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await noticeApi.getNotices();
      setNotices(res.data || []);
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', text: err.message || 'Failed to load notices' });
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (e) => {
    e.preventDefault();
    setPublishing(true);
    setAlert({ type: '', text: '' });

    try {
      await noticeApi.createNotice(formData);
      setAlert({ type: 'success', text: 'Announcement published to campus bulletin!' });
      setFormData({ title: '', message: '' });
      await fetchNotices();
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Failed to publish notice' });
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this notice?')) return;
    setDeletingId(id);
    setAlert({ type: '', text: '' });

    try {
      await noticeApi.deleteNotice(id);
      setAlert({ type: 'success', text: 'Notice deleted successfully' });
      await fetchNotices();
    } catch (err) {
      setAlert({ type: 'error', text: err.message || 'Failed to delete notice' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Placement Cell Notices</h1>
        <p className="text-sm text-slate-500 mt-1">
          Broadcast announcements and updates. These notices appear on both Student and Recruiter dashboards.
        </p>
      </div>

      {alert.text && (
        <div
          className={`p-4 rounded-xl flex items-start space-x-3 text-sm ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {alert.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          )}
          <span>{alert.text}</span>
        </div>
      )}

      {/* Publish Form */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-indigo-600" />
          <span>Publish New Announcement</span>
        </h2>

        <form onSubmit={handlePublish} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">Notice Title</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Mandatory Pre-Placement Talk: Amazon AWS Campus Drive"
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">Message Body</label>
            <textarea
              required
              rows={3}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Full details of the announcement, venue, instructions, or links..."
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={publishing}
              className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 disabled:opacity-50 shadow-sm"
            >
              {publishing ? <Spinner size="sm" className="border-white mr-1" /> : null}
              <span>Publish Notice</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notices List */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Active Bulletin Announcements ({notices.length})</h2>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <Spinner size="lg" />
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500 text-sm">
            No notices published yet.
          </div>
        ) : (
          notices.map((n) => (
            <div
              key={n._id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex justify-between items-start gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">{n.title}</h3>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                  {n.message}
                </p>
                <div className="text-[11px] text-slate-400">
                  Published by: <span className="font-semibold text-slate-600">{n.postedBy?.name || 'Officer'}</span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(n._id)}
                disabled={deletingId === n._id}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Notice"
              >
                {deletingId === n._id ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OfficerNotices;

