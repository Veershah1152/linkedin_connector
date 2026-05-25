const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Base fetch wrapper with auth headers and error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;

  let token = null;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('accessToken');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    headers,
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
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
    return request('/api/auth/logout', { method: 'POST' });
  },
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

  // Career Automation
  importLinkedInProfile: () => request('/api/career/import'),
  parseLinkedInProfile: (linkedinFile, cvFile, linkedinText, cvText) => {
    const formData = new FormData();
    if (linkedinFile) formData.append('linkedinFile', linkedinFile);
    if (cvFile) formData.append('cvFile', cvFile);
    if (linkedinText) formData.append('linkedinText', linkedinText);
    if (cvText) formData.append('cvText', cvText);
    return request('/api/career/resumes/parse-profile', { method: 'POST', body: formData });
  },
  getResumes: () => request('/api/career/resumes'),
  createResume: (data) => request('/api/career/resumes', { method: 'POST', body: JSON.stringify(data) }),
  getResume: (id) => request(`/api/career/resumes/${id}`),
  updateResume: (id, data) => request(`/api/career/resumes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteResume: (id) => request(`/api/career/resumes/${id}`, { method: 'DELETE' }),
  getResumeVersions: (id) => request(`/api/career/resumes/${id}/versions`),
  rollbackResumeVersion: (id, version) => request(`/api/career/resumes/${id}/rollback`, { method: 'POST', body: JSON.stringify({ version }) }),
  optimizeResume: (id, targetRole) => request(`/api/career/resumes/${id}/optimize`, { method: 'POST', body: JSON.stringify({ targetRole }) }),
  analyzeATS: (id, targetRole) => request(`/api/career/resumes/${id}/ats`, { method: 'POST', body: JSON.stringify({ targetRole }) }),
  getAtsHistory: (id) => request(`/api/career/resumes/${id}/ats/history`),
  getCertifications: () => request('/api/career/certifications'),
  uploadCertification: (file, details) => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('title', details.title);
    formData.append('issuingOrganization', details.issuingOrganization);
    if (details.issueDate) formData.append('issueDate', details.issueDate);
    if (details.credentialId) formData.append('credentialId', details.credentialId);
    if (details.credentialUrl) formData.append('credentialUrl', details.credentialUrl);
    return request('/api/career/certifications', { method: 'POST', body: formData });
  },
  publishCertification: (id) => request(`/api/career/certifications/${id}/publish`, { method: 'POST' }),

  // AI Chat for resume edits
  chatWithResume: (id, message, chatHistory = []) =>
    request(`/api/career/resumes/${id}/chat`, {
      method: 'POST',
      body: JSON.stringify({ message, chatHistory }),
    }),

  // ATS score targeting
  atsTargetOptimize: (id, targetRole, targetScore) =>
    request(`/api/career/resumes/${id}/ats-optimize`, {
      method: 'POST',
      body: JSON.stringify({ targetRole, targetScore }),
    }),

  // Micro-AI segment optimizations
  improveBullet: (bulletText, targetRole) =>
    request('/api/career/ai/improve-bullet', {
      method: 'POST',
      body: JSON.stringify({ bulletText, targetRole }),
    }),
  rewriteText: (text, tone) =>
    request('/api/career/ai/rewrite', {
      method: 'POST',
      body: JSON.stringify({ text, tone }),
    }),
  improveSummary: (summaryText, targetRole) =>
    request('/api/career/ai/improve-summary', {
      method: 'POST',
      body: JSON.stringify({ summaryText, targetRole }),
    }),
};

