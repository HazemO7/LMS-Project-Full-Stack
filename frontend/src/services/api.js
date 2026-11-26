const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

const customFetch = async (url, options) => {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      throw new Error('Network error: Cannot connect to the server. Make sure the backend API is running.');
    }
    throw error;
  }
};

const parseError = async (res, fallbackMessage) => {
  const data = await res.json().catch(() => ({}));
  const error = new Error(data.msg || data.message || fallbackMessage);
  error.status = res.status;
  if (data.code !== undefined) {
    error.code = data.code;
  }
  if (data.remainingAttempts !== undefined) {
    error.remainingAttempts = data.remainingAttempts;
  }
  if (data.lockedUntil !== undefined) {
    error.lockedUntil = data.lockedUntil;
  }
  return error;
};

export const authAPI = {
  login: async (credentials) => {
    const res = await customFetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw await parseError(res, 'Login failed');
    return res.json();
  },
  register: async (userData) => {
    const res = await customFetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw await parseError(res, 'Registration failed');
    return res.json();
  },
  logout: async () => {
    const res = await customFetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) return {};
    return res.json().catch(() => ({}));
  },
  forgotPassword: async (email) => {
    const res = await customFetch(`${BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw await parseError(res, 'Request failed. Please try again.');
    return res.json().catch(() => ({}));
  },
  resetPassword: async (token, password) => {
    const res = await customFetch(`${BASE_URL}/auth/reset-password/${token}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) {
      throw await parseError(res, 'Password reset failed. The link may be invalid or expired.');
    }
    return res.json().catch(() => ({}));
  },
  changePassword: async ({ currentPassword, newPassword }) => {
    const res = await customFetch(`${BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) throw await parseError(res, 'Failed to change password');
    return res.json().catch(() => ({}));
  },
};

export const coursesAPI = {
  getAll: async (page = 1, limit = 10, search = '') => {
    const res = await customFetch(
      `${BASE_URL}/courses?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
      { headers: getHeaders() }
    );
    if (!res.ok) throw await parseError(res, 'Failed to fetch courses');
    return res.json();
  },
  getMyCourses: async () => {
    const res = await customFetch(`${BASE_URL}/my-courses`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch enrolled courses');
    return res.json();
  },
  getById: async (id) => {
    const res = await customFetch(`${BASE_URL}/courses/${id}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch course');
    return res.json();
  },
  getByIdFull: async (id) => {
    const res = await customFetch(`${BASE_URL}/courses/${id}/full`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch course details');
    return res.json();
  },
  enroll: async (id) => {
    const res = await customFetch(`${BASE_URL}/courses/${id}/enroll`, {
      method: 'POST',
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to enroll');
    return res.json();
  },
  create: async (courseData) => {
    const res = await customFetch(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(courseData),
    });
    if (!res.ok) throw await parseError(res, 'Failed to create course');
    return res.json();
  },
  update: async (id, courseData) => {
    const res = await customFetch(`${BASE_URL}/courses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(courseData),
    });
    if (!res.ok) throw await parseError(res, 'Failed to update course');
    return res.json();
  },
  delete: async (id) => {
    const res = await customFetch(`${BASE_URL}/courses/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to delete course');
    return res.json();
  },
};

export const modulesAPI = {
  create: async (moduleData) => {
    const res = await customFetch(`${BASE_URL}/modules`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(moduleData),
    });
    if (!res.ok) throw await parseError(res, 'Failed to create module');
    return res.json();
  },
  update: async (id, moduleData) => {
    const res = await customFetch(`${BASE_URL}/modules/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(moduleData),
    });
    if (!res.ok) throw await parseError(res, 'Failed to update module');
    return res.json();
  },
  delete: async (id) => {
    const res = await customFetch(`${BASE_URL}/modules/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to delete module');
    return res.json();
  },
};

export const lessonsAPI = {
  create: async (lessonData) => {
    const res = await customFetch(`${BASE_URL}/lessons`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(lessonData),
    });
    if (!res.ok) throw await parseError(res, 'Failed to create lesson');
    return res.json();
  },
  update: async (id, lessonData) => {
    const res = await customFetch(`${BASE_URL}/lessons/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(lessonData),
    });
    if (!res.ok) throw await parseError(res, 'Failed to update lesson');
    return res.json();
  },
  delete: async (id) => {
    const res = await customFetch(`${BASE_URL}/lessons/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to delete lesson');
    return res.json();
  },
};

export const progressAPI = {
  getCourseProgress: async (courseId) => {
    const res = await customFetch(`${BASE_URL}/courses/${courseId}/progress`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch progress');
    return res.json();
  },
  completeLesson: async (lessonId, courseId) => {
    const res = await customFetch(`${BASE_URL}/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ courseId }),
    });
    if (!res.ok) throw await parseError(res, 'Failed to update lesson completion');
    return res.json();
  },
};

export const usersAPI = {
  getMe: async () => {
    const res = await customFetch(`${BASE_URL}/users/me`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to fetch user profile');
    return res.json();
  },
  updateMe: async (userData) => {
    const res = await customFetch(`${BASE_URL}/users/me`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    if (!res.ok) throw await parseError(res, 'Failed to update profile');
    return res.json();
  },
};

export const adminAPI = {
  getStats: async () => {
    const res = await customFetch(`${BASE_URL}/admin/stats`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to load platform stats');
    return res.json();
  },
  getUsers: async ({ page = 1, limit = 10, role = 'all', status = 'all', search = '', cursor = '', cursorMode = false } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      role,
      status,
      search,
    });
    if (cursor) params.set('cursor', cursor);
    if (cursorMode) params.set('cursorMode', 'true');
    const res = await customFetch(`${BASE_URL}/admin/users?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to load users');
    return res.json();
  },
  createUser: async (payload) => {
    const res = await customFetch(`${BASE_URL}/admin/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res, 'Failed to create user');
    return res.json();
  },
  updateUserRole: async (userId, role) => {
    const res = await customFetch(`${BASE_URL}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) throw await parseError(res, 'Failed to update user role');
    return res.json();
  },
  updateUserStatus: async (userId, payload) => {
    const res = await customFetch(`${BASE_URL}/admin/users/${userId}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res, 'Failed to update user status');
    return res.json();
  },
  deleteUser: async (userId) => {
    const res = await customFetch(`${BASE_URL}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to delete user');
    return res.json();
  },
  getCourses: async ({ page = 1, limit = 10, search = '' } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      search,
    });
    const res = await customFetch(`${BASE_URL}/admin/courses?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to load courses');
    return res.json();
  },
  transferCourse: async (courseId, newInstructorId) => {
    const res = await customFetch(`${BASE_URL}/admin/courses/${courseId}/transfer`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ newInstructorId }),
    });
    if (!res.ok) throw await parseError(res, 'Failed to transfer course ownership');
    return res.json();
  },
  getCourseEnrollments: async (courseId) => {
    const res = await customFetch(`${BASE_URL}/admin/courses/${courseId}/enrollments`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to load enrollments');
    return res.json();
  },
  enrollUser: async (courseId, payload) => {
    const res = await customFetch(`${BASE_URL}/admin/courses/${courseId}/enrollments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res, 'Failed to enroll user');
    return res.json();
  },
  unenrollUser: async (courseId, userId) => {
    const res = await customFetch(`${BASE_URL}/admin/courses/${courseId}/enrollments/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to remove enrollment');
    return res.json();
  },
  getSettings: async () => {
    const res = await customFetch(`${BASE_URL}/admin/settings`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to load platform settings');
    return res.json();
  },
  updateSettings: async (payload) => {
    const res = await customFetch(`${BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw await parseError(res, 'Failed to update platform settings');
    return res.json();
  },
  getAuditLogs: async ({ page = 1, limit = 15, action = 'all' } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      action,
    });
    const res = await customFetch(`${BASE_URL}/admin/audit-logs?${params.toString()}`, {
      headers: getHeaders(),
    });
    if (!res.ok) throw await parseError(res, 'Failed to load audit logs');
    return res.json();
  },
};
