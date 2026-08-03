import axios from "axios";

const api = axios.create({
  baseURL:  "https://backend-sms-production-0b80.up.railway.app/api/v1",
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isLoggingOut = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined" && !isLoggingOut) {
      const isLoginPage = window.location.pathname === "/login" || window.location.pathname.startsWith("/login");

      if (!isLoginPage) {
        isLoggingOut = true;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
