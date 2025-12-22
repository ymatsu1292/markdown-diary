import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  //baseURL: process.env.NEXT_PUBLIC_APP_URL,
  basePath: "/mdiary/api/auth",
  baseURL: "https://rhyme.mine.nu/mdiary/api/auth",
})

export const { signIn, signOut, signUp, useSession } = authClient;

