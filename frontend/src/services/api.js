import axios from "axios";
import { clearToken, getToken, isTokenExpired } from "../utils/auth";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

const redirectToLogin = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

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
