const API_BASE = 'http://localhost:3000/api';

function getToken() {
  return localStorage.getItem('brilliance_token') || null;
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (form) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(form),
    }),

  getMe: () => request('/auth/me'),

  getTopics: () => request('/quiz/topics'),

  getAdaptiveQuiz: (topicId) =>
    request(`/quiz/adaptive/${topicId}`),

  submitQuiz: (data) =>
    request('/quiz/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMyScores: () => request('/scoring/my-scores'),

  getLeaderboard: (limit = 50) =>
    request(`/leaderboard?limit=${limit}`),

  getTopicLeaderboard: (topicId) =>
    request(`/leaderboard/topic/${topicId}`),

  getMyBadges: () => request('/badges/my-badges'),

  getClassAnalytics: () => request('/analytics/class'),

  getParticipationVsAchievement: () =>
    request('/analytics/participation-vs-achievement'),
};