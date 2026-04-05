import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { APP_BASE_PATH } from "@/config/constants";

function normalizePathname(pathname: string) {
  if (pathname.startsWith(APP_BASE_PATH)) {
    const normalized = pathname.slice(APP_BASE_PATH.length);
    return normalized.startsWith("/") ? normalized : `/${normalized}`;
  }
  return pathname;
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const normalizedPathname = normalizePathname(pathname);
  const isLoginPath = normalizedPathname === "/login";

  const hasBackendAuthCookie =
    !!request.cookies.get("fintrack_refresh_token") ||
    !!request.cookies.get("fintrack_access_token");
  const isBackendAuthenticated = hasBackendAuthCookie;

  if (isLoginPath && isBackendAuthenticated) {
    return NextResponse.redirect(
      new URL(`${APP_BASE_PATH}/dashboard`, request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/analytics/:path*",
    "/transactions/:path*",
    "/login",
    "/FinTrack/dashboard/:path*",
    "/FinTrack/analytics/:path*",
    "/FinTrack/transactions/:path*",
    "/FinTrack/login",
  ],
};
