"use client";

import { useEffect, useState } from "react";
import { obtenerToken } from "./session";

/**
 * Estado de la sesión en las páginas que se abren desde un enlace de CloudNavis.
 *
 * Esos enlaces llegan sin pasar por el login (el middleware los deja entrar
 * para no perder el query string), así que aquí se comprueba si hay sesión para
 * poder pedirla en un modal.
 *
 * El prellenado en sí no depende de esto: usa el token de CloudNavis que viene
 * en la URL. Lo que sí necesita sesión es el historial y el envío del
 * formulario, y por eso hace falta reanudarlos al iniciarla.
 */
export function useSesionEnlace() {
  // Arranca en true para no enseñar el modal durante la hidratación; el efecto
  // lo corrige en cuanto puede leer el localStorage.
  const [haySesion, setHaySesion] = useState(true);

  useEffect(() => {
    setHaySesion(!!obtenerToken());
  }, []);

  return {
    haySesion,
    marcarSesionIniciada: () => setHaySesion(true),
  };
}
