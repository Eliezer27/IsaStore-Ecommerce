import { NextRequest, NextResponse } from "next/server";
import { ADMIN_AUTH_COOKIE, adminAuthToken } from "@/lib/admin-auth";

// Next.js 16 renombró "middleware.ts" a "proxy.ts" (y la función exportada
// "middleware" a "proxy"). El runtime ya es siempre "nodejs" en proxy.ts
// (no configurable), que es justo lo que necesitábamos para poder usar
// "crypto" de Node en adminAuthToken().

export function proxy(req: NextRequest) {
  const token = req.cookies.get(ADMIN_AUTH_COOKIE)?.value;

  if (token && token === adminAuthToken()) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin-login";
  url.searchParams.set("from", req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
