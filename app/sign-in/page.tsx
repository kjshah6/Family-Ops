"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

const COLORS = { maroon: "#7A1B2E", navy: "#16213E", ivory: "#F7F2E7", gold: "#B08D3E" };

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendLink() {
    setError(null);
    const { error } = await authClient.signIn.magicLink({ email, callbackURL: "/app" });
    if (error) setError("Something went wrong. Try again.");
    else setSent(true);
  }

  async function withPasskey() {
    setError(null);
    const { error } = await authClient.signIn.passkey();
    if (error) setError("No passkey found for this device. Sign in by email first, then register a passkey from the app.");
  }

  return (
    <div style={{ background: COLORS.ivory, minHeight: "100vh" }} className="flex items-center justify-center px-5">
      <div style={{ background: "#fff", border: `1px solid ${COLORS.gold}`, borderRadius: 8 }} className="w-full max-w-sm p-8 text-center">
        <h1 style={{ color: COLORS.navy, fontWeight: 700, fontSize: 22 }} className="mb-1">Family Roster</h1>
        <p style={{ color: "#6B6357" }} className="text-sm mb-6">Sign in to view and edit the shared schedule.</p>

        {sent ? (
          <p style={{ color: COLORS.navy }} className="text-sm">
            Check <strong>{email}</strong> for a sign-in link. It expires in 5 minutes.
          </p>
        ) : (
          <>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm mb-3"
              style={{ borderColor: COLORS.gold }}
            />
            <button onClick={sendLink} style={{ background: COLORS.navy, color: "#fff" }} className="w-full rounded py-2.5 text-sm font-medium mb-3">
              Email me a sign-in link
            </button>
          </>
        )}

        <div className="flex items-center gap-2 my-4">
          <div style={{ flex: 1, height: 1, background: "#eee" }} />
          <span style={{ color: "#999", fontSize: 11 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#eee" }} />
        </div>

        <button onClick={withPasskey} style={{ background: COLORS.maroon, color: "#fff" }} className="w-full rounded py-2.5 text-sm font-medium">
          Sign in with Passkey
        </button>

        {error && <p className="text-xs mt-4" style={{ color: COLORS.maroon }}>{error}</p>}
        <p className="text-xs mt-6" style={{ color: "#6B6357" }}>
          First time here? Use email, then add a passkey from your account menu for faster sign-in next time.
        </p>
      </div>
    </div>
  );
}

