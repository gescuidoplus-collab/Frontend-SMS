import axios from "axios";
import { obtenerToken, cerrarSesion } from "./session";
import { API_URL } from "./config";

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = obtenerToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let cerrandoSesion = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined" && !cerrandoSesion) {
      const enLogin = window.location.pathname.startsWith("/login");

      if (!enLogin) {
        cerrandoSesion = true;
        // Hay que borrar también la cookie: si solo se limpiara el
        // localStorage, el middleware seguiría creyendo que hay sesión y
        // devolvería a /dashboard en bucle.
        cerrarSesion();
        window.location.href = "/login?expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
