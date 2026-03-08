import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api";

const http = axios.create({
  baseURL: API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("stock_auth_token");
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
});

export default http;
