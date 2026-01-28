import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ❌ NO AUTO-LOGOUT HERE
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      'API error:',
      error.response?.status,
      error.config?.url
    );
    return Promise.reject(error);
  }
);

export default api;
