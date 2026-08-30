import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const sessionCookie = req.cookies.get("better-auth.session_token");
  if (!sessionCookie && req.nextUrl.pathname.startsWith("/app")) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
