

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


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


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      if (window.location.pathname !== '/login' &&
          window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);




export const registerUser = (userData) =>
  api.post('/auth/register', userData);


export const loginUser = (credentials) =>
  api.post('/auth/login', credentials);


export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });


export const resetPassword = (token, passwords) =>
  api.post('/auth/reset-password', { token, newPassword: passwords.password });


export const getMe = () =>
  api.get('/auth/me');

export const getIdentityStatus = () =>
  api.get('/auth/identity-status');

export const verifyIdentity = (formData) =>
  api.post('/auth/verify-identity', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

export default api;