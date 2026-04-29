import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // 15s timeout
});

// ── Request deduplication: avoid duplicate simultaneous GETs ──────────────
const pendingRequests = new Map();

api.interceptors.request.use(config => {
  const token = localStorage.getItem('etec_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // Deduplicate identical GET requests in flight
  if (config.method === 'get') {
    const key = `${config.url}|${JSON.stringify(config.params || {})}`;
    if (pendingRequests.has(key)) {
      config._dedupKey = key;
    } else {
      const cancel = axios.CancelToken.source();
      config.cancelToken = cancel.token;
      config._dedupKey = key;
      pendingRequests.set(key, cancel);
    }
  }
  return config;
});

api.interceptors.response.use(
  response => {
    const key = response.config._dedupKey;
    if (key) pendingRequests.delete(key);
    return response;
  },
  error => {
    const key = error.config?._dedupKey;
    if (key) pendingRequests.delete(key);

    if (error.response?.status === 401) {
      localStorage.removeItem('etec_token');
      localStorage.removeItem('etec_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
