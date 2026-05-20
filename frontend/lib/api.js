const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Base fetch wrapper with auth headers and error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  };

  // Remove Content-Type for FormData (let browser set boundary)
  if (options.body instanceof FormData) {
    delete config.headers['Content-Type'];
  }

  const response = await fetch(url, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

export const api = {
  // Auth
  getLoginUrl: () => request('/api/auth/linkedin'),
  getMe: () => request('/api/auth/me'),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  refresh: () => request('/api/auth/refresh', { method: 'POST' }),

  // Posts
  getPosts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/posts${query ? `?${query}` : ''}`);
  },
  getPost: (id) => request(`/api/posts/${id}`),
  createPost: (data) => request('/api/posts', { method: 'POST', body: JSON.stringify(data) }),
  updatePost: (id, data) => request(`/api/posts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePost: (id) => request(`/api/posts/${id}`, { method: 'DELETE' }),
  publishPost: (id) => request(`/api/posts/${id}/publish`, { method: 'POST' }),
  uploadImage: (postId, file) => {
    const formData = new FormData();
    formData.append('image', file);
    return request(`/api/posts/${postId}/images`, { method: 'POST', body: formData });
  },

  // AI
  generatePost: (data) => request('/api/ai/generate', { method: 'POST', body: JSON.stringify(data) }),
  getAiHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/ai/history${query ? `?${query}` : ''}`);
  },

  // Analytics
  getDashboard: () => request('/api/analytics/dashboard'),
  getPostAnalytics: (id) => request(`/api/analytics/posts/${id}`),
  getTrends: (days = 30) => request(`/api/analytics/trends?days=${days}`),
};
