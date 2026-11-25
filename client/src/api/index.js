import api from './axiosClient';

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const profileApi = {
  getMe: () => api.get('/profile/me'),
  updateMe: (data) => api.put('/profile/me', data),
  uploadResume: (formData) =>
    api.post('/profile/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getProfileById: (id) => api.get(`/profile/${id}`),
  // Authenticated blob streaming for secure PDF preview
  streamResumeBlob: async (id) => {
    const token = localStorage.getItem('campushire_token');
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'}/profile/${id}/resume`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      throw new Error('Failed to load resume PDF');
    }
    return await response.blob();
  },
};

export const jobApi = {
  getJobs: (params) => api.get('/jobs', { params }),
  getJobById: (id) => api.get(`/jobs/${id}`),
  getRecruiterJobs: () => api.get('/jobs/recruiter/my'),
  createJob: (data) => api.post('/jobs', data),
  updateJob: (id, data) => api.put(`/jobs/${id}`, data),
  closeJob: (id) => api.patch(`/jobs/${id}/close`),
};

export const applicationApi = {
  applyToJob: (jobId) => api.post(`/applications/${jobId}/apply`),
  getMyApplications: () => api.get('/applications/student/my'),
  getJobApplicants: (jobId, params) => api.get(`/applications/job/${jobId}`, { params }),
  updateStatus: (id, status) => api.patch(`/applications/${id}/status`, { status }),
};

export const officerApi = {
  getUsers: (params) => api.get('/officer/users', { params }),
  updateUserStatus: (id, isActive) => api.patch(`/officer/users/${id}/status`, { isActive }),
  getAllJobs: (params) => api.get('/officer/jobs', { params }),
  getPendingJobs: () => api.get('/officer/pending-jobs'),
  reviewJob: (id, status) => api.patch(`/officer/jobs/${id}/approval`, { status }),
  getStats: () => api.get('/officer/stats'),
};

export const noticeApi = {
  getNotices: () => api.get('/notices'),
  createNotice: (data) => api.post('/notices', data),
  deleteNotice: (id) => api.delete(`/notices/${id}`),
};

