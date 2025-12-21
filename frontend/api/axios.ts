import axios from "axios";

// Get backend URL - backend runs on port 5001
const getBaseURL = (): string => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '5001';
    return `http://${hostname}:${backendPort}`;
  }
  
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";
};

const api = axios.create({
  baseURL: getBaseURL(),
});

// ALWAYS attach token
api.interceptors.request.use((config) => {
  try {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {
    console.log("Token read error");
  }
  
  return config;
});

export default api;
