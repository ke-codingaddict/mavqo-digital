import { NextResponse, type NextRequest } from "next/server";
import { audit } from "@/lib/audit";
import { endSession, getCurrentUser, touchSession } from "@/lib/auth/session";
import { getClientIpHash } from "@/lib/security/request";

/**
 * Session heartbeat for the admin inactivity timer. A Route Handler rather
 * than a Server Action: setting a cookie from an action re-renders the page.
 * Only same-origin requests are honoured (the cookie is SameSite=Strict too).
 */
function sameOrigin(request: NextRequest) {
  const site = request.headers.get("sec-fetch-site");
  if (site) return site === "same-origin";
  const origin = request.headers.get("origin");
  return origin === request.nextUrl.origin;
}

const noStore = { "Cache-Control": "no-store" };

/** POST: the admin is active — extend the idle window. */
export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403, headers: noStore });
  const ok = await touchSession();
  return NextResponse.json({ ok }, { status: ok ? 200 : 401, headers: noStore });
}

/** DELETE: the inactivity timer ran out — end the session server-side. */
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ ok: false }, { status: 403, headers: noStore });
  const user = await getCurrentUser();
  if (user) await audit({ action: "session_timeout", actorId: user.id, ipHash: await getClientIpHash() });
  await endSession();
  return NextResponse.json({ ok: true }, { headers: noStore });
}
