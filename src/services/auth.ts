import Cookies from 'js-cookie';

// Constantes para claves de almacenamiento
const TOKEN_KEY = 'token';
const TOKEN_EXPIRY_KEY = 'token_expiry';

// Tiempo de expiración en segundos (1 hora)
const TOKEN_EXPIRY_TIME = 3600;

export const authService = {
  // Establecer el token en localStorage y en cookies con tiempo de expiración
  setToken: (token: string) => {
    try {
      // Guardar en localStorage
      localStorage.setItem(TOKEN_KEY, token);
      
      // Calcular y guardar la fecha de expiración
      const expiryTime = new Date().getTime() + TOKEN_EXPIRY_TIME * 1000;
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      // Guardar en cookies (expira en 1 hora)
      Cookies.set(TOKEN_KEY, token, { expires: 1/24, path: '/' });
      
      return true;
    } catch (error) {
      console.error('Error al guardar el token:', error);
      return false;
    }
  },
  
  // Obtener el token con verificación de expiración
  getToken: () => {
    try {
      // Primero verificamos si hay un token en localStorage
      const token = localStorage.getItem(TOKEN_KEY);
      const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
      
      // Si no hay token, retornamos null
      if (!token || !expiryTime) {
        return null;
      }
      
      // Verificamos si el token ha expirado
      const now = new Date().getTime();
      if (now > parseInt(expiryTime)) {
        // Token expirado, limpiamos todo
        authService.clearToken();
        return null;
      }
      
      // Token válido
      return token;
    } catch (error) {
      console.error('Error al obtener el token:', error);
      return null;
    }
  },
  
  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    return !!authService.getToken();
  },
  
  // Limpiar el token de localStorage y cookies
  clearToken: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
      Cookies.remove(TOKEN_KEY, { path: '/' });
      return true;
    } catch (error) {
      console.error('Error al limpiar el token:', error);
      return false;
    }
  },
  
  // Sincronizar el token entre localStorage y cookies
  syncToken: () => {
    try {
      const localToken = localStorage.getItem(TOKEN_KEY);
      const cookieToken = Cookies.get(TOKEN_KEY);
      
      if (localToken && !cookieToken) {
        // Si hay token en localStorage pero no en cookies, lo sincronizamos
        Cookies.set(TOKEN_KEY, localToken, { expires: 1/24, path: '/' });
      } else if (!localToken && cookieToken) {
        // Si hay token en cookies pero no en localStorage, lo sincronizamos
        localStorage.setItem(TOKEN_KEY, cookieToken);
        const expiryTime = new Date().getTime() + TOKEN_EXPIRY_TIME * 1000;
        localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      }
      
      return true;
    } catch (error) {
      console.error('Error al sincronizar el token:', error);
      return false;
    }
  }
};

// Exportación por defecto para importación más limpia
export default authService;
