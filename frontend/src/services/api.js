const BASE_URL = 'http://localhost:8000/api';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` })
    };
};

export const authAPI = {
    login: async (credentials) => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
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
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(userData)
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.msg || data.message || 'Registration failed');
        }
        return res.json();
    }
};

export const coursesAPI = {
    getAll: async () => {
        const res = await fetch(`${BASE_URL}/courses`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch courses');
        return res.json();
    },
    getById: async (id) => {
        const res = await fetch(`${BASE_URL}/courses/${id}`, {
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to fetch course');
        return res.json();
    },
    getByIdFull: async (id) => {
        const res = await fetch(`${BASE_URL}/courses/${id}/full`, {
            headers: getHeaders()
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || data.msg || 'Failed to fetch course details');
        }
        return res.json();
    },
    enroll: async (id) => {
        const res = await fetch(`${BASE_URL}/courses/${id}/enroll`, {
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
        const res = await fetch(`${BASE_URL}/courses`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(courseData)
        });
        if (!res.ok) throw new Error('Failed to create course');
        return res.json();
    },
    update: async (id, courseData) => {
        const res = await fetch(`${BASE_URL}/courses/${id}`, {
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
        const res = await fetch(`${BASE_URL}/modules`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(moduleData)
        });
        if (!res.ok) throw new Error('Failed to create module');
        return res.json();
    },
    update: async (id, moduleData) => {
        const res = await fetch(`${BASE_URL}/modules/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(moduleData)
        });
        if (!res.ok) throw new Error('Failed to update module');
        return res.json();
    },
    delete: async (id) => {
        const res = await fetch(`${BASE_URL}/modules/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete module');
        return res.json();
    }
};

export const lessonsAPI = {
    create: async (lessonData) => {
        const res = await fetch(`${BASE_URL}/lessons`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(lessonData)
        });
        if (!res.ok) throw new Error('Failed to create lesson');
        return res.json();
    },
    update: async (id, lessonData) => {
        const res = await fetch(`${BASE_URL}/lessons/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(lessonData)
        });
        if (!res.ok) throw new Error('Failed to update lesson');
        return res.json();
    },
    delete: async (id) => {
        const res = await fetch(`${BASE_URL}/lessons/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });
        if (!res.ok) throw new Error('Failed to delete lesson');
        return res.json();
    }
};

export const progressAPI = {
    getCourseProgress: async (courseId) => {
        const res = await fetch(`${BASE_URL}/courses/${courseId}/progress`, { headers: getHeaders() });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || data.msg || 'Failed to fetch progress');
        }
        return res.json();
    },
    completeLesson: async (lessonId, courseId) => {
        const res = await fetch(`${BASE_URL}/lessons/${lessonId}/complete`, {
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
        const res = await fetch(`${BASE_URL}/users/me`, { headers: getHeaders() });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || data.msg || 'Failed to fetch user profile');
        }
        return res.json();
    },
    updateMe: async (userData) => {
        const res = await fetch(`${BASE_URL}/users/me`, {
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
