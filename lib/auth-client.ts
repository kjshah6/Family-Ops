import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "better-auth/client/plugins";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [passkeyClient(), magicLinkClient()],
});


export const { signIn, signOut, useSession } = authClient;
