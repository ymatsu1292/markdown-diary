import { betterAuth } from "better-auth";
import Database from "better-sqlite3";
import { admin, username } from "better-auth/plugins";

export const auth = betterAuth({
  database: new Database("database.sqlite"),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigin: [
    "http://192.168.252.104:3000",
  ],
  plugins: [
    username(),
    admin()
  ]
});
