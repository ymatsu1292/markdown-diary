import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  basePath: process.env.NEXT_PUBLIC_BASE_PATH + "/api/auth",
  baseURL: process.env.NEXT_PUBLIC_BASE_URL + "/api/auth",
})

export const { signIn, signOut, signUp, useSession } = authClient;

