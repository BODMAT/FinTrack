import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "fintrack_auth";

export function proxy(request: NextRequest) {
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (authCookie === "1") {
    return NextResponse.next();
  }

  const basePath = request.nextUrl.basePath ?? "";
  const loginUrl = new URL(`${basePath}/login`, request.url);
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/dashboard/:path*", "/analytics/:path*", "/transactions/:path*"],
};
