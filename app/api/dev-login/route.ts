import { NextRequest, NextResponse } from "next/server";
import { auth, getLastDevMagicLinkToken } from "@/lib/auth";

// Local-only shortcut: skips the email round-trip by driving better-auth's
// real magic-link generate + verify endpoints back to back. Hard-blocked in
// production so this can never grant a session on the deployed app.
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not available in production" }, { status: 404 });
  }

  const email = "kjshah6@icloud.com";

  await auth.api.signInMagicLink({
    body: { email, callbackURL: "/app" },
    headers: req.headers,
  });

  const token = getLastDevMagicLinkToken();
  if (!token) {
    return NextResponse.json({ error: "failed to generate a dev token" }, { status: 500 });
  }

  const response = await auth.api.magicLinkVerify({
    query: { token, callbackURL: "/app" },
    headers: req.headers,
    asResponse: true,
  });

  return response;
}
