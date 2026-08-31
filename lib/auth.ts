import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { passkey } from "@better-auth/passkey";
import { magicLink } from "better-auth/plugins/magic-link";
import { Resend } from "resend";
import { db } from "./db";
import { isAllowedParent } from "./allowlist";

// Built on first use, not at import. The Resend constructor throws when the key
// is missing, and at module scope that turns a missing or mid-rotation
// RESEND_API_KEY into a failed build for the entire app rather than one email
// that doesn't send. Local dev never reaches this — it prints the link instead.
let resendClient: Resend | null = null;
function getResend(): Resend {
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
}

// Dev-only: holds the most recently generated magic-link token so the local
// /api/dev-login shortcut can complete sign-in without an inbox round-trip.
// Never read or set outside of NODE_ENV !== "production". Exposed through a
// getter (rather than a plain export) so callers always see the current
// value regardless of how the bundler compiles the module's exports.
let lastDevMagicLinkToken: string | null = null;
export function getLastDevMagicLinkToken() {
  return lastDevMagicLinkToken;
}

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),

  // Passkey (WebAuthn) sign-in, registered after first magic-link sign-in
  plugins: [
    passkey({
      rpID: process.env.PASSKEY_RP_ID as string, // e.g. "your-app.vercel.app"
      rpName: "Cubby",
    }),
    magicLink({
      sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
        if (!isAllowedParent(email)) return; // silently ignore non-approved emails

        // Local dev: print the link instead of requiring a real inbox round-trip,
        // and stash the token for the /api/dev-login shortcut.
        if (process.env.NODE_ENV !== "production") {
          console.log(`\n🔗 Sign-in link for ${email}:\n${url}\n`);
          lastDevMagicLinkToken = new URL(url).searchParams.get("token");
          return;
        }

        await getResend().emails.send({
          from: "Cubby <onboarding@resend.dev>",
          to: email,
          subject: "Sign in to Cubby",
          html: `<p>Click to sign in: <a href="${url}">${url}</a></p><p>This link expires in 5 minutes.</p>`,
        });
      },
    }),
  ],

  // Only pre-approved parent emails may ever get an account
  callbacks: {
    async signIn({ user }: { user: { email?: string } }) {
      return isAllowedParent(user.email);
    },
  },

  secret: process.env.BETTER_AUTH_SECRET as string,
  baseURL: process.env.BETTER_AUTH_URL as string,
});

