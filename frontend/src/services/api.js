import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:1337/api',
});

api.interceptors.request.use((config) => {
  // On utilise bien le nom "token" ici
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;