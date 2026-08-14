/**
 * Punto único donde se guarda y se borra la sesión.
 *
 * El token vive a la vez en localStorage (lo usan las llamadas a la API) y en
 * una cookie (la lee el middleware, que corre en el servidor). Si los dos se
 * desincronizan, el middleware y las páginas se contradicen y el navegador
 * entra en un bucle de redirecciones, así que siempre se escriben y se borran
 * juntos, y la cookie caduca a la vez que el token.
 */

const TOKEN_KEY = "token";
const USER_KEY = "user";

/** Momento de caducidad del JWT en milisegundos, o null si no se puede leer. */
const caducidadDe = (token: string): number | null => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.exp ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};

/** Un token sin fecha de caducidad legible se considera válido. */
export const tokenVigente = (token?: string | null): boolean => {
  if (!token) return false;
  const caducidad = caducidadDe(token);
  return caducidad === null ? true : Date.now() < caducidad;
};

export const guardarSesion = (token: string): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem(TOKEN_KEY, token);

  const caducidad = caducidadDe(token);
  const expira = caducidad ? `; expires=${new Date(caducidad).toUTCString()}` : "";
  const seguro = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${TOKEN_KEY}=${token}; path=/; SameSite=Lax${expira}${seguro}`;
};

export const cerrarSesion = (): void => {
  if (typeof window === "undefined") return;

  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
};

/**
 * Token de la sesión actual. Si ha caducado, limpia todo y devuelve null, para
 * que la cookie no siga diciendo lo contrario que el localStorage.
 */
export const obtenerToken = (): string | null => {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem(TOKEN_KEY);
  if (!tokenVigente(token)) {
    if (token) cerrarSesion();
    return null;
  }
  return token;
};
