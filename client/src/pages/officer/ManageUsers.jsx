import React, { useState, useEffect } from 'react';
import { officerApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/common/Spinner';
import {
  Users,
  Search,
  CheckCircle,
  XCircle,
  Filter,
  AlertCircle,
  CheckCircle2,
  Shield,
  GraduationCap,
  Building,
} from 'lucide-react';

const ManageUsers = () => {
  const { user: currentOfficer } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    search: '',
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchUsers();
  }, [filters.role, filters.isActive]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        role: filters.role || undefined,
        isActive: filters.isActive !== '' ? filters.isActive : undefined,
        search: filters.search || undefined,
      };
      const res = await officerApi.getUsers(params);
      setUsers(res.data || []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to load user list' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    setUpdatingId(userId);
    setMessage({ type: '', text: '' });

    try {
      const nextStatus = !currentStatus;
      await officerApi.updateUserStatus(userId, nextStatus);
      setMessage({
        type: 'success',
        text: `User account successfully ${nextStatus ? 'Activated / Approved' : 'Deactivated'}.`,
      });
      await fetchUsers();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to update user status' });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">User Management Directory</h1>
        <p className="text-sm text-slate-500 mt-1">
          Monitor all enrolled students and verify new corporate recruiters to allow them portal login access.
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

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={filters.role}
            onChange={(e) => setFilters({ ...filters, role: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700"
          >
            <option value="">All Roles (Student, Recruiter, Officer)</option>
            <option value="student">Students</option>
            <option value="recruiter">Recruiters</option>
            <option value="officer">Officers</option>
          </select>

          <select
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="true">Active / Approved</option>
            <option value="false">Pending Approval / Deactivated</option>
          </select>
        </div>
      </div>

      {/* User Table */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Spinner size="lg" />
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No users match criteria</h3>
          <p className="text-sm text-slate-500 mt-1">Adjust filters or search keywords.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Registered Date</th>
                  <th className="py-3 px-4 text-right">Approval Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isPendingRecruiter = u.role === 'recruiter' && !u.isActive;
                  const isCurrentOfficerSelf = u._id === currentOfficer?._id;

                  return (
                    <tr
                      key={u._id}
                      className={`hover:bg-slate-50/50 ${
                        isPendingRecruiter ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span>{u.name}</span>
                          {isPendingRecruiter && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                              Requires Approval
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">{u.email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === 'officer'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'recruiter'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {u.role === 'officer' && <Shield className="w-3 h-3" />}
                          {u.role === 'recruiter' && <Building className="w-3 h-3" />}
                          {u.role === 'student' && <GraduationCap className="w-3 h-3" />}
                          <span className="capitalize">{u.role}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            u.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {u.isActive ? 'Active' : 'Inactive / Pending'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        {isCurrentOfficerSelf ? (
                          <span className="text-xs text-slate-400 italic">Self (Protected)</span>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(u._id, u.isActive)}
                            disabled={updatingId === u._id}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all disabled:opacity-40 ${
                              u.isActive
                                ? 'border border-rose-200 text-rose-700 hover:bg-rose-50'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm'
                            }`}
                          >
                            {updatingId === u._id ? (
                              <Spinner size="sm" />
                            ) : u.isActive ? (
                              'Deactivate'
                            ) : (
                              'Approve & Activate'
                            )}
                          </button>
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

export default ManageUsers;

