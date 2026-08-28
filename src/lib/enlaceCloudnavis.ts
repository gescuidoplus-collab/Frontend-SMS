/**
 * Reconoce los enlaces de prellenado que llegan desde CloudNavis.
 *
 * Traen su propio token de la API y los ids de lo que hay que cargar, y se
 * abren sin haber pasado por el login. No se pueden redirigir: la redirección
 * descarta el query string y el enlace queda inservible, porque esos ids no se
 * pueden reconstruir a mano. En su lugar, la página pide las credenciales en un
 * modal (ver LoginRequeridoModal).
 *
 * Vive aquí, y no dentro del middleware, para que el guard del layout privado
 * aplique exactamente el mismo criterio: si los dos no coincidieran, uno
 * dejaría entrar y el otro echaría fuera acto seguido.
 */

const PARAMS_CON_ID = ["idServicio", "idAsignacion", "idCliente", "idEmpleado"];

export function esEnlaceDeCloudnavis(params: URLSearchParams): boolean {
  if (!params.get("token")) return false;
  return PARAMS_CON_ID.some((nombre) => params.get(nombre));
}
