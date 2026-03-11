import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:1337/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");

  if (token && !config.url.includes("/auth")) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

export default api;