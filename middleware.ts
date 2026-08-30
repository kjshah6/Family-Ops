import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(req: NextRequest) {
  const sessionCookie = getSessionCookie(req);
  if (!sessionCookie && req.nextUrl.pathname.startsWith("/app")) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
