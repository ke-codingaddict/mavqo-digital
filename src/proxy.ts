import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth/session-token";

/**
 * Optimistic gate for /admin: bounces visitors without a valid session cookie
 * to the login page before any admin page renders. This is a convenience only —
 * every admin page, action and route still authorizes on the server.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // The login page is public; the session heartbeat answers with JSON and authenticates itself.
  if (pathname.startsWith("/admin/login") || pathname.startsWith("/admin/session")) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  const session = secret ? await verifySession(request.cookies.get(SESSION_COOKIE)?.value, secret) : null;
  if (!session) {
    return NextResponse.redirect(new URL("/admin/login/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
