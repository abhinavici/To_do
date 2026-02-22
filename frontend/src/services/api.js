import axios from "axios";
import { clearToken, getToken, isTokenExpired } from "../utils/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

const redirectToLogin = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

const API = axios.create({
  baseURL: API_BASE_URL,
});

API.interceptors.request.use((req) => {
  const token = getToken();

  if (token) {
    if (isTokenExpired(token)) {
      clearToken();
      redirectToLogin();
      return req;
    }

    req.headers.Authorization = `Bearer ${token}`;
  }

  return req;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearToken();
      redirectToLogin();
    }

    return Promise.reject(error);
  }
);

export default API;
