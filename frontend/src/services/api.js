import axios from 'axios';

// On met une instance Axios ca aide pour pas avoir a mettre l'URL de partout
const api = axios.create({
  baseURL: 'http://localhost:1337/api',
});

// introduire le token de securise automatiquement 
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;