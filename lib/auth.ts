import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  //basePath: "/mdiary/api/auth",
  //baseURL: "https://rhyme.mine.nu/mdiary/api/auth",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH + "/api/auth",
  baseURL: process.env.NEXT_PUBLIC_BASE_URL + "/api/auth",
  database: new Database("database.sqlite"),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    gitlab: {
      clientId: process.env.GITLAB_CLIENT_ID as string,
      clientSecret: process.env.GITLAB_CLIENT_SECRET as string,
      issuer: process.env.GITLAB_ISSUER as string,
    },
  },
  trustedOrigin: [
    "http://192.168.252.104:3000",
  ],
  plugins: []
});
