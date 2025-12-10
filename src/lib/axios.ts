import axios from "axios";
import authService from "@/services/auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend-sms-three.vercel.app/api/v1",
});

api.interceptors.request.use(
  (config) => {
    // Sincronizar token entre localStorage y cookies
    authService.syncToken();
    
    // Obtener el token verificando expiración
    const token = authService.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Si el error es 401 (No autorizado), limpiar el token
    if (error.response && error.response.status === 401) {
      authService.clearToken();
      
      // Si no estamos en la página de login, redirigir
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
