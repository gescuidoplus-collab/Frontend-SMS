import { NextRequest, NextResponse } from "next/server";
import { esEnlaceDeCloudnavis } from "@/lib/enlaceCloudnavis";

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
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  if (privatePaths.some((path) => pathname.startsWith(path)) && !token) {
    // Los enlaces de CloudNavis entran sin sesión y piden las credenciales en
    // un modal; redirigirlos borraría su query string.
    if (esEnlaceDeCloudnavis(request.nextUrl.searchParams)) {
      return NextResponse.next();
    }
    // `new URL("/login", ...)` se deja fuera el query string, así que la ruta
    // original se guarda aparte para volver a ella después de entrar.
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname + request.nextUrl.search);
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
