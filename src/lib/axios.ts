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

/**
 * El propio login responde 401 cuando las credenciales no son correctas, y ese
 * 401 no significa que la sesión haya caducado. Sin esta excepción, fallar la
 * contraseña en el modal de un enlace de CloudNavis echaba al usuario a /login
 * y se llevaba por delante el enlace, que es justo lo que el modal evita.
 */
const esIntentoDeLogin = (url?: string) => !!url && url.includes("/auth/login");

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (esIntentoDeLogin(error.config?.url)) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && typeof window !== "undefined" && !cerrandoSesion) {
      const enLogin = window.location.pathname.startsWith("/login");

      if (!enLogin) {
        cerrandoSesion = true;
        // Hay que borrar también la cookie: si solo se limpiara el
        // localStorage, el middleware seguiría creyendo que hay sesión y
        // devolvería a /dashboard en bucle.
        cerrarSesion();

        // Se guarda dónde estaba para volver después de entrar. Importa sobre
        // todo en los enlaces de CloudNavis, cuyo query string no se puede
        // reconstruir a mano si se pierde.
        const destino = window.location.pathname + window.location.search;
        window.location.href = `/login?expired=true&next=${encodeURIComponent(destino)}`;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
