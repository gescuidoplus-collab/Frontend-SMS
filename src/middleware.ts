import { NextRequest, NextResponse } from "next/server";

const privatePaths = ["/dashboard", "/gescuidoplus/dashboard"];
const authPaths = ["/gescuidoplus/login"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("token")?.value;

  if (privatePaths.some((path) => pathname.startsWith(path))) {
    if (!token) {
      return NextResponse.redirect(new URL("/gescuidoplus/login", request.url));
    }
  }

  if (authPaths.some((path) => pathname.startsWith(path))) {
    if (token) {
      return NextResponse.redirect(new URL("/gescuidoplus/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/gescuidoplus/dashboard/:path*", "/gescuidoplus/login"],
};
