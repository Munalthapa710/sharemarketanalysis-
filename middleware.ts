import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/dashboard", "/analysis", "/watchlist", "/history", "/stocks", "/profile", "/market", "/notifications"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("shareanalysis_session")?.value;
  const isProtected = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if ((request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/analysis/:path*", "/watchlist/:path*", "/history/:path*", "/stocks/:path*", "/profile/:path*", "/market/:path*", "/notifications/:path*", "/login", "/register"]
};
