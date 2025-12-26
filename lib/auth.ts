import { betterAuth } from "better-auth";
import Database from "better-sqlite3";

export const auth = betterAuth({
  basePath: process.env.NEXT_PUBLIC_BASE_PATH + "/api/auth",
  baseURL: process.env.NEXT_PUBLIC_BASE_URL + "/api/auth",
  database: new Database("database.sqlite"),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigin: [],
  plugins: [],
});
