import { NextRequest, NextResponse } from "next/server";

// Definir rutas privadas y rutas de autenticación
const privatePaths = ["/dashboard", "/presupuesto", "/facturacion", "/reportes"];
const authPaths = ["/login"];
const publicPaths = ["/api", "/_next", "/favicon.ico", "/manifest.json", "/robots.txt"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  // Permitir acceso a rutas públicas sin verificación
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Redirigir a login si intenta acceder a rutas privadas sin token
  if (privatePaths.some((path) => pathname.includes(path))) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Redirigir a dashboard si intenta acceder a rutas de auth con token
  if (authPaths.some((path) => pathname.includes(path))) {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Si la ruta raíz está protegida, redirigir a login o dashboard según autenticación
  if (pathname === "/") {
    if (token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Continuar con la solicitud normalmente
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
