const BASE_URL = 'http://localhost:8000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };
};

const customFetch = async (url, options) => {
    try {
        return await fetch(url, options);
    } catch (error) {
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            throw new Error('Network error: Cannot connect to the server (CORS issue or server is down).');
        }
        throw error;
    }
};

export const authAPI = {
    login: async (credentials) => {
        const res = await customFetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(credentials)
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.msg || data.message || 'Login failed');
        }
        return res.json();
    },
    register: async (userData) => {
        const res = await customFetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(userData)
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.msg || data.message || 'Registration failed');
        }
        return res.json();
    },
    forgotPassword: async (email) => {
        const res = await customFetch(`${BASE_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        // 200 is always returned for security (anti-enumeration), but network errors can still throw
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.msg || data.message || 'Request failed. Please try again.');
        }
        return data;
    },
    resetPassword: async (token, password) => {
        const res = await customFetch(`${BASE_URL}/auth/reset-password/${token}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.msg || data.message || 'Password reset failed. The link may be invalid or expired.');
        }
        return data;
    }
};

export const coursesAPI = {
    getAll: async (page = 1, limit = 10) => {
        const res = await customFetch(`${BASE_URL}/courses?page=${page}&limit=${limit}`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch courses');
        return res.json();
    },
    getById: async (id) => {
        const res = await customFetch(`${BASE_URL}/courses/${id}`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch course');
        return res.json();
    },
    getByIdFull: async (id) => {
        const res = await customFetch(`${BASE_URL}/courses/${id}/full`, {
            headers: getHeaders()
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || data.msg || 'Failed to fetch course details');
        }
        return res.json();
    },
    enroll: async (id) => {
        const res = await customFetch(`${BASE_URL}/courses/${id}/enroll`, {
            method: 'POST',
            headers: getHeaders()
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || data.msg || 'Failed to enroll');
        }
        return res.json();
    },
    create: async (courseData) => {
        const res = await customFetch(`${BASE_URL}/courses`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(courseData)
        });
        if (!res.ok) throw new Error('Failed to create course');
        return res.json();
    },
    update: async (id, courseData) => {
        const res = await customFetch(`${BASE_URL}/courses/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(courseData)
        });
        if (!res.ok) throw new Error('Failed to update course');
        return res.json();
    }
};

export const modulesAPI = {
    create: async (moduleData) => {
        const res = await customFetch(`${BASE_URL}/modules`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(moduleData)
        });
        if (!res.ok) throw new Error('Failed to create module');
        return res.json();
    },
    update: async (id, moduleData) => {
        const res = await customFetch(`${BASE_URL}/modules/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(moduleData)
        });
        if (!res.ok) throw new Error('Failed to update module');
        return res.json();
    },
    delete: async (id) => {
        const res = await customFetch(`${BASE_URL}/modules/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete module');
        return res.json();
    }
};

export const lessonsAPI = {
    create: async (lessonData) => {
        const res = await customFetch(`${BASE_URL}/lessons`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(lessonData)
        });
        if (!res.ok) throw new Error('Failed to create lesson');
        return res.json();
    },
    update: async (id, lessonData) => {
        const res = await customFetch(`${BASE_URL}/lessons/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(lessonData)
        });
        if (!res.ok) throw new Error('Failed to update lesson');
        return res.json();
    },
    delete: async (id) => {
        const res = await customFetch(`${BASE_URL}/lessons/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete lesson');
        return res.json();
    }
};

export const progressAPI = {
    getCourseProgress: async (courseId) => {
        const res = await customFetch(`${BASE_URL}/courses/${courseId}/progress`, { headers: getHeaders() });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || data.msg || 'Failed to fetch progress');
        }
        return res.json();
    },
    completeLesson: async (lessonId, courseId) => {
        const res = await customFetch(`${BASE_URL}/lessons/${lessonId}/complete`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ courseId })
        });
        if (!res.ok) throw new Error('Failed to complete lesson');
        return res.json();
    }
};

export const usersAPI = {
    getMe: async () => {
        const res = await customFetch(`${BASE_URL}/users/me`, { headers: getHeaders() });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || data.msg || 'Failed to fetch user profile');
        }
        return res.json();
    },
    updateMe: async (userData) => {
        const res = await customFetch(`${BASE_URL}/users/me`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify(userData)
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || data.msg || 'Failed to update profile');
        }
        return res.json();
    }
};
