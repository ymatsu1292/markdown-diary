import { createAuthClient } from "better-auth/react";
import { adminClient, usernameClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  basePath: process.env.NEXT_PUBLIC_BASE_PATH + "/api/auth",
  baseURL: process.env.NEXT_PUBLIC_BASE_URL + "/api/auth",
  plugins: [
    adminClient(), usernameClient()
  ],
})

export const { signIn, signOut, signUp, useSession } = authClient;

