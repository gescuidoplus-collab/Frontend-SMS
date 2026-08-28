import { NextRequest, NextResponse } from "next/server";

const privatePaths = ["/dashboard", "/presupuesto", "/formularios"];
const authPaths = ["/login"];

/**
 * La cookie caduca a la vez que el token (ver lib/session), así que aquí basta
 * con mirar si existe: si el token venció, el navegador ya no la envía y esta
 * comprobación y la del cliente dicen lo mismo.
 *
 * Las rutas públicas de firma (/firmar/:token) quedan fuera a propósito: se
 * abren desde un enlace, sin sesión.
 */
/**
 * Un enlace de prellenado de CloudNavis: trae su propio token de la API y los
 * ids de lo que hay que cargar.
 *
 * Estos no se redirigen al login aunque no haya sesión, porque la redirección
 * se lleva por delante el query string y el enlace queda inservible. La página
 * se abre igual y pide las credenciales en un modal, sin perder los datos.
 */
const esEnlaceDeCloudnavis = (request: NextRequest) => {
  const params = request.nextUrl.searchParams;
  if (!params.get("token")) return false;

  return ["idServicio", "idAsignacion", "idCliente", "idEmpleado"].some((p) =>
    params.get(p)
  );
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  if (privatePaths.some((path) => pathname.startsWith(path)) && !token) {
    if (esEnlaceDeCloudnavis(request)) {
      return NextResponse.next();
    }
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  if (authPaths.some((path) => pathname.startsWith(path)) && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/presupuesto/:path*",
    "/formularios/:path*",
    "/login",
  ],
};
